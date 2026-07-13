import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const generateStockExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Stock_Card');

  // Define columns
  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'ID Vendor', key: 'idVendor', width: 15 },
    { header: 'Nama Vendor', key: 'vendor', width: 20 },
    { header: 'Nama Barang', key: 'namaBarang', width: 30 },
    { header: 'Qty Order', key: 'order', width: 15 },
    { header: 'Qty Transit MKR', key: 'transit', width: 20 },
    { header: 'Qty Datang', key: 'datang', width: 15 },
    { header: 'Sisa', key: 'sisa', width: 15 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Keterangan', key: 'keterangan', width: 30 },
  ];

  // Style header
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F3864' }, // Dark Blue
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' }, // White
      bold: true,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
    };
  });

  // Add data rows
  data.forEach((item, index) => {
    // Generate mock ID Vendor based on vendor name for now
    let idVendor = '1000052048';
    if (item.vendor === 'SINAR GEMILANG') idVendor = '1000060966';
    
    // Convert status to requested format
    let statusStr = '';
    let statusColor = 'FF000000'; // Black
    if (item.status === 'GR' || item.status === 'GOODS RECEIPT') {
      statusStr = 'GOODS RECEIPT';
      statusColor = 'FF000000'; // Black
    } else if (item.status === 'Partial' || item.status === 'PARTIAL') {
      statusStr = 'PARTIAL';
      statusColor = 'FFD97706'; // Orange/Brown-ish
    } else {
      statusStr = 'BELUM DATANG';
      statusColor = 'FFDC2626'; // Red
    }

    const row = worksheet.addRow({
      no: index + 1,
      idVendor,
      vendor: item.vendor,
      namaBarang: item.namaBarang,
      order: item.order,
      transit: item.transit,
      datang: item.datang,
      sisa: item.sisa,
      status: statusStr,
      keterangan: item.keterangan
    });

    // Style the row cells
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: {style:'thin', color: {argb:'FFD4D4D4'}}, 
        left: {style:'thin', color: {argb:'FFD4D4D4'}}, 
        bottom: {style:'thin', color: {argb:'FFD4D4D4'}}, 
        right: {style:'thin', color: {argb:'FFD4D4D4'}}
      };
      cell.alignment = { vertical: 'middle' };

      // Number formatting for qty
      if (colNumber >= 5 && colNumber <= 8) {
        cell.numFmt = '#,##0';
      }

      // Sisa (Col H = 8) bold
      if (colNumber === 8) {
        cell.font = { bold: true };
      }

      // Status (Col I = 9) color
      if (colNumber === 9) {
        cell.font = { color: { argb: statusColor }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      
      // Center No (Col A = 1)
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Stock_Card_${new Date().getTime()}.xlsx`);
};
