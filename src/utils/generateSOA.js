import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { terbilang } from './terbilang';

// ── Warna ──────────────────────────────────────────────────────────────
const DARK_BLUE  = 'FF1F3864';
const TABLE_HEAD = 'FF2D2D2D'; // Warna gelap seperti di PDF
const DARK_RED   = 'FFC00000';
const WHITE      = 'FFFFFFFF';
const LIGHT_GRAY = 'FFF2F2F2';
const BORDER_CLR = 'FFD0D0D0';
const TEXT_DARK  = 'FF1E293B';
const TEXT_GRAY  = 'FF64748B';

function getImageDimensions(base64) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: 100, h: 40 }); // fallback
    img.src = base64;
  });
}

// ── Helper style ────────────────────────────────────────────────────────
const bd = (style = 'thin', color = BORDER_CLR) => ({ style, color: { argb: color } });

function borderAll(style = 'thin') {
  const s = bd(style);
  return { top: s, left: s, bottom: s, right: s };
}
function borderTable() {
  // border semua sisi tipis, warna abu
  return borderAll('thin');
}

const AC = { horizontal: 'center', vertical: 'middle', wrapText: false };
const AR = { horizontal: 'right',  vertical: 'middle' };
const AL = { horizontal: 'left',   vertical: 'middle' };

function fillSolid(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

/**
 * Generate Statement of Account → file .xlsx
 * Layout persis sesuai referensi (lihat gambar)
 *
 * Kolom: A=No  B=No Invoice  C=Tgl Invoice  D=Jatuh Tempo  E=Nominal(Rp)  F=Umur(hari)
 * Tabel mulai B (agar ada margin kiri seperti referensi)
 */
export async function generateSOA(company, cust, rows, statusFilter) {
  const wb    = new ExcelJS.Workbook();
  wb.creator  = 'SOA Generator';
  wb.created  = new Date();

  const ws = wb.addWorksheet('Statement', {
    views       : [{ showGridLines: false }],
    pageSetup   : { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  });

  // ── Lebar kolom ──────────────────────────────────────────────
  // A (margin kiri kecil), B(No + label Kepada/ID),
  // C(No Invoice), D(Tgl Invoice), E(Jatuh Tempo),
  // F(Nominal Rp), G(Umur hari), H (margin kanan)
  ws.columns = [
    { key: 'A', width: 3.5  },  // A - margin kiri
    { key: 'B', width: 8    },  // B - No
    { key: 'C', width: 14   },  // C - No Invoice
    { key: 'D', width: 13   },  // D - Tgl Invoice
    { key: 'E', width: 13   },  // E - Tgl Jatuh Tempo
    { key: 'F', width: 12   },  // F - Termin
    { key: 'G', width: 16   },  // G - Nominal (Rp)
    { key: 'H', width: 11   },  // H - Jatuh Tempo (hari)
    { key: 'I', width: 3.5  },  // I - margin kanan
  ];

  // ═══════════════════════════════════════════════════════════════
  // BARIS 1 — Spacer Logo (jika ada)
  // ═══════════════════════════════════════════════════════════════
  let hasLogo = false;
  let logoHeight = 40;
  if (company.logo) {
    try {
      const match = company.logo.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (match) {
        let ext = match[1];
        if (ext === 'jpg') ext = 'jpeg';
        const imageId = wb.addImage({
          base64: company.logo,
          extension: ext,
        });
        
        // Calculate aspect ratio so it doesn't look squashed
        const dims = await getImageDimensions(company.logo);
        const imgH = 40; // Fixed height in Excel rows
        const imgW = (dims.w * imgH) / dims.h;
        logoHeight = imgH;
        
        ws.addImage(imageId, {
          tl: { col: 1, row: 0 }, // B1
          ext: { width: imgW, height: imgH },
        });
        hasLogo = true;
      }
    } catch (e) { console.error(e); }
  }

  ws.getRow(1).height = hasLogo ? logoHeight + 5 : 10;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 2-4 — Company Info (Kiri) & TO Block (Kanan)
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(2).height = 18;
  const c2B = ws.getCell('B2');
  c2B.value = company.name || 'Company Name';
  c2B.font  = { bold: true, size: 14, name: 'Calibri', color: { argb: TEXT_DARK } };
  c2B.alignment = AL;

  ws.mergeCells('F2:H2');
  const c2F = ws.getCell('F2');
  c2F.value = 'Statement of Accounts';
  c2F.font  = { bold: true, size: 18, name: 'Calibri', color: { argb: TEXT_DARK } };
  c2F.alignment = { horizontal: 'right', vertical: 'bottom' };

  ws.getRow(3).height = 15;
  const c3B = ws.getCell('B3');
  c3B.value = company.address || '';
  c3B.font  = { size: 9, name: 'Calibri', color: { argb: TEXT_GRAY } };
  c3B.alignment = AL;

  ws.mergeCells('F3:H3');
  const c3F = ws.getCell('F3');
  const dateStr = `As of ${new Date().toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}`;
  c3F.value = dateStr;
  c3F.font  = { size: 9, name: 'Calibri', color: { argb: TEXT_GRAY } };
  c3F.alignment = { horizontal: 'right', vertical: 'middle' };
  
  // Berikan garis bawah pada baris tanggal
  c3F.border = { bottom: bd('medium', BORDER_CLR) };

  ws.getRow(4).height = 15;
  const c4B = ws.getCell('B4');
  c4B.value = company.telp ? `Telp: ${company.telp}` : '';
  c4B.font  = { size: 9, name: 'Calibri', color: { argb: TEXT_GRAY } };
  c4B.alignment = AL;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 6-8 — TO (Kepada) (Kanan, di atas tabel)
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(6).height = 15;
  ws.mergeCells('F6:H6');
  const c6F = ws.getCell('F6');
  c6F.value = 'Kepada :';
  c6F.font  = { bold: true, size: 10, name: 'Calibri', color: { argb: TEXT_DARK } };
  c6F.alignment = AL;

  ws.getRow(7).height = 15;
  ws.mergeCells('F7:H7');
  const c7F = ws.getCell('F7');
  c7F.value = cust.name;
  c7F.font  = { bold: true, size: 11, name: 'Calibri', color: { argb: TEXT_DARK } };
  c7F.alignment = AL;

  if (cust.id && cust.id !== '-') {
    ws.getRow(8).height = 15; // Shift spacer down if id exists
    ws.mergeCells('F8:H8');
    const c8F = ws.getCell('F8');
    c8F.value = `ID Customer: ${cust.id}`;
    c8F.font  = { size: 9, name: 'Calibri', color: { argb: TEXT_DARK } };
    c8F.alignment = AL;
  }

  // ═══════════════════════════════════════════════════════════════
  // BARIS 8 — Spacer
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(8).height = 10;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 9 — Header tabel
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(9).height = 28;
  const tblHeaders = [
    { col: 'B', label: 'No',           align: AC },
    { col: 'C', label: 'No Invoice',   align: AC },
    { col: 'D', label: 'Tgl Invoice',  align: AC },
    { col: 'E', label: 'Tgl Jatuh Tempo',  align: AC },
    { col: 'F', label: 'Termin',       align: AC },
    { col: 'G', label: 'Sisa Tagihan', align: AC },
    { col: 'H', label: 'Jatuh Tempo',  align: AC },
  ];
  tblHeaders.forEach(({ col, label, align }) => {
    const cell    = ws.getCell(`${col}9`);
    cell.value    = label;
    cell.font     = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
    cell.fill     = fillSolid(TABLE_HEAD);
    cell.alignment= align;
    cell.border   = borderTable();
  });

  // ═══════════════════════════════════════════════════════════════
  // BARIS DATA (mulai row 10)
  // ═══════════════════════════════════════════════════════════════
  const DATA_START = 10;
  let   totalNominal = 0;

  rows.forEach((r, idx) => {
    const rowNum = DATA_START + idx;
    ws.getRow(rowNum).height = 22;
    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY;

    // Kolom B: No
    setDataCell(ws, rowNum, 'B', idx + 1, bg, { ...AC });

    // Kolom C: No Invoice
    setDataCell(ws, rowNum, 'C', r.noInvoice, bg, { ...AC });

    // Kolom D: Tgl Invoice
    setDataCell(ws, rowNum, 'D', r.tglInvoice, bg, { ...AC });

    // Kolom E: Tgl Jatuh Tempo
    setDataCell(ws, rowNum, 'E', r.jatuhTempo, bg, { ...AC });

    // Kolom F: Termin
    const tNameFormat = r.terminName ? r.terminName.replace(/Termin\s+/i, '').replace(/\s*\(\d+%\)/, '') : '-';
    setDataCell(ws, rowNum, 'F', tNameFormat, bg, { ...AC });

    // Kolom G: Nominal
    const cellG = ws.getCell(rowNum, colIndex('G'));
    cellG.value     = r.nominal;
    cellG.numFmt    = '#,##0';
    cellG.fill      = fillSolid(bg);
    cellG.alignment = AR;
    cellG.border    = borderTable();
    cellG.font      = { name: 'Calibri' };

    // Kolom H: Umur
    setDataCell(ws, rowNum, 'H', r.umur, bg, { ...AC });

    totalNominal += r.nominal;
  });

  // ═══════════════════════════════════════════════════════════════
  // BARIS TOTAL — langsung 1 baris setelah data terakhir
  // ═══════════════════════════════════════════════════════════════
  const lastDataRow = DATA_START + rows.length - 1;
  const TOTAL_ROW   = lastDataRow + 2; // lompat 1 baris kosong saja

  // Baris pemisah (1 baris kosong antara data dan total)
  ws.getRow(lastDataRow + 1).height = 8;

  // ═══════════════════════════════════════════════════════════════
  // BARIS TOTAL TAGIHAN (simetris B:G penuh seperti tabel)
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(TOTAL_ROW).height = 22;
  const labelTotal = statusFilter === 'CLOSE' ? 'TOTAL TAGIHAN CLOSE' : 'TOTAL TAGIHAN';

  ws.mergeCells(`B${TOTAL_ROW}:F${TOTAL_ROW}`);
  const cellTotLabel = ws.getCell(`B${TOTAL_ROW}`);
  cellTotLabel.value     = labelTotal;
  cellTotLabel.font      = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
  cellTotLabel.fill      = fillSolid(DARK_RED);
  cellTotLabel.alignment = AC;

  const cellTotVal = ws.getCell(`G${TOTAL_ROW}`);
  cellTotVal.value     = totalNominal;
  cellTotVal.font      = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 12 };
  cellTotVal.fill      = fillSolid(DARK_RED);
  cellTotVal.alignment = { horizontal: 'right', vertical: 'middle' };
  cellTotVal.numFmt    = '#,##0';

  // H kosong
  const cellTotEmpty = ws.getCell(`H${TOTAL_ROW}`);
  cellTotEmpty.fill = fillSolid(DARK_RED);
  cellTotEmpty.border = borderTable();
  cellTotEmpty.alignment = AC;

  // ═══════════════════════════════════════════════════════════════
  // Terbilang, Hormat kami
  // ═══════════════════════════════════════════════════════════════
  const terbilangRow = TOTAL_ROW + 2;
  ws.getRow(terbilangRow).height = 20;
  ws.mergeCells(`B${terbilangRow}:E${terbilangRow}`);
  const cellTerbilang = ws.getCell(`B${terbilangRow}`);
  cellTerbilang.value     = `Terbilang: ${terbilang(totalNominal)}`;
  cellTerbilang.font      = { italic: true, size: 10, name: 'Calibri', color: { argb: TEXT_GRAY } };
  cellTerbilang.alignment = AL;

  const hormatRow = terbilangRow + 3;
  ws.getRow(hormatRow).height = 20;
  ws.mergeCells(`G${hormatRow}:H${hormatRow}`);
  const cellHormat = ws.getCell(`G${hormatRow}`);
  cellHormat.value     = 'Hormat kami,';
  cellHormat.font      = { size: 10, name: 'Calibri', color: { argb: TEXT_DARK } };
  cellHormat.alignment = { horizontal: 'center', vertical: 'middle' };

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeFileName = cust.name.replace(/[^a-zA-Z0-9_\-. ]/g, '').replace(/\s+/g, '_');
  saveAs(blob, `SOA_${safeFileName}.xlsx`);
}

// ── Helper: set cell data pada tabel ──────────────────────────
function setDataCell(ws, row, col, value, bgArgb, alignment) {
  const cell    = ws.getCell(`${col}${row}`);
  cell.value    = value;
  cell.fill     = fillSolid(bgArgb);
  cell.border   = borderAll('thin');
  cell.alignment= alignment;
  cell.font     = { name: 'Calibri' };
}

// Konversi huruf kolom ke index (A=1, B=2, ...)
function colIndex(col) {
  return col.toUpperCase().charCodeAt(0) - 64;
}
