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
export async function generateSOA(company, cust, rows, statusFilter, exportColumns = null) {
  const cols = exportColumns || { no: true, customerId: true, namaCustomer: true, noInvoice: true, tglInvoice: true, jatuhTempo: true, nominal: true, termin1: true, termin2: true, termin3: true, status: true, tglClose: true, umur: true };

  const ALL_DEFS = [
    { key: 'no', label: 'No', width: 8, align: AC, render: (r, i) => i + 1 },
    { key: 'customerId', label: 'Customer ID', width: 15, align: AC, render: r => r.customerId },
    { key: 'namaCustomer', label: 'Nama Customer', width: 25, align: AL, render: r => r.namaCustomer },
    { key: 'noInvoice', label: 'No Invoice', width: 14, align: AC, render: r => r.noInvoice },
    { key: 'tglInvoice', label: 'Tgl Invoice', width: 13, align: AC, render: r => r.tglInvoice },
    { key: 'jatuhTempo', label: 'Tgl Jatuh Tempo', width: 16, align: AC, render: r => r.jatuhTempo },
    { key: 'nominal', label: 'Total Tagihan', width: 16, align: AR, isNominal: true, isNum: true, render: r => r.nominal },
    { key: 'termin1', label: 'Termin 1', width: 13, align: AR, isNum: true, render: r => r.termin1 },
    { key: 'termin2', label: 'Termin 2', width: 13, align: AR, isNum: true, render: r => r.termin2 },
    { key: 'termin3', label: 'Termin 3', width: 13, align: AR, isNum: true, render: r => r.termin3 },
    { key: 'status', label: 'Status', width: 12, align: AC, render: r => r.status === 'LUNAS' ? 'CLOSE' : r.status },
    { key: 'tglClose', label: 'Tgl Close', width: 13, align: AC, render: r => r.tglClose || '-' },
    { key: 'umur', label: 'Jatuh Tempo (hari)', width: 13, align: AC, render: r => r.umur },
  ];

  const activeDefs = ALL_DEFS.filter(d => cols[d.key]);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lastDataCol = alphabet[activeDefs.length];
  const rightLabelStartCol = activeDefs.length >= 3 ? alphabet[activeDefs.length - 2] : alphabet[1];

  const wb    = new ExcelJS.Workbook();
  wb.creator  = 'SOA Generator';
  wb.created  = new Date();

  const ws = wb.addWorksheet('Statement', {
    views       : [{ showGridLines: false }],
    pageSetup   : { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  });

  const excelCols = [{ key: 'A', width: 3.5 }];
  activeDefs.forEach((def, i) => {
    def.colIdx = alphabet[i + 1];
    excelCols.push({ key: def.colIdx, width: def.width });
  });
  excelCols.push({ key: alphabet[activeDefs.length + 1], width: 3.5 });
  ws.columns = excelCols;

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

  ws.mergeCells(`${rightLabelStartCol}2:${lastDataCol}2`);
  const c2F = ws.getCell(`${rightLabelStartCol}2`);
  c2F.value = 'Statement of Accounts';
  c2F.font  = { bold: true, size: 18, name: 'Calibri', color: { argb: TEXT_DARK } };
  c2F.alignment = { horizontal: 'right', vertical: 'bottom' };

  ws.getRow(3).height = 15;
  const c3B = ws.getCell('B3');
  c3B.value = company.address || '';
  c3B.font  = { size: 9, name: 'Calibri', color: { argb: TEXT_GRAY } };
  c3B.alignment = AL;

  ws.mergeCells(`${rightLabelStartCol}3:${lastDataCol}3`);
  const c3F = ws.getCell(`${rightLabelStartCol}3`);
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
  // BARIS 5-7 — TO (Kepada) (Kanan, di atas tabel)
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(5).height = 15;
  ws.mergeCells(`${rightLabelStartCol}5:${lastDataCol}5`);
  const c5F = ws.getCell(`${rightLabelStartCol}5`);
  c5F.value = 'Kepada :';
  c5F.font  = { bold: true, size: 10, name: 'Calibri', color: { argb: TEXT_DARK } };
  c5F.alignment = AL;

  ws.getRow(6).height = 15;
  ws.mergeCells(`${rightLabelStartCol}6:${lastDataCol}6`);
  const c6F = ws.getCell(`${rightLabelStartCol}6`);
  c6F.value = cust.name;
  c6F.font  = { bold: true, size: 11, name: 'Calibri', color: { argb: TEXT_DARK } };
  c6F.alignment = AL;

  if (cust.id && cust.id !== '-') {
    ws.getRow(7).height = 15;
    ws.mergeCells(`${rightLabelStartCol}7:${lastDataCol}7`);
    const c7F = ws.getCell(`${rightLabelStartCol}7`);
    c7F.value = `ID Customer: ${cust.id}`;
    c7F.font  = { size: 9, name: 'Calibri', color: { argb: TEXT_DARK } };
    c7F.alignment = AL;
  }

  // ═══════════════════════════════════════════════════════════════
  // BARIS 8 — Spacer
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(8).height = 10;

  // ═══════════════════════════════════════════════════════════════
  // BARIS 9 — Header tabel
  // ═══════════════════════════════════════════════════════════════
  ws.getRow(9).height = 28;
  activeDefs.forEach((def) => {
    const cell = ws.getCell(`${def.colIdx}9`);
    cell.value = def.label;
    cell.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
    cell.fill = fillSolid(TABLE_HEAD);
    cell.alignment = def.align;
    cell.border = borderTable();
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

    activeDefs.forEach((def) => {
      const val = def.render(r, idx);
      const cell = ws.getCell(`${def.colIdx}${rowNum}`);
      if (def.isNum) {
        if (val) { cell.value = val; cell.numFmt = '#,##0'; }
        else { cell.value = '-'; }
      } else {
        cell.value = val;
      }
      cell.fill = fillSolid(bg);
      cell.alignment = def.align;
      cell.border = borderTable();
      cell.font = { name: 'Calibri' };
    });

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

  const nominalDefIndex = activeDefs.findIndex(d => d.isNominal);
  if (nominalDefIndex !== -1) {
    const nominalColLetter = alphabet[nominalDefIndex + 1];
    
    const mergeStartCol = alphabet[1]; // B
    const mergeEndCol = alphabet[nominalDefIndex]; // Col before nominal
    if (nominalDefIndex > 0) {
      ws.mergeCells(`${mergeStartCol}${TOTAL_ROW}:${mergeEndCol}${TOTAL_ROW}`);
      const cellTotLabel = ws.getCell(`${mergeStartCol}${TOTAL_ROW}`);
      cellTotLabel.value = labelTotal;
      cellTotLabel.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
      cellTotLabel.fill = fillSolid(DARK_RED);
      cellTotLabel.alignment = AC;
    }

    const cellTotVal = ws.getCell(`${nominalColLetter}${TOTAL_ROW}`);
    cellTotVal.value = totalNominal;
    cellTotVal.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 12 };
    cellTotVal.fill = fillSolid(DARK_RED);
    cellTotVal.alignment = { horizontal: 'right', vertical: 'middle' };
    cellTotVal.numFmt = '#,##0';

    // Sisa kosong di kanan
    for (let i = nominalDefIndex + 1; i < activeDefs.length; i++) {
      const emptyCell = ws.getCell(`${alphabet[i + 1]}${TOTAL_ROW}`);
      emptyCell.fill = fillSolid(DARK_RED);
      emptyCell.border = borderTable();
      emptyCell.alignment = AC;
    }
  }

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
