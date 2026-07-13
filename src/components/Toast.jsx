import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}
