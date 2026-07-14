import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Warna (r,g,b) ───────────────────────────────────────────────
const DARK_BLUE  = [31,  56,  100];
const TEXT_GRAY  = [100, 116,  139];
const TEXT_DARK  = [ 30,  41,   59];
const TEXT_BLUE  = [ 37,  99, 235];
const TEXT_GREEN = [ 22, 163,  74];
const TEXT_RED   = [220,  38,  38];

function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(Math.round(num || 0));
}

export function generateStockPDF(productName, data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // 1. Header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_GRAY);
  doc.text('Report Produk', margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_DARK);
  doc.text(productName, margin, y);
  y += 12;

  // 2. Summary Stats
  const totalOrder = data.reduce((acc, curr) => acc + curr.order, 0);
  const totalTransit = data.reduce((acc, curr) => acc + curr.transit, 0);
  const totalDatang = data.reduce((acc, curr) => acc + curr.datang, 0);
  const totalSisa = data.reduce((acc, curr) => acc + curr.sisa, 0);
  const totalPO = data.length;

  const statW = (pageW - margin * 2) / 4;
  
  // Kotak 1: Total order
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  doc.text('Total order', margin, y);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatNumber(totalOrder), margin, y + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_GRAY);
  doc.text(`dari ${totalPO} PO`, margin, y + 10);

  // Kotak 2: Total transit
  doc.setFontSize(9);
  doc.text('Total Transit', margin + statW, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('di MKR', margin + statW, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_BLUE);
  doc.text(formatNumber(totalTransit), margin + statW, y + 6);

  // Kotak 3: Total datang
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  doc.text('Total Datang', margin + statW * 2, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('sudah sampai', margin + statW * 2, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_GREEN);
  doc.text(formatNumber(totalDatang), margin + statW * 2, y + 6);

  // Kotak 4: Total sisa
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  doc.text('Total Sisa', margin + statW * 3, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('belum datang', margin + statW * 3, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_RED);
  doc.text(formatNumber(totalSisa), margin + statW * 3, y + 6);

  y += 20;

  // 3. History Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Riwayat per PO', margin, y);
  y += 6;

  // 4. Table for PO History
  const tableRows = [];
  data.forEach((po, index) => {
    // Add PO Header row
    tableRows.push([
      { content: `${index + 1}`, styles: { fontStyle: 'bold', halign: 'center' } },
      { content: `PO ${po.noPo} | ${po.vendor} (Status: ${po.status})`, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
    ]);

    // Add PO summary row
    tableRows.push([
      '', 
      { content: `Order ${formatNumber(po.order)} | Datang ${formatNumber(po.datang)} | Sisa ${formatNumber(po.sisa)}`, colSpan: 6, styles: { fontStyle: 'bold', textColor: [15, 23, 42], fillColor: [248, 250, 252] } }
    ]);

    // Add History details
    if (po.history && po.history.length > 0) {
      po.history.forEach(hist => {
        tableRows.push([
          '',
          hist.noGr || '-',
          hist.tanggal,
          formatNumber(hist.transit),
          formatNumber(hist.datang),
          hist.pic || '-',
          hist.keterangan || '-'
        ]);
      });
    } else {
      tableRows.push(['', '-', '-', '-', '-', '-', 'Belum ada riwayat']);
    }
  });

  autoTable(doc, {
    startY: y,
    head: [['No', 'No GR', 'Tanggal', 'Transit MKR', 'Datang', 'PIC', 'Keterangan']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: DARK_BLUE,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 25 },
      6: { cellWidth: 'auto' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  });

  // Save PDF
  doc.save(`Report_Produk_${productName.replace(/\s+/g, '_')}.pdf`);
}
