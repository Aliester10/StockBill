import React, { useState } from 'react';
import { generateStockExcel } from '../utils/generateStockExcel';
import { generateStockPDF } from '../utils/generateStockPDF';

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
    history: [
      { tanggal: "12/06/2026", transit: 200, datang: 200, keterangan: "sudah tiba manado" }
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
    history: [
      { tanggal: "20/06/2026", transit: 300, datang: 0, keterangan: "masih transit MKR" },
      { tanggal: "28/06/2026", transit: 0, datang: 150, keterangan: "datang sebagian" }
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
    history: [
      { tanggal: "15/06/2026", transit: 940, datang: 560, keterangan: "di pinjam Palu" }
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
    namaBarang: '',
    vendor: '',
    noPo: '',
    order: '',
    transit: '',
    datang: '',
    keterangan: ''
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const order = Number(formData.order) || 0;
    const transit = Number(formData.transit) || 0;
    const datang = Number(formData.datang) || 0;
    const sisa = order - datang;
    
    let status = "Partial";
    if (datang === 0) status = "Belum datang";
    if (sisa <= 0) status = "GR";

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
      keterangan: formData.keterangan,
      history: [
        {
          tanggal: new Date().toLocaleDateString('id-ID'),
          transit,
          datang,
          keterangan: formData.keterangan
        }
      ]
    };

    setDataList([...dataList, newItem]);
    setIsAddModalOpen(false);
    setFormData({ namaBarang: '', vendor: '', noPo: '', order: '', transit: '', datang: '', keterangan: '' });
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
    <div className="stock-card-container">
      {/* Header Filters */}
      <div className="stock-filters-row" style={{ alignItems: 'center' }}>
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Cari nama barang, vendor, atau PO" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="vendor-select"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
        >
          {vendors.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-excel"
            onClick={() => generateStockExcel(filteredData)}
            style={{ padding: '0.5rem 1rem', minWidth: 'auto', borderRadius: '6px' }}
          >
            Export Excel
          </button>
          <button 
            className="btn-add-data"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Tambah Data
          </button>
        </div>
      </div>

      <div className="status-pills">
        <button 
          className={`pill pill-all ${statusFilter === 'Semua' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Semua')}
        >
          Semua · {counts.Semua}
        </button>
        <button 
          className={`pill pill-gr ${statusFilter === 'GR' ? 'active' : ''}`}
          onClick={() => setStatusFilter('GR')}
        >
          Goods receipt · {counts.GR}
        </button>
        <button 
          className={`pill pill-partial ${statusFilter === 'Partial' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Partial')}
        >
          Partial · {counts.Partial}
        </button>
        <button 
          className={`pill pill-belum ${statusFilter === 'Belum datang' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Belum datang')}
        >
          Belum datang · {counts['Belum datang']}
        </button>
      </div>

      {/* Table */}
      <div className="stock-table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th>Vendor</th>
              <th>No PO</th>
              <th>Order</th>
              <th>Transit</th>
              <th>Datang</th>
              <th>Sisa</th>
              <th>Status</th>
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
                <td>{formatNumber(row.order)}</td>
                <td className="text-blue">{formatNumber(row.transit)}</td>
                <td className="text-green">{formatNumber(row.datang)}</td>
                <td className="text-red font-medium">{formatNumber(row.sisa)}</td>
                <td>
                  <span className={`status-badge status-${row.status.toLowerCase()}`}>
                    {row.status}
                  </span>
                </td>
                <td className="text-muted text-sm">{row.keterangan}</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">Tidak ada data ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination text */}
      <div className="pagination-info">
        <span>Menampilkan {filteredData.length} dari {dataList.length} barang</span>
        <button className="btn-next">Next</button>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginTop: 0, marginBottom: '1.5rem'}}>Tambah Data Stok</h2>
            <form onSubmit={handleAddSubmit} className="add-stock-form">
              <div className="form-group">
                <label>Nama Barang</label>
                <input required type="text" value={formData.namaBarang} onChange={e => setFormData({...formData, namaBarang: e.target.value})} placeholder="Contoh: Kertas Label Thermal" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Vendor</label>
                  <input required type="text" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} placeholder="Contoh: NIAGA" />
                </div>
                <div className="form-group">
                  <label>No PO</label>
                  <input required type="text" value={formData.noPo} onChange={e => setFormData({...formData, noPo: e.target.value})} placeholder="Contoh: 4500001613" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Order (Qty)</label>
                  <input required type="number" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Transit (Qty)</label>
                  <input type="number" value={formData.transit} onChange={e => setFormData({...formData, transit: e.target.value})} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Datang (Qty)</label>
                  <input type="number" value={formData.datang} onChange={e => setFormData({...formData, datang: e.target.value})} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Keterangan</label>
                <input type="text" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} placeholder="Contoh: sudah tiba manado" />
              </div>
              <div className="modal-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem'}}>
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-submit">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const DetailView = ({ productName, data, onBack }) => {
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
        <button className="export-btn" onClick={() => generateStockPDF(productName, data)}>
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
          <div className="stat-label">Total order</div>
          <div className="stat-value">{formatNumber(totalOrder)}</div>
          <div className="stat-desc">dari {totalPO} PO</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total transit</div>
          <div className="stat-value text-blue">{formatNumber(totalTransit)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total datang</div>
          <div className="stat-value text-green">{formatNumber(totalDatang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total sisa</div>
          <div className="stat-value text-red">{formatNumber(totalSisa)}</div>
        </div>
      </div>

      <h3 className="history-title">Riwayat per PO</h3>
      <div className="po-history-list">
        {data.map(po => (
          <PoHistoryCard key={po.id} po={po} formatNumber={formatNumber} />
        ))}
      </div>
    </div>
  );
};

const PoHistoryCard = ({ po, formatNumber }) => {
  // By default, if status is GR, we collapse it, else open
  const [isExpanded, setIsExpanded] = useState(po.status !== 'GR');

  return (
    <div className="po-card">
      <div 
        className="po-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-align-center gap-2">
          <h4 className="po-card-title">PO {po.noPo} · {po.vendor}</h4>
          <span className={`status-badge status-${po.status.toLowerCase()}`}>
            {po.status}
          </span>
        </div>
        <button className="toggle-btn">
          {isExpanded ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="po-card-body">
          <table className="history-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Transit</th>
                <th>Datang</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {po.history.map((h, i) => (
                <tr key={i}>
                  <td>{h.tanggal}</td>
                  <td className="font-medium">{formatNumber(h.transit)}</td>
                  <td className="font-medium">{formatNumber(h.datang)}</td>
                  <td className="text-muted">{h.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="po-card-footer">
            Order {formatNumber(po.order)} · Datang {formatNumber(po.datang)} · Sisa {formatNumber(po.sisa)}
          </div>
        </div>
      )}
    </div>
  );
};
