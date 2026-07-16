const fs = require('fs');

const path = './src/utils/generateSOA.js';
let content = fs.readFileSync(path, 'utf8');

// Replace signature
content = content.replace(
  /export async function generateSOA\(company, cust, rows, statusFilter\) {/,
  `export async function generateSOA(company, cust, rows, statusFilter, exportColumns = null) {
  const cols = exportColumns || { no: true, customerId: true, namaCustomer: true, noInvoice: true, tglInvoice: true, jatuhTempo: true, nominal: true, termin1: true, termin2: true, termin3: true, status: true, tglClose: true, umur: true };

  const ALL_DEFS = [
    { key: 'no', label: 'No', width: 8, align: AC, render: (r, i) => i + 1 },
    { key: 'customerId', label: 'Customer ID', width: 14, align: AC, render: r => r.customerId },
    { key: 'namaCustomer', label: 'Nama Customer', width: 22, align: AL, render: r => r.namaCustomer },
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
  const rightLabelStartCol = activeDefs.length > 5 ? alphabet[activeDefs.length - 3] : alphabet[1];
`
);

// Replace columns definition
content = content.replace(
  /ws\.columns = \[[^\]]+\];/,
  `const excelCols = [{ key: 'A', width: 3.5 }];
  activeDefs.forEach((def, i) => {
    def.colIdx = alphabet[i + 1];
    excelCols.push({ key: def.colIdx, width: def.width });
  });
  excelCols.push({ key: alphabet[activeDefs.length + 1], width: 3.5 });
  ws.columns = excelCols;`
);

// Replace mergeCells
content = content.replace(/ws\.mergeCells\('F2:J2'\);/, "ws.mergeCells(`${rightLabelStartCol}2:${lastDataCol}2`);");
content = content.replace(/const c2F = ws\.getCell\('F2'\);/, "const c2F = ws.getCell(`${rightLabelStartCol}2`);");
content = content.replace(/ws\.mergeCells\('F3:J3'\);/, "ws.mergeCells(`${rightLabelStartCol}3:${lastDataCol}3`);");
content = content.replace(/const c3F = ws\.getCell\('F3'\);/, "const c3F = ws.getCell(`${rightLabelStartCol}3`);");
content = content.replace(/ws\.mergeCells\('F5:J5'\);/, "ws.mergeCells(`${rightLabelStartCol}5:${lastDataCol}5`);");
content = content.replace(/const c5F = ws\.getCell\('F5'\);/, "const c5F = ws.getCell(`${rightLabelStartCol}5`);");
content = content.replace(/ws\.mergeCells\('F6:J6'\);/, "ws.mergeCells(`${rightLabelStartCol}6:${lastDataCol}6`);");
content = content.replace(/const c6F = ws\.getCell\('F6'\);/, "const c6F = ws.getCell(`${rightLabelStartCol}6`);");
content = content.replace(/ws\.mergeCells\('F7:J7'\);/, "ws.mergeCells(`${rightLabelStartCol}7:${lastDataCol}7`);");
content = content.replace(/const c7F = ws\.getCell\('F7'\);/, "const c7F = ws.getCell(`${rightLabelStartCol}7`);");

// Replace Header tabel
content = content.replace(
  /const tblHeaders = \[[^\]]+\];\s*tblHeaders\.forEach\(\(\{ col, label, align \}\) => \{[^}]+\}\);/m,
  `activeDefs.forEach((def) => {
    const cell = ws.getCell(\`\${def.colIdx}9\`);
    cell.value = def.label;
    cell.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
    cell.fill = fillSolid(TABLE_HEAD);
    cell.alignment = def.align;
    cell.border = borderTable();
  });`
);

// Replace rows loop
const rowsLoopMatch = /rows\.forEach\(\(r, idx\) => \{[\s\S]*?totalNominal \+= r\.nominal;\s*\}\);/;
content = content.replace(rowsLoopMatch, 
`rows.forEach((r, idx) => {
    const rowNum = DATA_START + idx;
    ws.getRow(rowNum).height = 22;
    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY;

    activeDefs.forEach((def) => {
      const val = def.render(r, idx);
      const cell = ws.getCell(\`\${def.colIdx}\${rowNum}\`);
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
  });`
);

// Replace Total row logic
const totalRowMatch = /ws\.getRow\(TOTAL_ROW\)\.height = 22;[\s\S]*?\}\);/m;
content = content.replace(totalRowMatch, 
`const nominalDefIndex = activeDefs.findIndex(d => d.isNominal);
  if (nominalDefIndex !== -1) {
    const nominalColLetter = alphabet[nominalDefIndex + 1];
    ws.getRow(TOTAL_ROW).height = 22;
    const labelTotal = statusFilter === 'CLOSE' ? 'TOTAL TAGIHAN CLOSE' : 'TOTAL TAGIHAN';
    
    const mergeStartCol = alphabet[1]; // B
    const mergeEndCol = alphabet[nominalDefIndex]; // Col before nominal
    if (nominalDefIndex > 0) {
      ws.mergeCells(\`\${mergeStartCol}\${TOTAL_ROW}:\${mergeEndCol}\${TOTAL_ROW}\`);
      const cellTotLabel = ws.getCell(\`\${mergeStartCol}\${TOTAL_ROW}\`);
      cellTotLabel.value = labelTotal;
      cellTotLabel.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
      cellTotLabel.fill = fillSolid(DARK_RED);
      cellTotLabel.alignment = AC;
    }

    const cellTotVal = ws.getCell(\`\${nominalColLetter}\${TOTAL_ROW}\`);
    cellTotVal.value = totalNominal;
    cellTotVal.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 12 };
    cellTotVal.fill = fillSolid(DARK_RED);
    cellTotVal.alignment = { horizontal: 'right', vertical: 'middle' };
    cellTotVal.numFmt = '#,##0';

    // Sisa kosong di kanan
    for (let i = nominalDefIndex + 1; i < activeDefs.length; i++) {
      const emptyCell = ws.getCell(\`\${alphabet[i + 1]}\${TOTAL_ROW}\`);
      emptyCell.fill = fillSolid(DARK_RED);
      emptyCell.border = borderTable();
      emptyCell.alignment = AC;
    }
  }`
);

// Terbilang row merge adjustments
content = content.replace(/ws\.mergeCells\(\`B\$\{terbilangRow\}:E\$\{terbilangRow\}\`\);/, "ws.mergeCells(`B${terbilangRow}:${lastDataCol}${terbilangRow}`);");
content = content.replace(/ws\.mergeCells\(\`B\$\{TOTAL_ROW \+ 3\}:E\$\{TOTAL_ROW \+ 7\}\`\);/, "ws.mergeCells(`B${TOTAL_ROW + 3}:${lastDataCol}${TOTAL_ROW + 7}`);");


fs.writeFileSync(path, content, 'utf8');
console.log('Update complete');
