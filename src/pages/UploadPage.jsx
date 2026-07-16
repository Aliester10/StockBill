import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { parseExcelFile } from '../utils/parseExcel';
import { generateSOA } from '../utils/generateSOA';
import { generatePDF } from '../utils/generatePDF';

function formatRp(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function UploadPage() {
  const { customers, company, tagihanRows, mergeUpload, showToast } = useApp();

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadMode,   setUploadMode]   = useState('replace');
  const [generatingXls, setGeneratingXls] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [selCustomer,  setSelCustomer]  = useState('');
  const [selStatus,    setSelStatus]    = useState('ALL');
  const fileInputRef                    = useRef(null);

  function pickFile(file) {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showToast('File harus berformat .xlsx atau .xls', 'error');
      return;
    }
    setSelectedFile(file);
  }

  function clearFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const rows = await parseExcelFile(selectedFile);
      if (rows.length === 0) {
        showToast('Tidak ada data ditemukan. Pastikan format kolom sudah benar.', 'error');
      } else {
        mergeUpload(rows, uploadMode);
        const uniq = new Set(rows.map(r => r.customerId)).size;
        const modeLabel = uploadMode === 'replace' ? 'diganti' : 'ditambahkan';
        showToast(
          `${rows.length} baris data berhasil ${modeLabel} (${uniq} customer).`,
          'success'
        );
        clearFile();
      }
    } catch (err) {
      showToast('Gagal membaca file: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  // ── Shared: validasi & ambil data sebelum generate ──────────────
  function getGeneratePayload() {
    if (!selCustomer) { showToast('Pilih customer terlebih dahulu.', 'error'); return null; }
    const custRows = tagihanRows.filter(r => r.customerId === selCustomer);
    if (custRows.length === 0) { showToast('Tidak ada data untuk customer ini.', 'error'); return null; }

    const cust = { id: custRows[0].customerId, name: custRows[0].namaCustomer };
    let rows   = custRows;
    if (selStatus === 'OPEN')  rows = custRows.filter(r => r.status === 'OPEN');
    if (selStatus === 'CLOSE') rows = custRows.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS');

    if (rows.length === 0) {
      showToast(`Tidak ada tagihan dengan status "${selStatus}" untuk customer ini.`, 'error');
      return null;
    }
    return { cust, rows };
  }

  async function handleGenerateExcel() {
    const payload = getGeneratePayload();
    if (!payload) return;
    setGeneratingXls(true);
    try {
      await generateSOA(company, payload.cust, payload.rows, selStatus);
      showToast('File Excel berhasil diunduh!', 'success');
    } catch (err) {
      showToast('Gagal generate Excel: ' + err.message, 'error');
    } finally {
      setGeneratingXls(false);
    }
  }

  async function handleGeneratePDF() {
    const payload = getGeneratePayload();
    if (!payload) return;
    setGeneratingPdf(true);
    try {
      await generatePDF(company, payload.cust, payload.rows, selStatus);
      showToast('File PDF berhasil diunduh!', 'success');
    } catch (err) {
      showToast('Gagal generate PDF: ' + err.message, 'error');
    } finally {
      setGeneratingPdf(false);
    }
  }

  // Summary customer yang dipilih
  const previewRows  = selCustomer ? tagihanRows.filter(r => r.customerId === selCustomer) : [];
  const previewOpen  = previewRows.filter(r => r.status === 'OPEN').reduce((s, r) => s + r.nominal, 0);
  const previewClose = previewRows.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS').reduce((s, r) => s + r.nominal, 0);

  return (
    <>
      {/* ── SECTION 1: Upload File ── */}
      <div className="card">
        <div className="card-header">
          <h2>Import dari File Excel</h2>
          <span className="subtitle">
            Upload file Daftar Tagihan Piutang. Customer terdeteksi otomatis dari data.
          </span>
        </div>
        <div className="card-body">

          {/* Mode upload */}
          <div className="upload-mode-group">
            <span className="upload-mode-label">Mode import:</span>
            <label className={`upload-mode-opt${uploadMode === 'replace' ? ' active' : ''}`}>
              <input
                type="radio" name="uploadMode" value="replace"
                checked={uploadMode === 'replace'}
                onChange={() => setUploadMode('replace')}
              />
              <span>
                <strong>Ganti Semua</strong>
                <small>Data lama dihapus, diganti dengan data baru</small>
              </span>
            </label>
            <label className={`upload-mode-opt${uploadMode === 'append' ? ' active' : ''}`}>
              <input
                type="radio" name="uploadMode" value="append"
                checked={uploadMode === 'append'}
                onChange={() => setUploadMode('append')}
              />
              <span>
                <strong>Tambahkan</strong>
                <small>Data baru digabung dengan data yang sudah ada</small>
              </span>
            </label>
          </div>

          {/* Drop zone */}
          <div
            className={`upload-area${dragOver ? ' dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
          >
            <div className="upload-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1F3864" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="upload-text">Klik atau drag &amp; drop file Excel (.xlsx / .xls)</p>
            <p className="upload-hint">
              Format kolom: No | Customer ID | Nama Customer | No Invoice | Tgl Invoice | Jatuh Tempo | Nominal | Status | Tgl Close | Umur
            </p>
            <input
              ref={fileInputRef} type="file" accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={e => pickFile(e.target.files[0])}
            />
          </div>

          {selectedFile && (
            <div className="file-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F3864" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span>{selectedFile.name} ({formatSize(selectedFile.size)})</span>
              <button className="btn-icon" onClick={clearFile}>✕</button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-primary"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
            >
              {uploading
                ? <><span className="spinner" /> Memproses…</>
                : <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Import File
                  </>
              }
            </button>
            {tagihanRows.length > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                Data tersimpan: <strong style={{ color: 'var(--dark-blue)' }}>{tagihanRows.length} baris</strong>
                {' '}({customers.length} customer)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Generate SOA ── */}
      <div className="card">
        <div className="card-header">
          <h2>Generate Statement of Account</h2>
        </div>
        <div className="card-body">
          {tagihanRows.length === 0 ? (
            <div className="info-hint">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Belum ada data tagihan. Gunakan <strong>Import File</strong> di atas atau input manual di tab
              <strong> Data Tagihan</strong>.
            </div>
          ) : (
            <>
              <div className="generate-form">
                <div className="form-group">
                  <label>
                    Customer
                    <span style={{ fontWeight: 400, color: 'var(--text-sub)', marginLeft: 6 }}>
                      ({customers.length} tersedia)
                    </span>
                  </label>
                  <select
                    className="form-control"
                    value={selCustomer}
                    onChange={e => setSelCustomer(e.target.value)}
                  >
                    <option value="">-- Pilih Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}  —  ID: {c.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Filter Status</label>
                  <select
                    className="form-control"
                    value={selStatus}
                    onChange={e => setSelStatus(e.target.value)}
                  >
                    <option value="ALL">Semua (Open &amp; Close)</option>
                    <option value="OPEN">Open — Belum Close</option>
                    <option value="CLOSE">Close</option>
                  </select>
                </div>

                <div className="generate-btn-group">
                  <button
                    className="btn btn-excel"
                    onClick={handleGenerateExcel}
                    disabled={generatingXls || generatingPdf || !selCustomer}
                    title="Download Statement of Account (.xlsx)"
                  >
                    {generatingXls ? (
                      <><span className="spinner spinner-dark" /> Memproses…</>
                    ) : (
                      <>
                        <IconExcel />
                        Excel
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-pdf"
                    onClick={handleGeneratePDF}
                    disabled={generatingPdf || generatingXls || !selCustomer}
                    title="Download Statement of Account (.pdf)"
                  >
                    {generatingPdf ? (
                      <><span className="spinner" /> Memproses…</>
                    ) : (
                      <>
                        <IconPDF />
                        PDF
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview SOA sebelum generate */}
              {selCustomer && previewRows.length > 0 && (
                <SoaPreview
                  cust={customers.find(c => c.id === selCustomer)}
                  rows={previewRows}
                  selStatus={selStatus}
                  previewOpen={previewOpen}
                  previewClose={previewClose}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Preview info SOA sebelum generate ── */
function SoaPreview({ cust, rows, selStatus, previewOpen, previewClose }) {
  const filteredCount =
    selStatus === 'OPEN'  ? rows.filter(r => r.status === 'OPEN').length  :
    selStatus === 'CLOSE' ? rows.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS').length :
    rows.length;

  const statusLabel =
    selStatus === 'OPEN'  ? 'Open' :
    selStatus === 'CLOSE' ? 'Close' : 'Open/Close';

  const totalPreview =
    selStatus === 'CLOSE' ? previewClose :
    selStatus === 'OPEN'  ? previewOpen  :
    previewOpen + previewClose;

  return (
    <div className="soa-preview-box">
      <div className="soa-preview-label">Preview SOA yang akan digenerate:</div>
      <div className="soa-preview-content">
        <div className="soa-preview-row">
          <div className="soa-preview-left">
            <div className="soa-preview-item">
              <span className="soa-key">Kepada</span>
              <span className="soa-sep">:</span>
              <span className="soa-val soa-val-name">{cust?.name}</span>
            </div>
            <div className="soa-preview-item">
              <span className="soa-key">ID Customer</span>
              <span className="soa-sep">:</span>
              <span className="soa-val">{cust?.id}</span>
            </div>
          </div>
          <div className="soa-preview-right">
            <div className="soa-preview-item">
              <span className="soa-key">Status</span>
              <span className="soa-sep">:</span>
              <span className={`soa-val ${selStatus === 'OPEN' ? 'status-open' : selStatus === 'CLOSE' ? 'status-close' : ''}`}>
                {statusLabel}
              </span>
            </div>
            <div className="soa-preview-item">
              <span className="soa-key">Invoice</span>
              <span className="soa-sep">:</span>
              <span className="soa-val">{filteredCount} baris</span>
            </div>
            <div className="soa-preview-item">
              <span className="soa-key">Total</span>
              <span className="soa-sep">:</span>
              <span className="soa-val" style={{ color: 'var(--dark-red)', fontWeight: 700 }}>
                Rp {new Intl.NumberFormat('id-ID').format(totalPreview)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Icon Excel ── */
function IconExcel() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <polyline points="8 13 10.5 17 13 13"/>
      <line x1="10.5" y1="17" x2="10.5" y2="10"/>
    </svg>
  );
}

/* ── Icon PDF ── */
function IconPDF() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="9" y1="13" x2="9" y2="17"/>
      <path d="M9 13h2a1 1 0 0 1 0 2H9"/>
      <line x1="13" y1="13" x2="13" y2="17"/>
      <path d="M13 13h1.5a1.5 1.5 0 0 1 0 3H13"/>
    </svg>
  );
}
