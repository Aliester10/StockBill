import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { company, setCompany, showToast } = useApp();

  const [name,    setName]    = useState(company.name    || '');
  const [address, setAddress] = useState(company.address || '');
  const [telp,    setTelp]    = useState(company.telp    || '');

  // Sync jika company berubah dari luar
  useEffect(() => {
    setName(company.name    || '');
    setAddress(company.address || '');
    setTelp(company.telp    || '');
  }, [company]);

  function handleSave() {
    if (!name.trim()) { showToast('Nama perusahaan tidak boleh kosong.', 'error'); return; }
    setCompany({ name: name.trim(), address: address.trim(), telp: telp.trim() });
    showToast('Pengaturan berhasil disimpan!', 'success');
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <h2>Informasi Perusahaan</h2>
        <span className="subtitle">Data ini akan muncul di header Statement of Account.</span>
      </div>
      <div className="card-body">
        <div className="form-group">
          <label>Nama Perusahaan</label>
          <input
            className="form-control"
            placeholder="PT XYZ"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Alamat</label>
          <input
            className="form-control"
            placeholder="Jl. Merdeka No. X8, Medan"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Nomor Telepon</label>
          <input
            className="form-control"
            placeholder="061 654 3210"
            value={telp}
            onChange={e => setTelp(e.target.value)}
          />
        </div>

        {/* Preview header */}
        <div style={{
          padding: '14px 16px', background: '#F8FAFC',
          border: '1px solid var(--border)', borderRadius: 8,
          fontSize: 13, color: 'var(--text-sub)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--dark-blue)' }}>Preview Header:</div>
          <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'center' }}>STATEMENT OF ACCOUNT</div>
          <div style={{ textAlign: 'center', marginTop: 2 }}>
            {name || 'PT XYZ'}  |  {address || 'Alamat'}  |  Telp {telp || '-'}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          style={{ alignSelf: 'flex-start' }}
        >
          Simpan
        </button>
      </div>
    </div>
  );
}
