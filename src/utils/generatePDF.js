import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { terbilang } from './terbilang';

// ── Warna (r,g,b) ───────────────────────────────────────────────
const DARK_BLUE  = [31,  56,  100];
const DARK_RED   = [192,   0,    0];
const WHITE      = [255, 255,  255];
const LIGHT_GRAY = [242, 242,  242];
const TEXT_GRAY  = [100, 116,  139];
const TEXT_DARK  = [ 30,  41,   59];

function formatRp(num) {
  return new Intl.NumberFormat('id-ID').format(Math.round(num || 0));
}

/**
 * Generate Statement of Account sebagai PDF.
 *
 * Lebar kolom tabel (mm), total = contentW = 180:
 *   No(12) + No Invoice(36) + Tgl Invoice(28) + Jatuh Tempo(28) + Nominal(48) + Umur(28) = 180
 *
 * Posisi kotak total harus persis sama: mulai di margin (15) lebar 180mm.
 */
export function generatePDF(company, cust, rows, statusFilter) {
  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW    = doc.internal.pageSize.getWidth();  // 210
  const margin   = 15;
  const contentW = pageW - margin * 2;                // 180

  // Lebar tiap kolom — harus konsisten antara tabel dan total bar
  const COL_W = [12, 36, 28, 28, 48, 28]; // No, NoInv, TglInv, JatuhTempo, Nominal, Umur
  // total = 180 ✓

  // X start tiap kolom (absolute dari kiri halaman)
  const colX = COL_W.reduce((acc, w, i) => {
    acc.push(i === 0 ? margin : acc[i - 1] + COL_W[i - 1]);
    return acc;
  }, []);

  let y = 14;

  // ═══════════════════════════════════════════════════════════════
  // JUDUL
  // ═══════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_DARK);
  doc.text('STATEMENT OF ACCOUNT', pageW / 2, y, { align: 'center' });
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  doc.text(
    `${company.name}  |  ${company.address}  |  Telp ${company.telp}`,
    pageW / 2, y, { align: 'center' }
  );
  y += 8;

  // Garis pemisah
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // ═══════════════════════════════════════════════════════════════
  // KEPADA & STATUS
  // ═══════════════════════════════════════════════════════════════
  const boxH     = 10;   // tinggi kotak nama customer
  const custBoxW = 80;   // lebar kotak nama customer
  const padding  = 3;    // padding kiri dalam kotak

  // Titik awal X yang sama untuk "Kepada :" dan "ID Customer:"
  // Keduanya dimulai dari margin (kiri halaman)
  const infoX = margin;

  // Baris 1: "Kepada :" lalu kotak nama customer
  const kepY = y + boxH / 2 + 1.8;  // baseline vertikal

  // Label "Kepada :" — rata kiri mulai dari margin
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Kepada :', infoX, kepY);

  // Ukur lebar teks "Kepada :" agar kotak mulai tepat setelah label
  const kepLabelW = doc.getTextWidth('Kepada :');
  const custBoxX  = infoX + kepLabelW + 4;  // 4mm jarak label ke kotak

  // Kotak border nama customer
  doc.setDrawColor(...TEXT_DARK);
  doc.setLineWidth(0.5);
  doc.rect(custBoxX, y, custBoxW, boxH);

  // Nama customer RATA KIRI di dalam kotak
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_BLUE);
  doc.text(cust.name, custBoxX + padding, kepY, { align: 'left' });

  // Status di kanan (sejajar vertikal)
  const statusText   = statusFilter === 'OPEN'  ? 'Open' :
                       statusFilter === 'CLOSE' ? 'Close' : 'Open/Close';
  const statusLabelX = pageW - margin - 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Status :', statusLabelX, kepY);
  doc.setFont('helvetica', 'normal');
  doc.text(statusText, statusLabelX + 22, kepY);

  y += boxH + 4;

  // Baris 2: "ID Customer:" — mulai dari margin yang SAMA dengan "Kepada :"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`ID Customer: ${cust.id}`, infoX, y);
  y += 9;

  // ═══════════════════════════════════════════════════════════════
  // TABEL DATA
  // ═══════════════════════════════════════════════════════════════
  const totalNominal = rows.reduce((s, r) => s + r.nominal, 0);

  const tableData = rows.map((r, i) => [
    i + 1,
    r.noInvoice,
    r.tglInvoice,
    r.jatuhTempo,
    formatRp(r.nominal),
    r.umur,
  ]);

  // Simpan tableStartX agar total bar bisa disejajarkan
  let tableLeft  = margin;
  let tableRight = margin + contentW;

  autoTable(doc, {
    startY      : y,
    head        : [['No', 'No Invoice', 'Tgl Invoice', 'Jatuh Tempo', 'Nominal (Rp)', 'Umur (hari)']],
    body        : tableData,
    margin      : { left: margin, right: margin },
    tableWidth  : contentW,

    columnStyles: {
      0: { cellWidth: COL_W[0], halign: 'center' },
      1: { cellWidth: COL_W[1], halign: 'center' },
      2: { cellWidth: COL_W[2], halign: 'center' },
      3: { cellWidth: COL_W[3], halign: 'center' },
      4: { cellWidth: COL_W[4], halign: 'center' }, // Nominal — center
      5: { cellWidth: COL_W[5], halign: 'center' },
    },

    headStyles: {
      fillColor  : DARK_BLUE,
      textColor  : WHITE,
      fontStyle  : 'bold',
      fontSize   : 10,
      halign     : 'center',
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      lineColor  : [160, 160, 160],
      lineWidth  : 0.2,
    },

    bodyStyles: {
      fontSize   : 9.5,
      textColor  : TEXT_DARK,
      cellPadding: { top: 3.5, bottom: 3.5, left: 2, right: 2 },
      lineColor  : [210, 210, 210],
      lineWidth  : 0.2,
    },

    alternateRowStyles: { fillColor: LIGHT_GRAY },

    // Ambil posisi aktual tabel setelah digambar (untuk total bar)
    didDrawTable(data) {
      tableLeft  = data.settings.margin.left;
      tableRight = tableLeft + data.table.width;
    },

    didDrawPage(data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_GRAY);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount}`,
        pageW - margin,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    },
  });

  y = doc.lastAutoTable.finalY + 2;

  // ═══════════════════════════════════════════════════════════════
  // TOTAL BAR — lebar PERSIS sama dengan tabel (margin ~ margin)
  // ═══════════════════════════════════════════════════════════════
  const totalBarH  = 11;
  const totalBarX  = margin;           // sama persis dengan tabel kiri
  const totalBarW  = contentW;         // sama persis dengan tabel lebar

  // Background merah penuh
  doc.setFillColor(...DARK_RED);
  doc.rect(totalBarX, y, totalBarW, totalBarH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);

  const labelTotal = statusFilter === 'CLOSE'
    ? 'TOTAL TAGIHAN CLOSE'
    : 'TOTAL TAGIHAN BELUM CLOSE';

  // Lebar area label = kolom No + No Invoice + Tgl Invoice + Jatuh Tempo
  const labelAreaW = COL_W[0] + COL_W[1] + COL_W[2] + COL_W[3]; // 12+36+28+28 = 104
  // Label di tengah area kolom 0–3
  doc.text(
    labelTotal,
    totalBarX + labelAreaW / 2,
    y + totalBarH / 2 + 1.8,
    { align: 'center' }
  );

  // Nominal di tengah area kolom 4 (Nominal)
  // X start kolom Nominal = margin + COL_W[0]+[1]+[2]+[3] = 15 + 104 = 119
  const nominalColX  = totalBarX + labelAreaW;
  const nominalColW  = COL_W[4]; // 48
  doc.text(
    formatRp(totalNominal),
    nominalColX + nominalColW / 2,
    y + totalBarH / 2 + 1.8,
    { align: 'center' }
  );

  // Kolom Umur di total bar tetap merah kosong (sudah tercakup rect penuh)

  y += totalBarH + 6;

  // ═══════════════════════════════════════════════════════════════
  // TERBILANG
  // ═══════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  // Wrap teks terbilang agar tidak keluar margin
  const terbilangText = `Terbilang: ${terbilang(totalNominal)}`;
  const terbilangLines = doc.splitTextToSize(terbilangText, contentW);
  doc.text(terbilangLines, margin, y);
  y += terbilangLines.length * 5 + 4;

  // ═══════════════════════════════════════════════════════════════
  // PESAN
  // ═══════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    'Mohon segera melakukan pembayaran sebelum jatuh tempo. Terima kasih.',
    margin, y
  );
  y += 12;

  // ═══════════════════════════════════════════════════════════════
  // HORMAT KAMI
  // ═══════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  // Posisikan di kolom Umur (kanan) — sejajar dengan kolom terakhir tabel
  const hormatX = totalBarX + labelAreaW + nominalColW + COL_W[5] / 2;
  doc.text('Hormat kami,', hormatX, y, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════
  const safeFileName = cust.name.replace(/[^a-zA-Z0-9_\-. ]/g, '').replace(/\s+/g, '_');
  doc.save(`SOA_${safeFileName}.pdf`);
}
