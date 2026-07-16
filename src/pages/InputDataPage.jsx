import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

// ── Nilai default form kosong ────────────────────────────────────
const emptyForm = () => ({
  customerId  : '',
  namaCustomer: '',
  noInvoice   : '',
  tglInvoice  : '',
  jatuhTempo  : '',
  nominal     : '',
  status      : 'OPEN',
  tglClose    : '',
  umur        : '0',
  termin1     : '',
  termin2     : '',
  termin3     : '',
  baseNominal : ''
});

// Format angka ke Rupiah untuk display
function formatRp(num) {
  if (!num && num !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

// Parse input nominal (user ketik bebas)
function parseNominalInput(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Hitung umur otomatis dari jatuh tempo ke hari ini
function hitungUmur(jatuhTempoStr) {
  if (!jatuhTempoStr) return 0;
  try {
    const [d, m, y] = jatuhTempoStr.split('/');
    const tgl = new Date(Number(y), Number(m) - 1, Number(d));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.floor((tgl - today) / 86400000);
  } catch { return 0; }
}

// Format Date input (yyyy-MM-dd) ke dd/MM/yyyy
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
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

export default function InputDataPage() {
  const {
    tagihanRows, addTagihanRow, updateTagihanRow,
    deleteTagihanRow, clearAllTagihan, customers, showToast
  } = useApp();

  const [form,      setForm]      = useState(emptyForm());
  const [editIndex, setEditIndex] = useState(null); // null = add mode
  const [showForm,  setShowForm]  = useState(false);
  const [nominalDisplay, setNominalDisplay] = useState('');
  const [baseNominalDisplay, setBaseNominalDisplay] = useState('');
  const [termin1Display, setTermin1Display] = useState('');
  const [termin2Display, setTermin2Display] = useState('');
  const [termin3Display, setTermin3Display] = useState('');
  const [filterCust, setFilterCust] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // ── Handler form ────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-hitung umur saat jatuh tempo diisi & status OPEN
      if (name === 'jatuhTempo' || name === 'status') {
        const jt = name === 'jatuhTempo' ? htmlDateToDisplay(value) : htmlDateToDisplay(prev.jatuhTempo);
        updated.umur = updated.status === 'OPEN' ? String(hitungUmur(jt)) : '0';
      }

      // Auto-kosongkan tglClose jika status kembali ke OPEN
      if (name === 'status' && value === 'OPEN') {
        updated.tglClose = '';
      }

      return updated;
    });
  }

  // ── Saat Customer ID dipilih dari dropdown → nama ikut terisi ───
  function handleCustomerIdChange(e) {
    const selectedId = e.target.value;
    const matched    = customers.find(c => c.id === selectedId);
    setForm(prev => ({
      ...prev,
      customerId  : selectedId,
      namaCustomer: matched ? matched.name : prev.namaCustomer,
    }));
  }

  // ── Saat Customer ID diketik manual → cari cocok → isi nama ────
  function handleCustomerIdInput(e) {
    const typedId = e.target.value;
    const matched = customers.find(c => c.id === typedId);
    setForm(prev => ({
      ...prev,
      customerId  : typedId,
      namaCustomer: matched ? matched.name : prev.namaCustomer,
    }));
  }

  // ── Saat Nama diketik manual → cari cocok → isi ID ─────────────
  function handleNamaCustomerInput(e) {
    const typedName = e.target.value;
    const matched   = customers.find(
      c => c.name.toLowerCase() === typedName.toLowerCase()
    );
    setForm(prev => ({
      ...prev,
      namaCustomer: typedName,
      customerId  : matched ? matched.id : prev.customerId,
    }));
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
    setForm(prev => ({ ...prev, nominal: val }));
  }

  function openAdd() {
    setForm(emptyForm());
    setNominalDisplay('');
    setBaseNominalDisplay('');
    setTermin1Display(''); setTermin2Display(''); setTermin3Display('');
    setEditIndex(null);
    setShowForm(true);
  }

  function openEdit(index) {
    const r = tagihanRows[index];
    setForm({
      customerId  : r.customerId,
      namaCustomer: r.namaCustomer,
      noInvoice   : r.noInvoice,
      tglInvoice  : displayDateToHtml(r.tglInvoice),
      jatuhTempo  : displayDateToHtml(r.jatuhTempo),
      nominal     : String(r.nominal),
      status      : r.status,
      tglClose    : displayDateToHtml(r.tglClose),
      umur        : String(r.umur),
      termin1     : r.termin1 || '',
      termin2     : r.termin2 || '',
      termin3     : r.termin3 || '',
      baseNominal : r.baseNominal || String(r.nominal),
    });
    setBaseNominalDisplay(r.baseNominal ? Number(r.baseNominal).toLocaleString('id-ID') : (r.nominal ? Number(r.nominal).toLocaleString('id-ID') : ''));
    setTermin1Display(r.termin1 ? Number(r.termin1).toLocaleString('id-ID') : '');
    setTermin2Display(r.termin2 ? Number(r.termin2).toLocaleString('id-ID') : '');
    setTermin3Display(r.termin3 ? Number(r.termin3).toLocaleString('id-ID') : '');
    setNominalDisplay(r.nominal ? Number(r.nominal).toLocaleString('id-ID') : '');
    setEditIndex(index);
    setShowForm(true);
  }

  function handleSave() {
    // Validasi wajib
    if (!form.customerId.trim())   { showToast('Customer ID wajib diisi.', 'error'); return; }
    if (!form.namaCustomer.trim()) { showToast('Nama Customer wajib diisi.', 'error'); return; }
    if (!form.noInvoice.trim())    { showToast('No Invoice wajib diisi.', 'error'); return; }
    if (!form.tglInvoice)          { showToast('Tgl Invoice wajib diisi.', 'error'); return; }
    if (!form.jatuhTempo)          { showToast('Jatuh Tempo wajib diisi.', 'error'); return; }
    if (!form.nominal)             { showToast('Nominal wajib diisi.', 'error'); return; }

    const row = {
      customerId  : form.customerId.trim(),
      namaCustomer: form.namaCustomer.trim(),
      noInvoice   : form.noInvoice.trim(),
      tglInvoice  : htmlDateToDisplay(form.tglInvoice),
      jatuhTempo  : htmlDateToDisplay(form.jatuhTempo),
      nominal     : parseNominalInput(form.nominal),
      status      : form.status,
      tglClose    : form.status === 'CLOSE' ? htmlDateToDisplay(form.tglClose) : '',
      umur        : Number(form.umur) || 0,
      termin1     : parseNominalInput(form.termin1) || 0,
      termin2     : parseNominalInput(form.termin2) || 0,
      termin3     : parseNominalInput(form.termin3) || 0,
      baseNominal : parseNominalInput(form.baseNominal || form.nominal),
    };

    if (editIndex !== null) {
      updateTagihanRow(editIndex, row);
      showToast('Data berhasil diupdate!', 'success');
    } else {
      addTagihanRow(row);
      showToast('Data berhasil disimpan!', 'success');
    }
    setShowForm(false);
    setForm(emptyForm());
    setNominalDisplay('');
    setBaseNominalDisplay('');
    setTermin1Display(''); setTermin2Display(''); setTermin3Display('');
  }

  function handleDelete(index) {
    deleteTagihanRow(index);
    showToast('Data dihapus.', 'info');
  }

  // ── Filter & display ────────────────────────────────────────────
  const dynamicRows = tagihanRows.map((r, i) => ({
    ...r,
    _originalIndex: i,
    umur: r.status === 'OPEN' ? String(hitungUmur(r.jatuhTempo)) : '0'
  }));

  const displayed = filterCust
    ? dynamicRows.filter(r => r.customerId === filterCust)
    : dynamicRows;

  const totalSemua = displayed.reduce((s, r) => s + r.nominal, 0);
  const totalOpen  = displayed.filter(r => r.status === 'OPEN').reduce((s, r) => s + r.nominal, 0);

  return (
    <>
      {/* ── Header card ── */}
      <div className="card">
        <div className="card-header">
          <h2>Data Tagihan</h2>
          {tagihanRows.length > 0 && (
            <span className="badge">{tagihanRows.length} baris</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter customer */}
            {customers.length > 0 && (
              <select
                className="form-control"
                style={{ width: 200, padding: '6px 10px' }}
                value={filterCust}
                onChange={e => setFilterCust(e.target.value)}
              >
                <option value="">Semua Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {tagihanRows.length > 0 && (
              <button
                className="btn btn-sm btn-danger"
                onClick={() => setConfirmClear(true)}
                title="Hapus semua data"
              >
                Hapus Semua
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              + Tambah Data
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {tagihanRows.length > 0 && (
          <div className="summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Invoice</span>
              <span className="summary-value">{displayed.length}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-label">Total Nominal</span>
              <span className="summary-value" style={{ color: 'var(--dark-blue)' }}>
                Rp {formatRp(totalSemua)}
              </span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-label">Total Open</span>
              <span className="summary-value" style={{ color: 'var(--dark-red)' }}>
                Rp {formatRp(totalOpen)}
              </span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-label">Total Close</span>
              <span className="summary-value" style={{ color: 'var(--success)' }}>
                Rp {formatRp(totalSemua - totalOpen)}
              </span>
            </div>
          </div>
        )}

        {/* Tabel data */}
        {tagihanRows.length === 0 ? (
          <div className="empty-full">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <p>Belum ada data tagihan.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Klik <strong>+ Tambah Data</strong> untuk input manual,
              atau gunakan tab <strong>Upload Excel</strong> untuk import dari file.
            </p>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 12 }}>
              + Tambah Data Tagihan
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 42 }}>No</th>
                  <th>Customer ID</th>
                  <th>Nama Customer</th>
                  <th>No Invoice</th>
                  <th>Tgl Invoice</th>
                  <th>Jatuh Tempo</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Sisa Tagihan</th>
                    <th style={{ width: 100 }}>Termin</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Status</th>
                  <th>Tgl Close</th>
                  <th style={{ width: 80 }}>Jatuh Tempo</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r, i) => {
                  // Gunakan index asli dari _originalIndex
                  const realIndex = r._originalIndex;
                  const isDanger = r.status === 'OPEN' && Number(r.umur) <= 14;
                  return (
                    <tr key={realIndex}>
                      <td className="center-cell">{r.no}</td>
                      <td>{r.customerId}</td>
                      <td style={{ fontWeight: 500 }}>{r.namaCustomer}</td>
                      <td>{r.noInvoice}</td>
                      <td className="center-cell">{r.tglInvoice}</td>
                      <td className="center-cell">{r.jatuhTempo}</td>
                      <td className="nominal-cell">{formatRp(r.nominal)}</td>
                      <td>{r.terminName || '-'}</td>
                      <td>
                        <span className={r.status === 'OPEN' ? 'status-open' : 'status-close'}>
                          {r.status === 'LUNAS' ? 'CLOSE' : r.status}
                        </span>
                      </td>
                      <td className="center-cell">{r.tglClose || '—'}</td>
                      <td className="center-cell" style={isDanger ? { color: 'var(--dark-red)', fontWeight: 700 } : {}}>{r.umur}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEdit(realIndex)}
                            title="Edit"
                          >✏️</button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(realIndex)}
                            title="Hapus"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Form Input ── */}
      {showForm && (
        <Modal
          title={editIndex !== null ? 'Edit Data Tagihan' : 'Tambah Data Tagihan Baru'}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        >
          <div className="form-grid-2">
            <div className="form-group">
              <label>Customer ID <span className="req">*</span></label>

              {/* Jika ada customer yang tersimpan → tampilkan select + opsi ketik baru */}
              {customers.length > 0 ? (
                <>
                  <select
                    className="form-control"
                    value={customers.find(c => c.id === form.customerId) ? form.customerId : '__new__'}
                    onChange={e => {
                      if (e.target.value === '__new__') {
                        setForm(prev => ({ ...prev, customerId: '', namaCustomer: '' }));
                      } else {
                        handleCustomerIdChange(e);
                      }
                    }}
                  >
                    <option value="__new__">— Ketik customer baru —</option>
                    <optgroup label="Customer tersimpan">
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.id}  —  {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Input manual jika pilih "ketik baru" atau tidak cocok */}
                  {!customers.find(c => c.id === form.customerId) && (
                    <input
                      className="form-control"
                      style={{ marginTop: 6 }}
                      placeholder="Ketik Customer ID baru"
                      value={form.customerId}
                      onChange={handleCustomerIdInput}
                      autoFocus
                    />
                  )}
                </>
              ) : (
                /* Belum ada customer sama sekali → langsung input */
                <input
                  className="form-control"
                  placeholder="Contoh: 1000000"
                  value={form.customerId}
                  onChange={handleCustomerIdInput}
                  autoFocus
                />
              )}
            </div>

            <div className="form-group">
              <label>Nama Customer <span className="req">*</span></label>
              <input
                className={`form-control${form.namaCustomer && customers.find(c => c.id === form.customerId) ? ' input-autofilled' : ''}`}
                placeholder="Terisi otomatis atau ketik baru"
                value={form.namaCustomer}
                onChange={handleNamaCustomerInput}
                readOnly={!!customers.find(c => c.id === form.customerId)}
                style={
                  customers.find(c => c.id === form.customerId)
                    ? { background: '#EFF6FF', color: 'var(--dark-blue)', fontWeight: 600, cursor: 'default' }
                    : {}
                }
              />
              {customers.find(c => c.id === form.customerId) && (
                <span className="field-hint">
                  ✓ Terisi otomatis dari Customer ID
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>No Invoice <span className="req">*</span></label>
            <input
              name="noInvoice"
              className="form-control"
              placeholder="Contoh: PM60712190"
              value={form.noInvoice}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Tgl Invoice <span className="req">*</span></label>
              <input
                type="date"
                name="tglInvoice"
                className="form-control"
                value={form.tglInvoice}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Jatuh Tempo <span className="req">*</span></label>
              <input
                type="date"
                name="jatuhTempo"
                className="form-control"
                value={form.jatuhTempo}
                onChange={handleChange}
              />
            </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Total Tagihan (Rp) <span className="req">*</span></label>
                <input
                  className="form-control"
                  placeholder="Contoh: 10.092.422"
                  value={baseNominalDisplay}
                  onChange={handleBaseNominalChange}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 20 }}>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Termin 1 (Rp)</label>
                  <input className="form-control" placeholder="Cth: 2.000.000"
                    value={termin1Display} onChange={e => handleTerminChange(e, 'termin1')} inputMode="numeric" />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Termin 2 (Rp)</label>
                  <input className="form-control" placeholder="Cth: 1.500.000"
                    value={termin2Display} onChange={e => handleTerminChange(e, 'termin2')} inputMode="numeric" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Termin 3 (Rp)</label>
                  <input className="form-control" placeholder="Cth: 1.000.000"
                    value={termin3Display} onChange={e => handleTerminChange(e, 'termin3')} inputMode="numeric" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Total Tagihan Akhir (Rp) <span className="req">*</span></label>
                  <input className="form-control" value={nominalDisplay} onChange={handleNominalChange} inputMode="numeric"
                    style={{ fontWeight: 600, color: 'var(--dark-blue)' }} />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  className="form-control"
                  value={form.status}
                  onChange={handleChange}
                ><option value="OPEN">OPEN</option>
                <option value="CLOSE">CLOSE</option>
              </select>
            </div>
          </div>

          {form.status === 'CLOSE' && (
            <div className="form-grid-2">
              <div className="form-group">
                <label>Tgl Close</label>
                <input
                  type="date"
                  name="tglClose"
                  className="form-control"
                  value={form.tglClose}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Umur (hari)</label>
                <input
                  className="form-control"
                  value="0"
                  readOnly
                  style={{ background: '#F8FAFC', color: 'var(--text-sub)' }}
                />
              </div>
            </div>
          )}

          {form.status === 'OPEN' && form.jatuhTempo && (
            <div className="umur-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
              </svg>
              Umur otomatis: <strong>{form.umur} hari</strong> dari jatuh tempo ke hari ini
            </div>
          )}
        </Modal>
      )}

      {/* ── Confirm Clear All ── */}
      {confirmClear && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setConfirmClear(false); }}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--dark-red)' }}>⚠️ Hapus Semua Data</h3>
              <button className="btn-icon" onClick={() => setConfirmClear(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Semua <strong>{tagihanRows.length} baris</strong> data tagihan akan dihapus permanen dari penyimpanan.</p>
              <p style={{ marginTop: 8, color: 'var(--text-sub)', fontSize: 13 }}>Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmClear(false)}>Batal</button>
              <button className="btn btn-danger" onClick={() => {
                clearAllTagihan();
                setConfirmClear(false);
                setFilterCust('');
                showToast('Semua data tagihan dihapus.', 'info');
              }}>Ya, Hapus Semua</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
