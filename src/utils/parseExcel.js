import * as XLSX from 'xlsx';

/**
 * Parse file Excel tagihan piutang.
 * Menggunakan raw:true agar angka & serial date tidak dikonversi salah.
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data  = new Uint8Array(e.target.result);
        // raw: true → angka tetap number, tanggal tetap serial number Excel
        // cellDates: false → kita handle sendiri agar format konsisten
        const wb    = XLSX.read(data, { type: 'array', raw: true, cellDates: false });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        // sheet_to_json dengan raw:true → value asli dari cell
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

        // Cari baris header (mengandung kata 'invoice')
        let headerRow = 3;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const joined = rows[i].map(String).join('|').toLowerCase();
          if (joined.includes('invoice')) { headerRow = i; break; }
        }

        const result = [];
        for (let i = headerRow + 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;

          // Kolom A harus berisi angka urut
          const noVal = r[0];
          if (noVal === '' || noVal === null || noVal === undefined) continue;
          const noNum = typeof noVal === 'number' ? noVal : Number(String(noVal).trim());
          if (isNaN(noNum) || noNum <= 0) continue;

          result.push({
            no          : noNum,
            customerId  : String(r[1] ?? '').trim(),
            namaCustomer: String(r[2] ?? '').trim(),
            noInvoice   : String(r[3] ?? '').trim(),
            tglInvoice  : excelDateToStr(r[4]),
            jatuhTempo  : excelDateToStr(r[5]),
            nominal     : parseNominal(r[6]),
            status      : String(r[7] ?? '').trim().toUpperCase(),
            tglLunas    : excelDateToStr(r[8]),
            umur        : parseUmur(r[9]),
          });
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Konversi nilai cell tanggal Excel ke string "dd/MM/yyyy"
 * Bisa berupa:
 *   - number (serial date Excel, misal 46019)
 *   - string (sudah dalam format tanggal, misal "17/06/2026" atau "2026-06-17")
 *   - Date object
 */
function excelDateToStr(val) {
  if (val === '' || val === null || val === undefined) return '';

  // Jika sudah string — coba normalkan ke dd/MM/yyyy
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return '';

    // Format: dd/MM/yyyy atau dd/MM/yy
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
      const [d, m, y] = s.split('/');
      const year = y.length === 2 ? '20' + y : y;
      return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${year}`;
    }

    // Format: yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-');
      return `${d}/${m}/${y}`;
    }

    // Format: MM/dd/yyyy (US)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const parts = s.split('/');
      // Heuristik: jika bagian pertama > 12, pasti hari; kalau tidak kita asumsikan MM/dd/yyyy
      if (Number(parts[0]) > 12) {
        return `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2]}`;
      }
      // Assume MM/dd/yyyy → dd/MM/yyyy
      return `${parts[1].padStart(2,'0')}/${parts[0].padStart(2,'0')}/${parts[2]}`;
    }

    return s;
  }

  // Jika number → serial date Excel
  if (typeof val === 'number') {
    // Excel serial: 1 = Jan 1 1900, dengan bug leap year 1900
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const dd = String(d.d).padStart(2, '0');
      const mm = String(d.m).padStart(2, '0');
      const yyyy = String(d.y);
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  // Jika Date object
  if (val instanceof Date) {
    const dd   = String(val.getDate()).padStart(2, '0');
    const mm   = String(val.getMonth() + 1).padStart(2, '0');
    const yyyy = String(val.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  return String(val).trim();
}

/**
 * Parse nominal — handle format Indonesia (1.234.567) maupun desimal (1234567.89)
 */
function parseNominal(val) {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number') return Math.round(val); // sudah number, bulatkan
  const s = String(val).trim();
  if (!s) return 0;

  // Deteksi format: jika ada koma sebelum titik atau koma di akhir ribuan
  // Format ID: 10.092.422 atau 10.092.422,50
  // Format EN: 10,092,422 atau 10,092,422.50
  const hasDot   = s.includes('.');
  const hasComma = s.includes(',');

  let cleaned;
  if (hasDot && hasComma) {
    // Tentukan mana desimal: yang terakhir muncul
    const lastDot   = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastDot > lastComma) {
      // EN format: 10,092,422.50 → hapus koma, titik jadi desimal
      cleaned = s.replace(/,/g, '');
    } else {
      // ID format: 10.092.422,50 → hapus titik, koma jadi desimal
      cleaned = s.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasDot && !hasComma) {
    // Bisa 10.092.422 (ID ribuan) atau 10.5 (desimal)
    const parts = s.split('.');
    if (parts.length > 2 || (parts[parts.length - 1].length === 3)) {
      // Titik sebagai pemisah ribuan: 10.092.422
      cleaned = s.replace(/\./g, '');
    } else {
      // Titik sebagai desimal: 10.5
      cleaned = s;
    }
  } else if (!hasDot && hasComma) {
    // Koma sebagai desimal: 10,5 — atau koma sebagai ribuan: 10,092,422
    const parts = s.split(',');
    if (parts.length > 2 || (parts[parts.length - 1].length === 3)) {
      cleaned = s.replace(/,/g, '');
    } else {
      cleaned = s.replace(',', '.');
    }
  } else {
    cleaned = s.replace(/[^0-9]/g, '');
  }

  return parseFloat(cleaned) || 0;
}

function parseUmur(val) {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number') return Math.round(val);
  const n = Number(String(val).replace(/[^0-9-]/g, ''));
  return isNaN(n) ? 0 : n;
}
