import React from 'react';

export default function Header({ activeTab, onToggle }) {
  const titles = {
    tagihan: 'Generate Statement of Account',
    rekap: 'Rekap Customer',
    stock: 'Monitoring Barang',
    settings: 'Pengaturan',
  };

  const title = titles[activeTab] || 'Dashboard';

  // Get current date string like "17 Juni 2026"
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="main-header">
      <div className="header-left">
        <button className="menu-btn" onClick={onToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        <div className="header-date">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {dateStr}
        </div>
      </div>
    </header>
  );
}
