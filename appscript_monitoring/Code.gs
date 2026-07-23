// ════════════════════════════════════════════════════════════════
//  Code.gs  ─  Backend entry point for SOA Generator Web App
// ════════════════════════════════════════════════════════════════

// ── Config ───────────────────────────────────────────────────────
var SHEET_STOCK    = 'StockData';

// ── doGet ─────────────────────────────────────────────────────────
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('SOA Generator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ── FUNGSI WAJIB JALAN (SETUP) ──────────────────────────────────
// JALANKAN FUNGSI INI SEKALI SAJA DARI EDITOR APPS SCRIPT
function sambungkanKeSpreadsheetIni() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Penting: Anda harus menjalankan ini dari dalam file Spreadsheet (Ekstensi > Apps Script).");
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());
  initSheets_(ss);
  console.log("SUKSES: Web App berhasil disambungkan permanen ke Spreadsheet ini!");
}

// ── Spreadsheet Helper ───────────────────────────────────────────
function getOrCreateSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId  = props.getProperty('SPREADSHEET_ID');
  
  if (ssId) {
    try { 
      return SpreadsheetApp.openById(ssId); 
    } catch(e) {
      throw new Error("Tidak dapat mengakses database Spreadsheet. Pastikan Web App di-deploy dengan 'Execute as: Me'.");
    }
  }
  
  // Fallback jika belum disambungkan (akan membuat sheet mandiri baru)
  var ss = SpreadsheetApp.create('SOA Generator Data');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  initSheets_(ss);
  return ss;
}

function initSheets_(ss) {
  ss = ss || getOrCreateSpreadsheet_();
  var needed = [SHEET_STOCK];
  var existing = ss.getSheets().map(function(s){ return s.getName(); });
  needed.forEach(function(name) {
    if (existing.indexOf(name) === -1) {
      ss.insertSheet(name);
    }
  });
  // Hapus sheet default "Sheet1" jika ada dan belum terpakai
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > needed.length) {
    ss.deleteSheet(def);
  }
}

// Public: init sheets (called once from client on first load)
function initSheets() {
  initSheets_();
}

// ── STOCK CRUD ───────────────────────────────────────────────────
function getStockData() {
  var ss    = getOrCreateSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_STOCK);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    headers.forEach(function(h, j) {
      var val = data[i][j];
      // Deserialize history JSON string
      if (h === 'history') {
        try { val = JSON.parse(val || '[]'); } catch(e) { val = []; }
      } else if (val instanceof Date) {
        var y = val.getFullYear();
        var m = ('0' + (val.getMonth() + 1)).slice(-2);
        var d = ('0' + val.getDate()).slice(-2);
        val = y + '-' + m + '-' + d;
      }
      row[h] = val;
    });
    rows.push(row);
  }
  return rows;
}

function saveStockData(data) {
  var ss    = getOrCreateSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_STOCK);
  if (!sheet) { initSheets_(); sheet = ss.getSheetByName(SHEET_STOCK); }
  sheet.clearContents();
  if (!data || data.length === 0) return;
  var headers = ['id','namaBarang','vendor','noPo','noGr','order','transit','datang','sisa','status','keterangan','pic','history'];
  var values  = [headers];
  data.forEach(function(r) {
    values.push(headers.map(function(h) {
      if (h === 'history') return JSON.stringify(r[h] || []);
      return r[h] !== undefined ? r[h] : '';
    }));
  });
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
}


