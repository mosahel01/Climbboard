import { useEffect, useState } from 'react';
import api, { extractError } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import cx from '../utils/cx.js';

export default function Achievements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/users/me/achievements')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} />
      </div>
    );
  }

  const summaryPct = data.summary.total ? Math.round((data.summary.earned / data.summary.total) * 100) : 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Achievements</h1>
          <p className="page-head__subtitle">
            Everything worth grinding for. Earn badges by climbing boards, stacking submissions and moving the market.
          </p>
        </div>
      </div>

      <div className="achievement-overview card">
        <div className="achievement-overview__left">
          <span className="achievement-overview__count">
            {data.summary.earned}
            <b>/ {data.summary.total}</b>
          </span>
          <span className="game-hud__label">badges unlocked</span>
        </div>
        <div className="achievement-overview__bar">
          <div className="progress-track">
            <div className="progress-track__fill" style={{ width: `${summaryPct}%` }} />
          </div>
          <span className="muted">{summaryPct}% complete</span>
        </div>
      </div>

      <div className="badge-grid">
        {data.badges.map((badge) => {
          const pct = badge.target ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0;
          return (
            <div key={badge.id} className={cx('badge-card', badge.earned && 'badge-card--earned')}>
              <div className="badge-card__icon">{badge.emoji}</div>
              <div className="badge-card__body">
                <h3 className="badge-card__name">{badge.name}</h3>
                <p className="badge-card__desc">{badge.description}</p>
                <div className={cx('badge-chip', badge.earned && 'badge-chip--earned')}>
                  {badge.earned ? 'Unlocked' : `${badge.current} / ${badge.target}`}
                </div>
              </div>
              <div className="progress-track progress-track--sm">
                <div className="progress-track__fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}