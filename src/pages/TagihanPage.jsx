import { useState, useRef, Fragment } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { parseExcelFile } from '../utils/parseExcel';
import { generateSOA } from '../utils/generateSOA';
import { generatePDF } from '../utils/generatePDF';

// ── Helpers ──────────────────────────────────────────────────────
export const ALL_COLUMNS = [
  { id: 'no', label: 'No' },
  { id: 'customerId', label: 'Customer ID' },
  { id: 'namaCustomer', label: 'Nama Customer' },
  { id: 'noInvoice', label: 'No Invoice' },
  { id: 'tglInvoice', label: 'Tgl Invoice' },
  { id: 'jatuhTempo', label: 'Tgl Jatuh Tempo' },
  { id: 'nominal', label: 'Total Tagihan' },
  { id: 'termin1', label: 'Termin 1' },
  { id: 'termin2', label: 'Termin 2' },
  { id: 'termin3', label: 'Termin 3' },
  { id: 'status', label: 'Status' },
  { id: 'tglClose', label: 'Tgl Close' },
  { id: 'umur', label: 'Jatuh Tempo (Umur)' }
];

function formatRp(num) {
  if (!num && num !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}
function parseNominalInput(str) {
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}
function hitungUmur(jatuhTempoStr) {
  if (!jatuhTempoStr || jatuhTempoStr === '-') return '-';
  try {
    let tgl;
    if (jatuhTempoStr.includes('-')) {
      const [y, m, d] = jatuhTempoStr.split('-');
      tgl = new Date(Number(y), Number(m) - 1, Number(d));
    } else if (jatuhTempoStr.includes('/')) {
      const [d, m, y] = jatuhTempoStr.split('/');
      tgl = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      return '-';
    }
    if (isNaN(tgl.getTime())) return '-';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.floor((tgl - today) / 86400000);
  } catch { return '-'; }
}
function htmlDateToDisplay(val) {
  if (!val) return '';
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}
function displayDateToHtml(val) {
  if (!val) return '';
  const parts = val.split('/');
  if (parts.length !== 3) return val;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
const emptyForm = () => ({
  customerId: '', namaCustomer: '', noInvoice: '',
  tglInvoice: '', jatuhTempo: '', nominal: '',
  status: 'OPEN', tglClose: '', umur: '0',
  termin1: '', termin2: '', termin3: '', baseNominal: ''
});

export default function TagihanPage() {
  const {
    tagihanRows, addTagihanRow, updateTagihanRow,
    deleteTagihanRow, clearAllTagihan,
    mergeUpload, customers, company, showToast
  } = useApp();

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editIndex, setEditIndex] = useState(null);
  const [nominalDisplay, setNominalDisplay] = useState('');
  const [baseNominalDisplay, setBaseNominalDisplay] = useState('');
  const [termin1Display, setTermin1Display] = useState('');
  const [termin2Display, setTermin2Display] = useState('');
  const [termin3Display, setTermin3Display] = useState('');
  const [selCustomer, setSelCustomer] = useState('');
  const [selStatus, setSelStatus] = useState('ALL');
  const [selWaktu, setSelWaktu] = useState('ALL');
  const [genXls, setGenXls] = useState(false);
  const [genPdf, setGenPdf] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState(
    ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );

  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  function toggleExportColumn(id) {
    setExportColumns(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ── Import ───────────────────────────────────────────────────
  async function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const rows = await parseExcelFile(file);
      if (!rows.length) { showToast('Tidak ada data ditemukan. Periksa format kolom.', 'error'); return; }
      const existing = new Set(tagihanRows.map(r => r.noInvoice));
      const newRows = rows.filter(r => !existing.has(r.noInvoice));
      const skip = rows.length - newRows.length;
      if (!newRows.length) { showToast(`Semua ${rows.length} data sudah ada.`, 'info'); return; }
      mergeUpload(newRows, 'append');
      const uniq = new Set(newRows.map(r => r.customerId)).size;
      showToast(
        skip > 0
          ? `${newRows.length} data ditambahkan (${uniq} customer). ${skip} baris dilewati karena sudah ada.`
          : `${newRows.length} data berhasil diimport (${uniq} customer).`,
        'success'
      );
    } catch (err) {
      showToast('Gagal baca file: ' + err.message, 'error');
    } finally { setUploading(false); }
  }

  // ── Form ─────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const u = { ...prev, [name]: value };
      if (name === 'jatuhTempo' || name === 'status') {
        const jt = name === 'jatuhTempo' ? htmlDateToDisplay(value) : htmlDateToDisplay(prev.jatuhTempo);
        u.umur = u.status === 'OPEN' ? String(hitungUmur(jt)) : '0';
      }
      if (name === 'status' && value === 'OPEN') u.tglClose = '';
      return u;
    });
  }
  function handleCustIdChange(e) {
    const id = e.target.value;
    const m = customers.find(c => c.id === id);
    setForm(p => ({ ...p, customerId: id, namaCustomer: m ? m.name : p.namaCustomer }));
  }
  function handleCustIdInput(e) {
    const id = e.target.value;
    const m = customers.find(c => c.id === id);
    setForm(p => ({ ...p, customerId: id, namaCustomer: m ? m.name : p.namaCustomer }));
  }
  function handleNamaInput(e) {
    const name = e.target.value;
    const m = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    setForm(p => ({ ...p, namaCustomer: name, customerId: m ? m.id : p.customerId }));
  }

  function handleTerminChange(e, terminKey) {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (terminKey === 'termin1') setTermin1Display(formatRp(val));
    if (terminKey === 'termin2') setTermin2Display(formatRp(val));
    if (terminKey === 'termin3') setTermin3Display(formatRp(val));
    
    setForm(prev => {
      const nextForm = { ...prev, [terminKey]: val };
      const t1 = Number(nextForm.termin1) || 0;
      const t2 = Number(nextForm.termin2) || 0;
      const t3 = Number(nextForm.termin3) || 0;
      const bNom = Number(nextForm.baseNominal) || 0;
      nextForm.nominal = String(Math.max(0, bNom - (t1 + t2 + t3)));
      setNominalDisplay(formatRp(nextForm.nominal));
      return nextForm;
    });
  }

  function handleBaseNominalChange(e) {
    let val = e.target.value.replace(/[^0-9]/g, '');
    setBaseNominalDisplay(formatRp(val));

    setForm(prev => {
      const bNom = Number(val) || 0;
      const t1 = Number(prev.termin1) || 0;
      const t2 = Number(prev.termin2) || 0;
      const t3 = Number(prev.termin3) || 0;
      const newNominal = String(Math.max(0, bNom - (t1 + t2 + t3)));
      setNominalDisplay(formatRp(newNominal));
      return { ...prev, baseNominal: val, nominal: newNominal };
    });
  }

  function handleNominalChange(e) {
    let val = e.target.value.replace(/[^0-9]/g, '');
    setNominalDisplay(formatRp(val));
    setForm(p => ({ ...p, nominal: val }));
  }

  function openAdd() { 
    setForm(emptyForm()); 
    setNominalDisplay(''); setBaseNominalDisplay(''); 
    setTermin1Display(''); setTermin2Display(''); setTermin3Display('');
    setEditIndex(null); setShowForm(true); 
  }
  function openEdit(idx) {
    const r = tagihanRows[idx];
    setForm({
      customerId: r.customerId, namaCustomer: r.namaCustomer, noInvoice: r.noInvoice,
      tglInvoice: displayDateToHtml(r.tglInvoice), jatuhTempo: displayDateToHtml(r.jatuhTempo),
      nominal: String(r.nominal), status: r.status,
      tglClose: displayDateToHtml(r.tglClose), umur: String(r.umur),
      termin1: r.termin1 || '', termin2: r.termin2 || '', termin3: r.termin3 || '',
      baseNominal: r.baseNominal || String(r.nominal)
    });
    setBaseNominalDisplay(r.baseNominal ? Number(r.baseNominal).toLocaleString('id-ID') : (r.nominal ? Number(r.nominal).toLocaleString('id-ID') : ''));
    setTermin1Display(r.termin1 ? Number(r.termin1).toLocaleString('id-ID') : '');
    setTermin2Display(r.termin2 ? Number(r.termin2).toLocaleString('id-ID') : '');
    setTermin3Display(r.termin3 ? Number(r.termin3).toLocaleString('id-ID') : '');
    setNominalDisplay(r.nominal ? Number(r.nominal).toLocaleString('id-ID') : '');
    setEditIndex(idx); setShowForm(true);
  }
  function handleSave() {
    if (!form.customerId.trim()) { showToast('Customer ID wajib diisi.', 'error'); return; }
    if (!form.namaCustomer.trim()) { showToast('Nama Customer wajib diisi.', 'error'); return; }
    if (!form.noInvoice.trim()) { showToast('No Invoice wajib diisi.', 'error'); return; }
    if (!form.tglInvoice) { showToast('Tgl Invoice wajib diisi.', 'error'); return; }
    if (!form.jatuhTempo) { showToast('Jatuh Tempo wajib diisi.', 'error'); return; }
    if (!form.nominal) { showToast('Nominal wajib diisi.', 'error'); return; }
    const row = {
      customerId: form.customerId.trim(), namaCustomer: form.namaCustomer.trim(),
      noInvoice: form.noInvoice.trim(),
      tglInvoice: htmlDateToDisplay(form.tglInvoice), jatuhTempo: htmlDateToDisplay(form.jatuhTempo),
      nominal: parseNominalInput(form.nominal), status: form.status,
      tglClose: form.status === 'CLOSE' ? htmlDateToDisplay(form.tglClose) : '',
      umur: Number(form.umur) || 0,
      termin1: parseNominalInput(form.termin1) || 0,
      termin2: parseNominalInput(form.termin2) || 0,
      termin3: parseNominalInput(form.termin3) || 0,
      baseNominal: parseNominalInput(form.baseNominal || form.nominal)
    };
    if (editIndex !== null) { updateTagihanRow(editIndex, row); showToast('Data diupdate!', 'success'); }
    else { addTagihanRow(row); showToast('Data disimpan!', 'success'); }
    setShowForm(false); setForm(emptyForm()); 
    setNominalDisplay(''); setBaseNominalDisplay(''); 
    setTermin1Display(''); setTermin2Display(''); setTermin3Display('');
  }

  // ── Generate ─────────────────────────────────────────────────
  function getPayload() {
    const dynamicRows = tagihanRows.map((r, i) => ({
      ...r,
      _originalIndex: i,
      umur: r.status === 'OPEN' ? String(hitungUmur(r.jatuhTempo)) : '0'
    }));
    let rows = dynamicRows;
    let cust = { id: '-', name: 'Semua Customer' };

    if (selCustomer) {
      rows = rows.filter(r => r.customerId === selCustomer);
      if (rows.length > 0) {
        cust = { id: rows[0].customerId, name: rows[0].namaCustomer };
      }
    }

    if (selStatus === 'OPEN') rows = rows.filter(r => r.status === 'OPEN');
    if (selStatus === 'CLOSE') rows = rows.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS');
    if (selWaktu === 'OVERDUE') rows = rows.filter(r => r.status === 'OPEN' && Number(r.umur) <= 14);

    if (!rows.length) { showToast(`Tidak ada tagihan yang sesuai filter.`, 'error'); return null; }
    return { cust, rows };
  }
  async function handleGenExcel() {
    const p = getPayload(); if (!p) return; setGenXls(true);
    try { await generateSOA(company, p.cust, p.rows, selStatus, exportColumns); showToast('Excel berhasil diunduh!', 'success'); }
    catch (e) { showToast('Gagal: ' + e.message, 'error'); } finally { setGenXls(false); }
  }
  async function handleGenPDF() {
    const p = getPayload(); if (!p) return; setGenPdf(true);
    try { await generatePDF(company, p.cust, p.rows, selStatus, exportColumns); showToast('PDF berhasil diunduh!', 'success'); }
    catch (e) { showToast('Gagal: ' + e.message, 'error'); } finally { setGenPdf(false); }
  }

  // ── Derived ──────────────────────────────────────────────────
  const dynamicRows = tagihanRows.map((r, i) => ({
    ...r,
    _originalIndex: i,
    umur: r.status === 'OPEN' ? String(hitungUmur(r.jatuhTempo)) : '0'
  }));

  let displayed = dynamicRows;
  if (selCustomer) displayed = displayed.filter(r => r.customerId === selCustomer);
  if (selStatus === 'OPEN') displayed = displayed.filter(r => r.status === 'OPEN');
  if (selStatus === 'CLOSE') displayed = displayed.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS');
  if (selWaktu === 'OVERDUE') displayed = displayed.filter(r => r.status === 'OPEN' && Number(r.umur) <= 14);
  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize));
  const safePage = Math.min(currentPage, totalPages) || 1;
  const paginatedData = displayed.slice((safePage - 1) * pageSize, safePage * pageSize);
  const getFullValue = (r) => Math.max(Number(r.nominal) || 0, (Number(r.termin1) || 0) + (Number(r.termin2) || 0) + (Number(r.termin3) || 0));
  const totalSemua = displayed.reduce((s, r) => s + getFullValue(r), 0);
  const totalOpen = displayed.filter(r => r.status === 'OPEN').reduce((s, r) => s + getFullValue(r), 0);
  const previewRows = displayed.filter(r => selCustomer && r.customerId === selCustomer);
  const previewOpen = previewRows.filter(r => r.status === 'OPEN').reduce((s, r) => s + getFullValue(r), 0);
  const previewClose = previewRows.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS').reduce((s, r) => s + getFullValue(r), 0);
  const matchedCust = customers.find(c => c.id === form.customerId);

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <div className="card card-filter">
        <div className="card-filter-bg-graphic">
          <div className="cfg-blob-1"></div>
          <div className="cfg-blob-2"></div>
          <div className="cfg-dots"></div>
        </div>
        <div className="card-header" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#EFF6FF', color: '#3B82F6', padding: 8, borderRadius: 8, display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </div>
            Filter Data
          </h2>
          <button 
            className="btn btn-sm" 
            onClick={() => { setSelCustomer(''); setSelStatus('ALL'); setSelWaktu('ALL'); setCurrentPage(1); }}
            style={{ marginLeft: 'auto', background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444' }}
            title="Reset semua filter"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            Reset Filter
          </button>
        </div>
        <div className="card-body" style={{ position: 'relative', zIndex: 1 }}>
          {tagihanRows.length === 0 ? (
            <div className="info-hint">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Tambahkan data tagihan terlebih dahulu (input manual atau import dari Excel).
            </div>
          ) : (
            <>
              <div className="generate-form">
                <div className="form-group">
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Customer
                    <span style={{ fontWeight: 400, color: 'var(--text-sub)', marginLeft: 6 }}>
                      ({customers.length} tersedia)
                    </span>
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <select className="form-control" value={selCustomer} onChange={e => setSelCustomer(e.target.value)}>
                      <option value="">-- Pilih Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — ID: {c.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Filter Status</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <select className="form-control" value={selStatus} onChange={e => setSelStatus(e.target.value)}>
                      <option value="ALL">Semua (Open &amp; Close)</option>
                      <option value="OPEN">Open</option>
                      <option value="CLOSE">Close</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Kondisi Jatuh Tempo</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <select className="form-control" value={selWaktu} onChange={e => setSelWaktu(e.target.value)}>
                      <option value="ALL">Semua Tagihan</option>
                      <option value="OVERDUE">Khusus Jatuh Tempo (≤ 14 Hari)</option>
                    </select>
                  </div>
                </div>
                <div className="generate-btn-group">
                  <button className="btn btn-secondary" onClick={() => setShowExportModal(true)} style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Opsi Kolom Ekspor
                  </button>
                  <button className="btn btn-excel" onClick={handleGenExcel} disabled={genXls || genPdf || displayed.length === 0}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    {genXls ? 'Memproses…' : 'Excel'}
                  </button>
                  <button className="btn btn-pdf" onClick={handleGenPDF} disabled={genPdf || genXls || displayed.length === 0}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l2-2 2 2"></path></svg>
                    {genPdf ? 'Memproses…' : 'PDF'}
                  </button>
                </div>
              </div>

              {showExportModal && (
                <Modal onClose={() => setShowExportModal(false)} title="Pilih Kolom Ekspor" hideFooter={true}>
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ marginBottom: 16, color: 'var(--text-sub)' }}>
                      Pilih kolom mana saja yang ingin Anda tampilkan pada dokumen hasil ekspor (PDF & Excel):
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {ALL_COLUMNS.map(col => (
                        <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={exportColumns[col.id]}
                            onChange={() => toggleExportColumn(col.id)}
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                      <button className="btn btn-primary" onClick={() => setShowExportModal(false)}>Selesai</button>
                    </div>
                  </div>
                </Modal>
              )}

            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" stroke="currentColor" strokeWidth="2" style={{ color: '#fff' }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Data Tagihan
          </h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {tagihanRows.length > 0 && (
              <button className="btn btn-sm" style={{ background: '#fff', color: '#EF4444', border: '1px solid #FECACA' }} onClick={() => setConfirmClear(true)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Hapus Semua
              </button>
            )}
            <button className="btn btn-sm" style={{ background: '#fff', color: '#64748B', border: '1px solid #CBD5E1' }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              {uploading ? 'Mengimport…' : 'Import Excel'}
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileImport} />
            <button className="btn btn-primary btn-sm" style={{ background: '#4F46E5' }} onClick={openAdd}>
              <span style={{marginRight: 4}}>+</span> Tambah Data
            </button>
          </div>
        </div>

        {tagihanRows.length === 0 ? (
          <div className="empty-full">
            <p>Belum ada data tagihan.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>No</th>
                  <th>Customer ID</th><th>Nama Customer</th>
                  <th>No Invoice</th><th>Tgl Invoice</th><th>Tgl Jatuh Tempo</th>
                  <th style={{ width: 100, textAlign: 'right' }}>Total Tagihan</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Termin 1</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Termin 2</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Termin 3</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Status</th><th>Tgl Close</th>
                  <th style={{ width: 80 }}>Jatuh Tempo</th>
                  <th style={{ width: 80 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(r => {
                  const idx = r._originalIndex;
                  const isDanger = r.status === 'OPEN' && Number(r.umur) <= 14;
                  return (
                    <tr key={idx}>
                      <td className="center-cell">{r.no}</td>
                      <td>{r.customerId}</td>
                      <td style={{ fontWeight: 500 }}>{r.namaCustomer}</td>
                      <td>{r.noInvoice}</td>
                      <td className="center-cell">{r.tglInvoice}</td>
                      <td className="center-cell">{r.jatuhTempo}</td>
                      <td className="nominal-cell">{formatRp(r.nominal)}</td>
                      <td className="nominal-cell">{r.termin1 ? formatRp(r.termin1) : '-'}</td>
                      <td className="nominal-cell">{r.termin2 ? formatRp(r.termin2) : '-'}</td>
                      <td className="nominal-cell">{r.termin3 ? formatRp(r.termin3) : '-'}</td>
                      <td>
                        {r.status === 'LUNAS' || r.status === 'CLOSE' ? (
                          <span className="status-lunas">Lunas</span>
                        ) : (
                          <span className="status-open">Open</span>
                        )}
                      </td>
                      <td className="center-cell">{r.tglClose || '—'}</td>
                      <td className="center-cell" style={isDanger ? { color: 'var(--dark-red)', fontWeight: 700 } : {}}>
                        {r.umur === '-' || r.umur === 'NaN' || isNaN(r.umur) ? '-' : `${r.umur} Hari`}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(idx)} title="Edit" style={{ padding: '6px 8px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#3B82F6' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button className="btn btn-sm btn-secondary" title="Hapus"
                            onClick={() => { deleteTagihanRow(idx); showToast('Data dihapus.', 'info'); }}
                            style={{ padding: '6px 8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {tagihanRows.length > 0 && (
          <div className="table-footer">
            <div className="table-footer-text">
              Menampilkan {displayed.length > 0 ? (safePage - 1) * pageSize + 1 : 0} - {Math.min(safePage * pageSize, displayed.length)} dari {displayed.length} data
            </div>
            <div className="pagination-controls">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                <option value="5">5 / halaman</option>
                <option value="10">10 / halaman</option>
                <option value="25">25 / halaman</option>
              </select>
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .map((p, i, arr) => (
                  <Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--text-sub)' }}>...</span>}
                    <button className={`page-btn ${safePage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  </Fragment>
                ))}
                
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL: Form Input Tagihan ════════════════════════════ */}
      {showForm && (
        <Modal
          title={editIndex !== null ? 'Edit Data Tagihan' : 'Tambah Data Tagihan Baru'}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        >
          <div className="form-grid-2">
            <div className="form-group">
              <label>Customer ID <span className="req">*</span></label>
              {customers.length > 0 ? (
                <>
                  <select className="form-control"
                    value={matchedCust ? form.customerId : '__new__'}
                    onChange={e => e.target.value === '__new__'
                      ? setForm(p => ({ ...p, customerId: '', namaCustomer: '' }))
                      : handleCustIdChange(e)
                    }
                  >
                    <option value="__new__">— Ketik customer baru —</option>
                    <optgroup label="Customer tersimpan">
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  {!matchedCust && (
                    <input className="form-control" style={{ marginTop: 6 }}
                      placeholder="Ketik Customer ID baru"
                      value={form.customerId} onChange={handleCustIdInput} autoFocus />
                  )}
                </>
              ) : (
                <input className="form-control" placeholder="Contoh: 1000000"
                  value={form.customerId} onChange={handleCustIdInput} autoFocus />
              )}
            </div>
            <div className="form-group">
              <label>Nama Customer <span className="req">*</span></label>
              <input
                className={`form-control${matchedCust ? ' input-autofilled' : ''}`}
                placeholder="Terisi otomatis atau ketik baru"
                value={form.namaCustomer} onChange={handleNamaInput}
                readOnly={!!matchedCust}
                style={matchedCust ? { background: '#EFF6FF', color: 'var(--dark-blue)', fontWeight: 600, cursor: 'default' } : {}}
              />
              {matchedCust && <span className="field-hint">✓ Terisi otomatis dari Customer ID</span>}
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>No Invoice <span className="req">*</span></label>
              <input name="noInvoice" className="form-control" placeholder="Contoh: PM60712190"
                value={form.noInvoice} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Tgl Invoice <span className="req">*</span></label>
              <input type="date" name="tglInvoice" className="form-control" value={form.tglInvoice} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Jatuh Tempo <span className="req">*</span></label>
              <input type="date" name="jatuhTempo" className="form-control" value={form.jatuhTempo} onChange={handleChange} />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Total Tagihan (Rp) <span className="req">*</span></label>
              <input className="form-control" placeholder="Contoh: 10.092.422"
                value={baseNominalDisplay} onChange={handleBaseNominalChange} inputMode="numeric" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                <option value="OPEN">OPEN</option>
                <option value="CLOSE">CLOSE</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 20 }}>
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Termin 1 (Rp)</label>
                <input className="form-control" placeholder="Cth: 2.000.000"
                  value={termin1Display} onChange={e => handleTerminChange(e, 'termin1')} inputMode="numeric" />
              </div>
              <div className="form-group">
                <label>Termin 2 (Rp)</label>
                <input className="form-control" placeholder="Cth: 1.500.000"
                  value={termin2Display} onChange={e => handleTerminChange(e, 'termin2')} inputMode="numeric" />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Termin 3 (Rp)</label>
                <input className="form-control" placeholder="Cth: 1.000.000"
                  value={termin3Display} onChange={e => handleTerminChange(e, 'termin3')} inputMode="numeric" />
              </div>
              <div className="form-group">
                <label>Sisa Tagihan Akhir (Rp) <span className="req">*</span></label>
                <input className="form-control" value={nominalDisplay} onChange={handleNominalChange} inputMode="numeric"
                  style={{ fontWeight: 600, color: 'var(--dark-blue)' }} />
              </div>
            </div>
          </div>

          {form.status === 'CLOSE' && (
            <div className="form-group">
              <label>Tgl Close</label>
              <input type="date" name="tglClose" className="form-control" value={form.tglClose} onChange={handleChange} />
            </div>
          )}
          {form.status === 'OPEN' && form.jatuhTempo && (
            <div className="umur-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
              </svg>
              Jatuh Tempo otomatis: <strong>{form.umur} hari</strong> dari tgl jatuh tempo ke hari ini
            </div>
          )}
          {form.status === 'CLOSE' && (
            <div className="umur-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14.5l-4-4 1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5z"/>
              </svg>
              Jatuh Tempo otomatis menjadi <strong>0 hari</strong> karena status CLOSE
            </div>
          )}
        </Modal>
      )}

      {/* ══ Konfirmasi Hapus Semua ════════════════════════════════ */}
      {confirmClear && (
        <div className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setConfirmClear(false); }}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--dark-red)' }}>⚠️ Hapus Semua Data</h3>
              <button className="btn-icon" onClick={() => setConfirmClear(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Semua <strong>{tagihanRows.length} baris</strong> data tagihan akan dihapus permanen.</p>
              <p style={{ marginTop: 8, color: 'var(--text-sub)', fontSize: 13 }}>Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmClear(false)}>Batal</button>
              <button className="btn btn-danger" onClick={() => {
                clearAllTagihan(); setConfirmClear(false); setFilterCust('');
                showToast('Semua data tagihan dihapus.', 'info');
              }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-komponen ──────────────────────────────────────────────────
function SoaPreview({ cust, rows, selStatus, previewOpen, previewClose }) {
  const count = selStatus === 'OPEN' ? rows.filter(r => r.status === 'OPEN').length
    : selStatus === 'CLOSE' ? rows.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS').length
      : rows.length;
  const label = selStatus === 'OPEN' ? 'Open' : selStatus === 'CLOSE' ? 'Close' : 'Open/Close';
  const total = selStatus === 'CLOSE' ? previewClose
    : selStatus === 'OPEN' ? previewOpen
      : previewOpen + previewClose;
  return (
    <div className="soa-preview-box">
      <div className="soa-preview-label">Preview SOA yang akan digenerate:</div>
      <div className="soa-preview-content">
        <div className="soa-preview-row">
          <div className="soa-preview-left">
            <div className="soa-preview-item">
              <span className="soa-key">Kepada</span><span className="soa-sep">:</span>
              <span className="soa-val soa-val-name">{cust?.name}</span>
            </div>
            <div className="soa-preview-item">
              <span className="soa-key">ID Customer</span><span className="soa-sep">:</span>
              <span className="soa-val">{cust?.id}</span>
            </div>
          </div>
          <div className="soa-preview-right">
            <div className="soa-preview-item">
              <span className="soa-key">Status</span><span className="soa-sep">:</span>
              <span className={`soa-val ${selStatus === 'OPEN' ? 'status-open' : selStatus === 'CLOSE' ? 'status-close' : ''}`}>{label}</span>
            </div>
            <div className="soa-preview-item">
              <span className="soa-key">Invoice</span><span className="soa-sep">:</span>
              <span className="soa-val">{count} baris</span>
            </div>
            <div className="soa-preview-item">
              <span className="soa-key">Total</span><span className="soa-sep">:</span>
              <span className="soa-val" style={{ color: 'var(--dark-red)', fontWeight: 700 }}>
                Rp {new Intl.NumberFormat('id-ID').format(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IcoExcel() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <polyline points="8 13 10.5 17 13 13" />
      <line x1="10.5" y1="17" x2="10.5" y2="10" />
    </svg>
  );
}
function IcoPDF() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="9" y1="13" x2="9" y2="17" />
      <path d="M9 13h2a1 1 0 0 1 0 2H9" />
      <line x1="13" y1="13" x2="13" y2="17" />
      <path d="M13 13h1.5a1.5 1.5 0 0 1 0 3H13" />
    </svg>
  );
}
