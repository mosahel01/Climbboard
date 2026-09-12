import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-center" style={{ flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 64 }}>🧭</div>
      <h1 style={{ fontSize: 40 }}>404</h1>
      <p className="muted">This page drifted off the board.</p>
      <Link to="/" className="btn btn--primary mt-16">
        Back to home
      </Link>
    </div>
  );
}