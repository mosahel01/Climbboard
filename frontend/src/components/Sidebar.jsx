import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';
import cx from '../utils/cx.js';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/games', icon: '🎮', label: 'Games' },
    { to: '/achievements', icon: '🏅', label: 'Achievements' },
    { to: '/leaderboard', icon: '🏆', label: 'Global Top 100' },
    { to: '/history', icon: '📜', label: 'Score History' },
    { to: '/reports', icon: '📈', label: 'Reports' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: '🛡️', label: 'Admin' }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className={cx('sidebar-overlay', open && 'sidebar-overlay--open')} onClick={onClose} />
      <aside className={cx('sidebar', open && 'sidebar--open')}>
        <div className="sidebar__header">
          <span className="sidebar__brand">🏆 Climbboard</span>
          <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
            ×
          </button>
        </div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to !== '/games'}
              className={({ isActive }) => cx('sidebar__link', isActive && 'sidebar__link--active')}
              onClick={onClose}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials(user?.username)}</div>
          <div className="sidebar__user-info">
            <p className="sidebar__username">{user?.username}</p>
            <p className="sidebar__email">{user?.email}</p>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} aria-label="Logout">
            ↗ Logout
          </button>
        </div>
      </aside>
    </>
  );
}