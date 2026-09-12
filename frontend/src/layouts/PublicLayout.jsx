import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="layout-public">
      <header className="navbar navbar--public">
        <div className="navbar__inner">
          <Link to="/" className="navbar__brand">
            <span className="navbar__logo">🏆</span> Climbboard
          </Link>
          <nav className="navbar__nav">
            {pathname !== '/login' && !user && (
              <Link to="/login" className="btn btn--ghost btn--sm">
                Sign In
              </Link>
            )}
            {pathname !== '/register' && !user && (
              <Link to="/register" className="btn btn--primary btn--sm">
                Join Now
              </Link>
            )}
            {user && (
              <Link to="/dashboard" className="btn btn--primary btn--sm">
                Dashboard →
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="layout-public__main">
        <Outlet />
      </main>
    </div>
  );
}