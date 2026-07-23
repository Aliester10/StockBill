import { useApp } from '../context/AppContext';

function formatRp(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function MasterPage() {
  const { customers, tagihanRows } = useApp();

  // Hitung summary per customer
  const summary = customers.map(c => {
    const rows  = tagihanRows.filter(r => r.customerId === c.id);
    const open  = rows.filter(r => r.status === 'OPEN');
    const close = rows.filter(r => r.status === 'CLOSE' || r.status === 'LUNAS');
    
    const getFullValue = (r) => {
      const sumTermins = (Number(r.termin1) || 0) + (Number(r.termin2) || 0) + (Number(r.termin3) || 0);
      return Math.max(Number(r.nominal) || 0, sumTermins);
    };

    return {
      ...c,
      totalInvoice  : rows.length,
      totalOpen     : open.reduce((s, r) => s + getFullValue(r), 0),
      countOpen     : open.length,
      totalClose    : close.reduce((s, r) => s + getFullValue(r), 0),
      countClose    : close.length,
    };
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2>Daftar Customer</h2>
        {customers.length > 0 && (
          <span className="badge">{customers.length} customer</span>
        )}
        <span className="subtitle" style={{ flex: '1 1 100%' }}>
          Customer terdeteksi otomatis dari file Excel yang diupload.
          {customers.length === 0 && ' Upload file terlebih dahulu di tab "Upload Data".'}
        </span>
      </div>

      {customers.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-sub)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" style={{ marginBottom: 12 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p style={{ fontSize: 14 }}>Belum ada data customer.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Upload file Excel di tab <strong>Upload Data</strong> untuk melihat daftar customer.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Customer ID</th>
                <th>Nama Customer</th>
                <th style={{ textAlign: 'center' }}>Total Invoice</th>
                <th style={{ textAlign: 'center' }}>Invoice Open</th>
                <th style={{ textAlign: 'right'   }}>Total Open (Rp)</th>
                <th style={{ textAlign: 'center' }}>Invoice Close</th>
                <th style={{ textAlign: 'right'   }}>Total Close (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((c, i) => (
                <tr key={c.id}>
                  <td className="center-cell">{i + 1}</td>
                  <td>{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="center-cell">{c.totalInvoice}</td>
                  <td className="center-cell">
                    {c.countOpen > 0
                      ? <span className="status-open">{c.countOpen}</span>
                      : <span style={{ color: 'var(--text-sub)' }}>0</span>
                    }
                  </td>
                  <td className="nominal-cell">
                    {c.totalOpen > 0
                      ? <span style={{ color: 'var(--dark-red)', fontWeight: 600 }}>{formatRp(c.totalOpen)}</span>
                      : <span style={{ color: 'var(--text-sub)' }}>—</span>
                    }
                  </td>
                  <td className="center-cell">
                    {c.countClose > 0
                      ? <span className="status-close">{c.countClose}</span>
                      : <span style={{ color: 'var(--text-sub)' }}>0</span>
                    }
                  </td>
                  <td className="nominal-cell">
                    {c.totalClose > 0
                      ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatRp(c.totalClose)}</span>
                      : <span style={{ color: 'var(--text-sub)' }}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer total */}
            <tfoot>
              <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--dark-blue)' }}>
                  TOTAL KESELURUHAN
                </td>
                <td className="nominal-cell" style={{ color: 'var(--dark-red)', padding: '10px 12px' }}>
                  {formatRp(summary.reduce((s, c) => s + c.totalOpen, 0))}
                </td>
                <td />
                <td className="nominal-cell" style={{ color: 'var(--success)', padding: '10px 12px' }}>
                  {formatRp(summary.reduce((s, c) => s + c.totalClose, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
