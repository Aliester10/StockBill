import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar       from './components/Navbar';
import Toast        from './components/Toast';
import TagihanPage  from './pages/TagihanPage';
import MasterPage   from './pages/MasterPage';
import SettingsPage from './pages/SettingsPage';
import StockPage    from './pages/StockPage';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('tagihan');

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container">
        {activeTab === 'tagihan'  && <TagihanPage  />}
        {activeTab === 'rekap'    && <MasterPage   />}
        {activeTab === 'stock'    && <StockPage    />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
