import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <header className="app-topbar">
          <button
            className="app-topbar__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div className="app-topbar__spacer" />
          {user && (
            <Link to="/games" className="app-topbar__cta">
              Play now
            </Link>
          )}
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}