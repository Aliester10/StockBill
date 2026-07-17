import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar      from './components/Sidebar';
import Header       from './components/Header';
import Toast        from './components/Toast';
import TagihanPage  from './pages/TagihanPage';
import MasterPage   from './pages/MasterPage';
import SettingsPage from './pages/SettingsPage';
import StockPage    from './pages/StockPage';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('tagihan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={`app-layout ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={isSidebarOpen} />
      <div className="main-content-wrapper">
        <Header activeTab={activeTab} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="container">
          {activeTab === 'tagihan'  && <TagihanPage  />}
          {activeTab === 'rekap'    && <MasterPage   />}
          {activeTab === 'stock'    && <StockPage    />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
