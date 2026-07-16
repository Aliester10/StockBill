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
  
  // 1. TOP RIGHT: LOGO & COMPANY INFO
  if (company.logo) {
    try {
      const imgProps = doc.getImageProperties(company.logo);
      const imgHeight = 12;
      const imgWidth = (imgProps.width * imgHeight) / imgProps.height;
      doc.addImage(company.logo, pageW - margin - imgWidth, startY, imgWidth, imgHeight);
      startY += imgHeight + 4;
    } catch (e) {
      console.error('Gagal memuat logo PDF', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text(company.name || 'Company Name', pageW - margin, startY, { align: 'right' });
  
  let y = startY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  if (company.address) {
    doc.text(company.address, pageW - margin, y, { align: 'right' });
    y += 4.5;
  }
  if (company.telp) {
    doc.text(`Telp: ${company.telp}`, pageW - margin, y, { align: 'right' });
    y += 4.5;
  }
  
  y += 8;

  // 2. TITLE: Statement of Accounts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BLACK);
  doc.text('Statement of Accounts', pageW - margin, y, { align: 'right' });
  y += 2;
  
  // Date under title
  const dateStr = `As of ${new Date().toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  doc.text(dateStr, pageW - margin, y + 4, { align: 'right' });
  
  // Line under title
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(pageW - margin - 80, y + 6, pageW - margin, y + 6);
  y += 12;

  // 3. ACCOUNT SUMMARY BLOCK
  const summaryW = 80;
  const summaryX = pageW - margin - summaryW;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(summaryX, y, summaryW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Account Summary', summaryX + 3, y + 5);
  y += 7;

  // For summary, we can only really show the total invoiced and total balance 
  // since we don't have separate payments rows.
  // The user approved the plan, so I'll provide these metrics based on all data passed.
  const openRows = rows.filter(r => r.status === 'OPEN');
  const closeRows = rows.filter(r => r.status === 'CLOSE');
  
  const totalOpen = openRows.reduce((s, r) => s + r.nominal, 0);
  const totalClose = closeRows.reduce((s, r) => s + r.nominal, 0);
  const totalInvoiced = rows.reduce((s, r) => s + r.nominal, 0); 
  
  const balanceDue = statusFilter === 'CLOSE' ? totalClose : totalOpen;

  const summaryItems = [
    { label: 'Total Invoices', value: rows.length.toString() },
    { label: 'Invoiced Amount', value: `Rp ${formatRp(totalInvoiced)}` },
    { label: 'Amount Paid', value: `Rp ${formatRp(totalClose)}` },
    { label: 'Balance Due', value: `Rp ${formatRp(balanceDue)}`, bold: true }
  ];

  summaryItems.forEach((item, idx) => {
    if (idx === summaryItems.length - 1) {
       doc.setDrawColor(200, 200, 200);
       doc.setLineWidth(0.5);
       doc.line(summaryX, y, summaryX + summaryW, y);
       y += 2;
    }
    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);
    
    doc.text(item.label, summaryX + 3, y + 4.5);
    doc.text(item.value, summaryX + summaryW - 3, y + 4.5, { align: 'right' });
    y += 7;
  });

  // 4. LEFT SIDE: TO (Kepada)
  let leftY = startY + 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text('To', margin, leftY);
  leftY += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(cust.name, margin, leftY);
  leftY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`ID Customer: ${cust.id}`, margin, leftY);

  // Set Y for table
  y = Math.max(y, leftY) + 12;

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
    r.terminName ? r.terminName.replace(/Termin\s+/i, '').replace(/\s*\(\d+%\)/, '') : '-',
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

  // 8. HORMAT KAMI (Removed as requested)
  // SAVE
  const safeFileName = cust.name.replace(/[^a-zA-Z0-9_\-. ]/g, '').replace(/\s+/g, '_');
  doc.save(`SOA_${safeFileName}.pdf`);
}
