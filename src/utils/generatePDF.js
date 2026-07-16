import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { terbilang } from './terbilang';

const TEXT_DARK  = [ 30,  41,   59];
const TEXT_GRAY  = [100, 116,  139];
const BLACK      = [ 45,  45,   45];
const WHITE      = [255, 255,  255];
const LIGHT_GRAY = [245, 245,  245];

function formatRp(num) {
  return new Intl.NumberFormat('id-ID').format(Math.round(num || 0));
}

export function generatePDF(company, cust, rows, statusFilter) {
  const doc      = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW    = 297; // Hardcode for A4 landscape to fix jsPDF pageSize bug
  const margin   = 15;
  const contentW = pageW - margin * 2;

  let startY = 15;
  let leftY = startY;
  
  // 1. TOP LEFT: LOGO & COMPANY INFO
  if (company.logo) {
    try {
      const imgProps = doc.getImageProperties(company.logo);
      const imgHeight = 12;
      const imgWidth = (imgProps.width * imgHeight) / imgProps.height;
      doc.addImage(company.logo, margin, leftY, imgWidth, imgHeight);
      leftY += imgHeight + 4;
    } catch (e) {
      console.error('Gagal memuat logo PDF', e);
    }
  }

  const companyNameY = leftY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text(company.name || 'Company Name', margin, leftY, { align: 'left' });
  leftY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  if (company.address) {
    doc.text(company.address, margin, leftY, { align: 'left' });
    leftY += 4.5;
  }
  if (company.telp) {
    doc.text(`Telp: ${company.telp}`, margin, leftY, { align: 'left' });
    leftY += 4.5;
  }
  
  // 2. TITLE: Statement of Accounts (Top Right)
  let rightY = companyNameY; // Sejajar dengan company name

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BLACK);
  doc.text('Statement of Accounts', pageW - margin, rightY, { align: 'right' });
  rightY += 2;
  
  // Date under title
  const dateStr = `As of ${new Date().toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  doc.text(dateStr, pageW - margin, rightY + 4, { align: 'right' });
  
  // Line under title
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(pageW - margin - 80, rightY + 6, pageW - margin, rightY + 6);
  rightY += 12;

  let y = Math.max(leftY, rightY) + 10;
  
  // 3. TO (Kepada) (Kanan bawah, di atas tabel)
  const toBlockX = pageW - margin - 80;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Kepada :', toBlockX, y, { align: 'left' });
  y += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(cust.name, toBlockX, y, { align: 'left' });
  y += 5;
  
  if (cust.id && cust.id !== '-') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`ID Customer: ${cust.id}`, toBlockX, y, { align: 'left' });
    y += 5;
  }
  
  y += 4; // Spasi sebelum tabel

  // 5. TABLE
  const COL_W = [10, 22, 40, 32, 24, 24, 36, 18, 20, 24, 17];
  const tableData = rows.map((r, i) => [
    i + 1,
    r.customerId,
    r.namaCustomer,
    r.noInvoice,
    r.tglInvoice,
    r.jatuhTempo,
    formatRp(r.nominal),
    r.terminName || '-',
    r.status === 'LUNAS' ? 'CLOSE' : r.status,
    r.tglClose || '-',
    r.umur,
  ]);

  autoTable(doc, {
    startY      : y,
    head        : [['No', 'Customer ID', 'Nama Customer', 'No Invoice', 'Tgl Invoice', 'Tgl Jatuh Tempo', 'Sisa Tagihan', 'Termin', 'Status', 'Tgl Close', 'Jatuh Tempo']],
    body        : tableData,
    foot        : [[
      { content: 'TOTAL TAGIHAN', colSpan: 6, styles: { halign: 'center', fillColor: [180, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: formatRp(rows.reduce((s, r) => s + r.nominal, 0)), styles: { halign: 'center', fillColor: [180, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: '', colSpan: 4, styles: { fillColor: [180, 0, 0] } }
    ]],
    margin      : { left: margin, right: margin },
    tableWidth  : contentW,
    
    columnStyles: {
      0: { cellWidth: COL_W[0], halign: 'center' },
      1: { cellWidth: COL_W[1], halign: 'center' },
      2: { cellWidth: COL_W[2], halign: 'left' },
      3: { cellWidth: COL_W[3], halign: 'center' },
      4: { cellWidth: COL_W[4], halign: 'center' },
      5: { cellWidth: COL_W[5], halign: 'center' },
      6: { cellWidth: COL_W[6], halign: 'center' },
      7: { cellWidth: COL_W[7], halign: 'center' },
      8: { cellWidth: COL_W[8], halign: 'center' },
      9: { cellWidth: COL_W[9], halign: 'center' },
      10: { cellWidth: COL_W[10], halign: 'center' },
    },

    headStyles: {
      fillColor  : BLACK,
      textColor  : WHITE,
      fontStyle  : 'bold',
      fontSize   : 9,
      halign     : 'center',
      cellPadding: { top: 5, bottom: 5, left: 2, right: 2 },
      lineWidth  : 0,
    },

    bodyStyles: {
      fontSize   : 9,
      textColor  : TEXT_DARK,
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      lineWidth  : 0,
    },

    alternateRowStyles: { fillColor: LIGHT_GRAY },

    didDrawPage(data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_GRAY);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageW - margin,
        210 - 8, // Hardcode pageH = 210 for A4 landscape
        { align: 'right' }
      );
    },
  });

  y = doc.lastAutoTable.finalY + 8;
  
  // 6. TERBILANG
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  const totalNominal = rows.reduce((s, r) => s + r.nominal, 0);
  const terbilangText = `Terbilang: ${terbilang(totalNominal)}`;
  const terbilangLines = doc.splitTextToSize(terbilangText, contentW);
  doc.text(terbilangLines, margin, y, { align: 'left' });
  
  y += terbilangLines.length * 5 + 4;

  // 8. HORMAT KAMI
  let signY = y + 10;
  // Let's make sure it doesn't cross the page height if there's very little space.
  // Actually, autoTable handles pagination, but for signature we just place it below terbilang.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Hormat kami,', pageW - margin - 30, signY, { align: 'center' });

  // SAVE
  const safeFileName = cust.name.replace(/[^a-zA-Z0-9_\-. ]/g, '').replace(/\s+/g, '_');
  doc.save(`SOA_${safeFileName}.pdf`);
}
