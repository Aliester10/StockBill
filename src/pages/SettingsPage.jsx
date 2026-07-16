import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { company, setCompany, termins, setTermins, showToast } = useApp();

  // Company State

  const [name,    setName]    = useState(company.name    || '');
  const [address, setAddress] = useState(company.address || '');
  const [telp,    setTelp]    = useState(company.telp    || '');
  const [logo,    setLogo]    = useState(company.logo    || '');

  // Sync jika data berubah dari luar
  useEffect(() => {
    setName(company.name    || '');
    setAddress(company.address || '');
    setTelp(company.telp    || '');
    setLogo(company.logo    || '');
  }, [company]);

  function handleSave() {
    if (!name.trim()) { showToast('Nama perusahaan tidak boleh kosong.', 'error'); return; }
    
    setCompany({ name: name.trim(), address: address.trim(), telp: telp.trim(), logo });
    showToast('Pengaturan berhasil disimpan!', 'success');
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header Sticky-like */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: 24, padding: '16px 20px', background: '#fff', 
        borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border)' 
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: 'var(--dark-blue)' }}>Pengaturan Sistem</h2>
          <span className="subtitle" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>Kelola profil perusahaan untuk kop surat di PDF & Excel.</span>
        </div>
        <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Simpan Semua
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        <div className="card" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', margin: 0 }}>
          <div className="card-header" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--dark-blue)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Informasi Perusahaan (Kop Surat)
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13 }}>Nama Perusahaan</label>
              <input className="form-control" placeholder="PT XYZ" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13 }}>Alamat</label>
              <input className="form-control" placeholder="Jl. Merdeka No. X8, Medan" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13 }}>Nomor Telepon</label>
              <input className="form-control" placeholder="061 654 3210" value={telp} onChange={e => setTelp(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13 }}>Logo Perusahaan (Opsional)</label>
              <div style={{ 
                border: '2px dashed var(--border)', borderRadius: 8, padding: '16px', 
                textAlign: 'center', background: '#F8FAFC', position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 120
              }}>
                {logo ? (
                  <>
                    <img src={logo} alt="Logo" style={{ maxHeight: 60, objectFit: 'contain' }} />
                    <button className="btn btn-sm" style={{ background: '#FEE2E2', color: 'var(--dark-red)' }} onClick={() => setLogo('')}>Hapus Logo</button>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Pilih gambar logo untuk kop surat</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setLogo(reader.result);
                      reader.readAsDataURL(file);
                    } else { setLogo(''); }
                  }}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Preview header */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Preview Header di PDF & Excel</label>
            <div style={{
              padding: '16px', background: '#F8FAFC',
              border: '1px solid var(--border)', borderRadius: 8,
              fontSize: 13, color: 'var(--text-sub)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                {logo && <img src={logo} alt="Logo" style={{ maxHeight: 50, objectFit: 'contain', marginBottom: 8 }} />}
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--dark-blue)' }}>STATEMENT OF ACCOUNT</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                {name || 'PT XYZ'}  |  {address || 'Alamat'}  |  Telp {telp || '-'}
              </div>
            </div>
        </div>
        </div>
      </div>
    </div>
  </div>
  );
}
