import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const KEY_COMPANY = 'soa_company';
const KEY_TAGIHAN = 'soa_tagihan';  // simulasi Spreadsheet di localStorage
const KEY_TERMINS = 'soa_termins';

export function AppProvider({ children }) {

  // ── Info perusahaan ────────────────────────────────────────────
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY_COMPANY)) || defaultCompany(); }
    catch { return defaultCompany(); }
  });

  // ── Data tagihan (persisted — simulasi Google Sheet) ───────────
  const [tagihanRows, setTagihanRowsRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY_TAGIHAN)) || []; }
    catch { return []; }
  });

  // ── Customer unik (derived dari tagihanRows) ───────────────────
  const [customers, setCustomers] = useState([]);

  // ── Termins ────────────────────────────────────────────────────
  const [termins, setTermins] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY_TERMINS)) || defaultTermins(); }
    catch { return defaultTermins(); }
  });

  // ── Toast ──────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  // Persist company
  useEffect(() => {
    localStorage.setItem(KEY_COMPANY, JSON.stringify(company));
  }, [company]);

  // Persist termins
  useEffect(() => {
    localStorage.setItem(KEY_TERMINS, JSON.stringify(termins));
  }, [termins]);

  // Persist tagihan setiap kali berubah
  function setTagihanRows(rows) {
    setTagihanRowsRaw(rows);
    localStorage.setItem(KEY_TAGIHAN, JSON.stringify(rows));
  }

  // Rebuild daftar customer unik dari tagihanRows
  useEffect(() => {
    const map = new Map();
    tagihanRows.forEach(r => {
      if (r.customerId && r.customerId !== '' && !map.has(r.customerId)) {
        map.set(r.customerId, r.namaCustomer || r.customerId);
      }
    });
    setCustomers([...map.entries()].map(([id, name]) => ({ id, name })));
  }, [tagihanRows]);

  // ── CRUD tagihan ───────────────────────────────────────────────

  /** Tambah satu baris tagihan baru */
  function addTagihanRow(row) {
    const newRow = {
      ...row,
      no: tagihanRows.length + 1,  // no urut otomatis
    };
    setTagihanRows([...tagihanRows, newRow]);
    return newRow;
  }

  /** Update baris tagihan berdasarkan index */
  function updateTagihanRow(index, updatedRow) {
    const updated = tagihanRows.map((r, i) => i === index ? { ...r, ...updatedRow } : r);
    setTagihanRows(updated);
  }

  /** Hapus baris tagihan berdasarkan index, renumber otomatis */
  function deleteTagihanRow(index) {
    const filtered = tagihanRows.filter((_, i) => i !== index);
    const renumbered = filtered.map((r, i) => ({ ...r, no: i + 1 }));
    setTagihanRows(renumbered);
  }

  /** Merge data upload (replace semua atau append) */
  function mergeUpload(rows, mode = 'replace') {
    if (mode === 'replace') {
      setTagihanRows(rows.map((r, i) => ({ ...r, no: i + 1 })));
    } else {
      // append — hindari duplikat berdasarkan noInvoice
      const existing = new Set(tagihanRows.map(r => r.noInvoice));
      const newRows  = rows.filter(r => !existing.has(r.noInvoice));
      const merged   = [...tagihanRows, ...newRows].map((r, i) => ({ ...r, no: i + 1 }));
      setTagihanRows(merged);
    }
  }

  /** Hapus semua data */
  function clearAllTagihan() {
    setTagihanRows([]);
  }

  // ── Toast helper ───────────────────────────────────────────────
  function showToast(msg, type = 'info') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  return (
    <AppContext.Provider value={{
      // Data
      tagihanRows, setTagihanRows,
      addTagihanRow, updateTagihanRow, deleteTagihanRow,
      mergeUpload, clearAllTagihan,
      // Derived
      customers,
      // Company
      company, setCompany,
      // Termins
      termins, setTermins,
      // UI
      toasts, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

function defaultCompany() {
  return { name: 'PT XYZ', address: 'Jl. Merdeka No. X8, Medan', telp: '061 654 3210' };
}

function defaultTermins() {
  return [
    { id: 't1', name: 'Termin 1', percent: 50 },
    { id: 't2', name: 'Termin 2', percent: 30 },
    { id: 't3', name: 'Termin 3', percent: 20 }
  ];
}
