import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { company, setCompany, termins, setTermins, showToast } = useApp();

  // Company State

  const [name,    setName]    = useState(company.name    || '');
  const [address, setAddress] = useState(company.address || '');
  const [telp,    setTelp]    = useState(company.telp    || '');

  // Termin State (local copy for editing)
  const [localTermins, setLocalTermins] = useState(termins);

  // Sync jika data berubah dari luar
  useEffect(() => {
    setName(company.name    || '');
    setAddress(company.address || '');
    setTelp(company.telp    || '');
    setLocalTermins(termins);
  }, [company, termins]);

  function handleSave() {
    if (!name.trim()) { showToast('Nama perusahaan tidak boleh kosong.', 'error'); return; }
    
    // Validasi termins
    const validTermins = localTermins.filter(t => t.name.trim() !== '');
    
    setCompany({ name: name.trim(), address: address.trim(), telp: telp.trim() });
    setTermins(validTermins);
    showToast('Pengaturan berhasil disimpan!', 'success');
  }

  function addTermin() {
    setLocalTermins([...localTermins, { id: 't' + Date.now(), name: 'Termin Baru', percent: 0 }]);
  }

  function updateTermin(index, field, value) {
    const updated = [...localTermins];
    updated[index] = { ...updated[index], [field]: value };
    setLocalTermins(updated);
  }

  function removeTermin(index) {
    setLocalTermins(localTermins.filter((_, i) => i !== index));
  }

  return (
    <>
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
    
    <div className="card" style={{ maxWidth: 520, marginTop: 24 }}>
      <div className="card-header">
        <h2>Pengaturan Termin</h2>
        <span className="subtitle">Persentase potongan otomatis saat input tagihan.</span>
      </div>
      <div className="card-body">
        {localTermins.length === 0 ? (
          <div className="info-hint" style={{ marginBottom: 16 }}>Belum ada termin.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {localTermins.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input 
                  className="form-control" 
                  style={{ flex: 2 }}
                  value={t.name}
                  onChange={e => updateTermin(i, 'name', e.target.value)}
                  placeholder="Nama Termin"
                />
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    type="number"
                    className="form-control" 
                    value={t.percent}
                    onChange={e => updateTermin(i, 'percent', Number(e.target.value))}
                    placeholder="Persentase"
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>%</span>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => removeTermin(i)} title="Hapus Termin">🗑️</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-sm btn-secondary" onClick={addTermin}>+ Tambah Termin</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Simpan Pengaturan</button>
        </div>
      </div>
    </div>
    </>
  );
}
