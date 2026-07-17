import React, { useState } from 'react';
import { generateStockExcel } from '../utils/generateStockExcel';
import { generateStockPDF } from '../utils/generateStockPDF';
import Modal from '../components/Modal';

const initialMockData = [
  {
    id: 1,
    namaBarang: "Kertas Label Thermal 100x150",
    vendor: "NIAGA",
    noPo: "4500001613",
    order: 200,
    transit: 200,
    datang: 200,
    sisa: 0,
    status: "GR",
    keterangan: "sudah tiba manado",
    noGr: "50001234",
    pic: "Andi",
    history: [
      { noGr: "GR-001", tanggal: "12/06/2026", transit: 200, datang: 200, pic: "Andi", keterangan: "sudah tiba manado" }
    ]
  },
  {
    id: 2,
    namaBarang: "Kertas Label Thermal 100x150",
    vendor: "NIAGA",
    noPo: "4500002100",
    order: 500,
    transit: 300,
    datang: 150,
    sisa: 350,
    status: "Partial",
    keterangan: "datang bertahap",
    noGr: "50001235",
    pic: "Budi",
    history: [
      { noGr: "GR-008", tanggal: "20/06/2026", transit: 300, datang: 0, pic: "Budi", keterangan: "masih transit MKR" },
      { noGr: "GR-009", tanggal: "28/06/2026", transit: 0, datang: 150, pic: "Andi", keterangan: "datang sebagian" }
    ]
  },
  {
    id: 3,
    namaBarang: "Box Karton Polos Log 2",
    vendor: "SPI",
    noPo: "4500001618",
    order: 3000,
    transit: 940,
    datang: 560,
    sisa: 2440,
    status: "Partial",
    keterangan: "di pinjam Palu",
    noGr: "",
    pic: "",
    history: [
      { noGr: "-", tanggal: "15/06/2026", transit: 940, datang: 560, pic: "-", keterangan: "di pinjam Palu" }
    ]
  }
];

export default function StockPage() {
  const [dataList, setDataList] = useState(initialMockData);
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('Semua vendor');
  const [statusFilter, setStatusFilter] = useState('Semua');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    namaBarang: '',
    vendor: '',
    noPo: '',
    order: '',
    transit: '',
    datang: '',
    status: 'Belum datang',
    noGr: '',
    pic: '',
    keterangan: ''
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const order = Number(formData.order) || 0;
    const transit = Number(formData.transit) || 0;
    const datang = Number(formData.datang) || 0;
    const sisa = order - datang;
    
    // User can select status manually now, but we'll use formData.status
    let status = formData.status || "Belum datang";

    const newItem = {
      id: Date.now(),
      namaBarang: formData.namaBarang,
      vendor: formData.vendor,
      noPo: formData.noPo,
      order,
      transit,
      datang,
      sisa,
      status,
      noGr: formData.noGr,
      pic: formData.pic,
      keterangan: formData.keterangan,
      history: [
        {
          noGr: formData.noGr || "-",
          tanggal: formData.tanggal.split('-').reverse().join('/'),
          transit,
          datang,
          pic: formData.pic || "-",
          keterangan: formData.keterangan
        }
      ]
    };

    setDataList([...dataList, newItem]);
    setIsAddModalOpen(false);
    setFormData({ tanggal: new Date().toISOString().split('T')[0], namaBarang: '', vendor: '', noPo: '', order: '', transit: '', datang: '', status: 'Belum datang', noGr: '', pic: '', keterangan: '' });
  };

  // Derive vendors
  const vendors = ['Semua vendor', ...new Set(dataList.map(item => item.vendor))];

  // Filter list
  const filteredData = dataList.filter(item => {
    const matchSearch = item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.noPo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVendor = selectedVendor === 'Semua vendor' || item.vendor === selectedVendor;
    const matchStatus = statusFilter === 'Semua' || item.status === statusFilter;
    
    return matchSearch && matchVendor && matchStatus;
  });

  const counts = {
    Semua: dataList.length,
    'GR': dataList.filter(d => d.status === 'GR').length,
    'Partial': dataList.filter(d => d.status === 'Partial').length,
    'Belum datang': dataList.filter(d => d.status === 'Belum datang').length,
  };

  const formatNumber = (num) => num.toLocaleString('id-ID');

  if (selectedProductName) {
    return (
      <DetailView 
        productName={selectedProductName} 
        data={dataList.filter(d => d.namaBarang === selectedProductName)}
        onBack={() => setSelectedProductName(null)}
      />
    );
  }

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
            Filter Stok Data
          </h2>
        </div>
        <div className="card-body" style={{ position: 'relative', zIndex: 1 }}>
          <div className="generate-form">
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Pencarian</label>
              <div className="input-with-icon">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Cari nama barang, vendor, atau PO" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Vendor</label>
              <div className="input-with-icon">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <select 
                  className="form-control"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                >
                  {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Filter Status</label>
              <div className="input-with-icon">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <select 
                  className="form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="GR">Goods Receipt (GR)</option>
                  <option value="Partial">Partial</option>
                  <option value="Belum datang">Belum datang</option>
                </select>
              </div>
            </div>

            <div className="generate-btn-group">
              <button 
                className="btn btn-secondary"
                onClick={() => { setSearchTerm(''); setSelectedVendor('Semua vendor'); setStatusFilter('Semua'); }}
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" stroke="currentColor" strokeWidth="2" style={{ color: '#fff' }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Data Stok Barang
          </h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-excel btn-sm"
              onClick={() => generateStockExcel(filteredData)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
              Export Excel
            </button>
            <button 
              className="btn btn-primary btn-sm"
              style={{ background: '#4F46E5' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <span style={{marginRight: 4}}>+</span> Tambah Data
            </button>
          </div>
        </div>

      <div className="stock-table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th>Vendor</th>
              <th>No PO</th>
              <th>No GR</th>
              <th>Order</th>
              <th>Transit</th>
              <th>Datang</th>
              <th>Sisa</th>
              <th>Status</th>
              <th>PIC</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id}>
                <td>
                  <button 
                    className="link-btn font-semibold"
                    onClick={() => setSelectedProductName(row.namaBarang)}
                  >
                    {row.namaBarang}
                  </button>
                </td>
                <td>{row.vendor}</td>
                <td className="font-medium">{row.noPo}</td>
                <td className="text-muted">{row.noGr || '-'}</td>
                <td>{formatNumber(row.order)}</td>
                <td className="center-cell" style={{ color: '#3B82F6', fontWeight: 600 }}>{formatNumber(row.transit)}</td>
                <td className="center-cell" style={{ color: '#10B981', fontWeight: 600 }}>{formatNumber(row.datang)}</td>
                <td className="center-cell" style={{ color: '#EF4444', fontWeight: 700 }}>{formatNumber(row.sisa)}</td>
                <td className="center-cell">
                  <span className={`status-badge status-${row.status.toLowerCase().replace(' ', '-')}`}>
                    {row.status}
                  </span>
                </td>
                <td className="center-cell" style={{ color: 'var(--text-sub)' }}>{row.pic || '—'}</td>
                <td style={{ color: 'var(--text-sub)' }}>{row.keterangan}</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-sub)' }}>
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="table-footer">
          <div className="table-footer-text">
            Menampilkan {filteredData.length > 0 ? 1 : 0} - {filteredData.length} dari {dataList.length} data
          </div>
          <div className="pagination-controls">
            <select style={{ width: 'auto' }}>
              <option>Semua / halaman</option>
            </select>
            <button className="page-btn" disabled>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button className="page-btn active">1</button>
            <button className="page-btn" disabled>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    {isAddModalOpen && (
        <Modal
          title="Tambah Data Stok Baru"
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddSubmit}
        >
          <div className="form-grid-2">
            <div className="form-group">
              <label>Tanggal <span className="req">*</span></label>
              <input required type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Nama Barang <span className="req">*</span></label>
              <input required type="text" className="form-control" value={formData.namaBarang} onChange={e => setFormData({...formData, namaBarang: e.target.value})} placeholder="Contoh: Kertas Label Thermal" />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Vendor <span className="req">*</span></label>
              <input required type="text" className="form-control" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} placeholder="Contoh: NIAGA" />
            </div>
            <div className="form-group">
              <label>No PO <span className="req">*</span></label>
              <input required type="text" className="form-control" value={formData.noPo} onChange={e => setFormData({...formData, noPo: e.target.value})} placeholder="Contoh: 4500001613" />
            </div>
          </div>
          
          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 16 }}>
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Order (Qty) <span className="req">*</span></label>
                <input required type="number" className="form-control" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Transit (Qty)</label>
                <input type="number" className="form-control" value={formData.transit} onChange={e => setFormData({...formData, transit: e.target.value})} placeholder="0" />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Datang (Qty)</label>
                <input type="number" className="form-control" value={formData.datang} onChange={e => setFormData({...formData, datang: e.target.value})} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Sisa (Qty)</label>
                <input type="number" className="form-control" disabled value={(Number(formData.order) || 0) - (Number(formData.datang) || 0)} style={{ fontWeight: 600, color: 'var(--dark-red)', background: '#FEF2F2' }} />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Status <span className="req">*</span></label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="form-control"
              >
                <option value="Belum datang">Belum datang</option>
                <option value="Partial">Partial</option>
                <option value="GR">GR</option>
              </select>
            </div>
            <div className="form-group">
              <label>No GR</label>
              <input type="text" className="form-control" value={formData.noGr} onChange={e => setFormData({...formData, noGr: e.target.value})} placeholder="Contoh: 50001234" />
            </div>
          </div>
          
          <div className="form-grid-2">
            <div className="form-group">
              <label>PIC</label>
              <input type="text" className="form-control" value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} placeholder="Nama PIC" />
            </div>
            <div className="form-group">
              <label>Keterangan</label>
              <input type="text" className="form-control" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} placeholder="Contoh: sudah tiba manado" />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

const DetailView = ({ productName, data, onBack }) => {
  const [expandedPOs, setExpandedPOs] = useState({});

  const togglePo = (id) => {
    setExpandedPOs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Aggregate stats
  const totalOrder = data.reduce((acc, curr) => acc + curr.order, 0);
  const totalTransit = data.reduce((acc, curr) => acc + curr.transit, 0);
  const totalDatang = data.reduce((acc, curr) => acc + curr.datang, 0);
  const totalSisa = data.reduce((acc, curr) => acc + curr.sisa, 0);
  const totalPO = data.length;

  const formatNumber = (num) => num.toLocaleString('id-ID');

  return (
    <div className="detail-view-container">
      <div className="detail-header-row">
        <div>
          <button className="back-btn text-muted" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
             Kembali
          </button>
          <div className="text-sm text-muted uppercase mt-2 font-semibold">Report Produk</div>
          <h2 className="detail-title">{productName}</h2>
        </div>
        <button className="export-btn" onClick={() => generateStockPDF(productName, data, expandedPOs)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export PDF
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Order</div>
          <div className="stat-value">{formatNumber(totalOrder)}</div>
          <div className="stat-desc">dari {totalPO} PO</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transit</div>
          <div className="stat-value text-blue">{formatNumber(totalTransit)}</div>
          <div className="stat-desc text-muted">di MKR</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Datang</div>
          <div className="stat-value text-green">{formatNumber(totalDatang)}</div>
          <div className="stat-desc text-muted">sudah sampai</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Sisa</div>
          <div className="stat-value text-red">{formatNumber(totalSisa)}</div>
          <div className="stat-desc text-muted">belum datang</div>
        </div>
      </div>

      <h3 className="history-title">Riwayat per PO</h3>
      <div className="po-history-list">
        {data.map(po => (
          <PoHistoryCard 
            key={po.id} 
            po={po} 
            formatNumber={formatNumber} 
            isExpanded={!!expandedPOs[po.id]}
            onToggle={() => togglePo(po.id)}
          />
        ))}
      </div>
    </div>
  );
};

const PoHistoryCard = ({ po, formatNumber, isExpanded, onToggle }) => {
  return (
    <div className="po-card">
      <div 
        className="po-card-header"
        onClick={onToggle}
      >
        <div className="flex-align-center gap-2">
          <h4 className="po-card-title">PO {po.noPo} <span style={{fontWeight: 400, margin: '0 4px'}}>|</span> {po.vendor}</h4>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span className={`status-badge status-${po.status.toLowerCase() === 'gr' ? 'gr' : po.status.toLowerCase()}`}>
            {po.status === 'GR' ? 'Goods Receipt' : po.status}
          </span>
        </div>
      </div>

      <div className="po-card-body" style={{display: isExpanded ? 'block' : 'none'}}>
        <table className="history-table">
          <thead>
            <tr>
              <th>No GR</th>
              <th>Tanggal</th>
              <th>Transit MKR</th>
              <th>Datang</th>
              <th>PIC</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {po.history.map((h, i) => (
              <tr key={i}>
                <td className="font-medium text-dark">{h.noGr}</td>
                <td>{h.tanggal}</td>
                <td className="text-blue">{formatNumber(h.transit)}</td>
                <td className="text-green">{formatNumber(h.datang)}</td>
                <td>{h.pic}</td>
                <td className="text-muted">{h.keterangan}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="po-card-footer text-sm">
          <span className="font-medium">Order {formatNumber(po.order)}</span> <span style={{margin: '0 6px', color: '#CBD5E1'}}>|</span> <span className="font-medium">Datang {formatNumber(po.datang)}</span> <span style={{margin: '0 6px', color: '#CBD5E1'}}>|</span> <span className="font-medium">Sisa {formatNumber(po.sisa)}</span>
        </div>
      </div>
    </div>
  );
};
