import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { terbilang } from './terbilang';

// ── Warna ──────────────────────────────────────────────────────────────
const DARK_BLUE  = 'FF1F3864';
const DARK_RED   = 'FFC00000';
const WHITE      = 'FFFFFFFF';
const LIGHT_GRAY = 'FFF2F2F2';
const BORDER_CLR = 'FFD0D0D0';

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
    { key: 'A', width: 3.5  },  // A - margin kiri (tidak berubah)
    { key: 'B', width: 11   },  // B - cukup untuk "Kepada :" + No tabel
    { key: 'C', width: 16   },  // C - No Invoice
    { key: 'D', width: 14   },  // D - Tgl Invoice
    { key: 'E', width: 14   },  // E - Jatuh Tempo
    { key: 'F', width: 17   },  // F - Nominal (Rp)
    { key: 'G', width: 13   },  // G - Umur (hari)
    { key: 'H', width: 3.5  },  // H - margin kanan
  ];

  // ═══════════════════════════════════════════════════════════════
  // BARIS 1 — Judul STATEMENT OF ACCOUNT
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(1).height = 40;
  ws.mergeCells('A1:H1');
  const r1 = ws.getCell('A1');
  r1.value     = 'STATEMENT OF ACCOUNT';
  r1.font      = { bold: true, size: 16, name: 'Calibri' };
  r1.alignment = AC;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 2 — Info perusahaan
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(2).height = 20;
  ws.mergeCells('A2:H2');
  const r2 = ws.getCell('A2');
  r2.value     = `${company.name}  |  ${company.address}  |  Telp ${company.telp}`;
  r2.font      = { size: 10, name: 'Calibri' };
  r2.alignment = AC;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 3 — Kosong (spacer)
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(3).height = 10;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 4 — Kepada & Status
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(4).height = 28;

  // "Kepada :" — di B4, kolom B cukup lebar (11) agar teks tidak terpotong
  // Simetris dengan "ID Customer:" di B5
  const c4B = ws.getCell('B4');
  c4B.value     = 'Kepada :';
  c4B.font      = { bold: true, name: 'Calibri' };
  c4B.alignment = { horizontal: 'left', vertical: 'middle' };

  // Nama customer — merge C4:E4, border box, teks rata kiri
  ws.mergeCells('C4:E4');
  const c4C = ws.getCell('C4');
  c4C.value     = cust.name;
  c4C.font      = { bold: true, size: 12, name: 'Calibri' };
  c4C.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  c4C.border    = {
    top   : bd('thin', 'FF000000'),
    left  : bd('thin', 'FF000000'),
    bottom: bd('thin', 'FF000000'),
    right : bd('thin', 'FF000000'),
  };

  // "Status :" di kolom F (kanan)
  const c4F = ws.getCell('F4');
  c4F.value     = 'Status :';
  c4F.font      = { bold: true, name: 'Calibri' };
  c4F.alignment = { horizontal: 'right', vertical: 'middle' };

  // Nilai status di kolom G
  const statusText = statusFilter === 'OPEN' ? 'Open' : statusFilter === 'CLOSE' ? 'Close' : 'Open/Close';
  const c4G = ws.getCell('G4');
  c4G.value     = statusText;
  c4G.font      = { name: 'Calibri' };
  c4G.alignment = AL;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 5 — ID Customer
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(5).height = 20;
  // Merge B5:E5 — mulai dari B, simetris dengan "Kepada :" di B4
  ws.mergeCells('B5:E5');
  const c5B = ws.getCell('B5');
  c5B.value = `ID Customer: ${cust.id}`;
  c5B.font  = { bold: true, name: 'Calibri' };
  c5B.alignment = AL;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 6 — Kosong (spacer)
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(6).height = 10;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 7 — Header tabel
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(7).height = 28;
  const tblHeaders = [
    { col: 'B', label: 'No',           align: AC },
    { col: 'C', label: 'No Invoice',   align: AC },
    { col: 'D', label: 'Tgl Invoice',  align: AC },
    { col: 'E', label: 'Tgl Jatuh Tempo',  align: AC },
    { col: 'F', label: 'Nominal (Rp)', align: AC },
    { col: 'G', label: 'Jatuh Tempo',  align: AC },
  ];
  tblHeaders.forEach(({ col, label, align }) => {
    const cell    = ws.getCell(`${col}7`);
    cell.value    = label;
    cell.font     = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
    cell.fill     = fillSolid(DARK_BLUE);
    cell.alignment= align;
    cell.border   = borderTable();
  });

  // ═══════════════════════════════════════════════════════════════
  // BARIS DATA (mulai row 8)
  // ═══════════════════════════════════════════════════════════════
  const DATA_START = 8;
  let   totalNominal = 0;

  rows.forEach((r, idx) => {
    const rowNum = DATA_START + idx;
    ws.getRow(rowNum).height = 22;
    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY;

    // Kolom B: No
    setDataCell(ws, rowNum, 'B', idx + 1, bg, { ...AC });

    // Kolom C: No Invoice
    setDataCell(ws, rowNum, 'C', r.noInvoice, bg, { ...AC });

    // Kolom D: Tgl Invoice — simpan sebagai string agar tidak berubah format
    setDataCell(ws, rowNum, 'D', r.tglInvoice, bg, { ...AC });

    // Kolom E: Jatuh Tempo
    setDataCell(ws, rowNum, 'E', r.jatuhTempo, bg, { ...AC });

    // Kolom F: Nominal — simpan sebagai number, format #,##0
    const cellF = ws.getCell(rowNum, colIndex('F'));
    cellF.value     = r.nominal;
    cellF.numFmt    = '#,##0';
    cellF.fill      = fillSolid(bg);
    cellF.alignment = AR;
    cellF.border    = borderTable();
    cellF.font      = { name: 'Calibri' };

    // Kolom G: Umur
    setDataCell(ws, rowNum, 'G', r.umur, bg, { ...AC });

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
  ws.getRow(TOTAL_ROW).height = 30;
  const labelTotal = statusFilter === 'CLOSE' ? 'TOTAL TAGIHAN CLOSE' : 'TOTAL TAGIHAN BELUM CLOSE';

  ws.mergeCells(`B${TOTAL_ROW}:E${TOTAL_ROW}`);
  const cellTotLabel = ws.getCell(`B${TOTAL_ROW}`);
  cellTotLabel.value     = labelTotal;
  cellTotLabel.font      = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
  cellTotLabel.fill      = fillSolid(DARK_RED);
  cellTotLabel.alignment = AC;

  const cellTotVal = ws.getCell(`F${TOTAL_ROW}`);
  cellTotVal.value     = totalNominal;
  cellTotVal.numFmt    = '#,##0';
  cellTotVal.font      = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
  cellTotVal.fill      = fillSolid(DARK_RED);
  cellTotVal.alignment = AC;

  const cellTotG = ws.getCell(`G${TOTAL_ROW}`);
  cellTotG.fill      = fillSolid(DARK_RED);
  cellTotG.border    = borderTable();
  cellTotG.alignment = AC;

  // ═══════════════════════════════════════════════════════════════
  // Terbilang, Pesan, Hormat kami
  // ═══════════════════════════════════════════════════════════════
  const terbilangRow = TOTAL_ROW + 2;
  ws.getRow(terbilangRow).height = 20;
  ws.mergeCells(`B${terbilangRow}:H${terbilangRow}`);
  const cellTerbilang = ws.getCell(`B${terbilangRow}`);
  cellTerbilang.value     = `Terbilang: ${terbilang(totalNominal)}`;
  cellTerbilang.font      = { italic: true, size: 10, name: 'Calibri' };
  cellTerbilang.alignment = AL;

  const pesanRow = terbilangRow + 2;
  ws.getRow(pesanRow).height = 20;
  ws.mergeCells(`B${pesanRow}:H${pesanRow}`);
  const cellPesan = ws.getCell(`B${pesanRow}`);
  cellPesan.value     = 'Mohon segera melakukan pembayaran sebelum jatuh tempo. Terima kasih.';
  cellPesan.font      = { name: 'Calibri' };
  cellPesan.alignment = AL;

  const hormatRow = pesanRow + 2;
  ws.getRow(hormatRow).height = 20;
  ws.mergeCells(`F${hormatRow}:H${hormatRow}`);
  const cellHormat = ws.getCell(`F${hormatRow}`);
  cellHormat.value     = 'Hormat kami,';
  cellHormat.font      = { name: 'Calibri' };
  cellHormat.alignment = AC;

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
