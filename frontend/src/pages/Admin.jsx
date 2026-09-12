import { useCallback, useEffect, useState } from 'react';
import api, { extractError } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import cx from '../utils/cx.js';

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [games, setGames] = useState(null);
  const [users, setUsers] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { success } = useToast();

  const [q, setQ] = useState('');
  const [sort, setSort] = useState('global');
  const [page, setPage] = useState(1);

  const loadOverview = useCallback(async () => {
    const { data } = await api.get('/admin/overview');
    setOverview(data.data);
  }, []);

  const loadGames = useCallback(async () => {
    const { data } = await api.get('/admin/games');
    setGames(data.data.games);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { q: q || undefined, sort, page, limit: 25 } });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [q, sort, page]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [tab, loadUsers]);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([loadOverview(), loadGames()])
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, [loadOverview, loadGames]);

  const reload = async () => {
    await loadUsers();
    loadOverview().catch(() => {});
  };

  const changeRole = async (user) => {
    try {
      await api.patch(`/admin/users/${user.userId}`, { role: user.role === 'admin' ? 'user' : 'admin' });
      success(`${user.username} is now ${user.role === 'admin' ? 'a player' : 'an admin'}.`);
      await reload();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const toggleBan = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user.userId}`, { banned: !user.banned });
      const updated = res.data.data;
      success(`${updated.username} ${updated.banned ? 'banned' : 'unbanned'}.`);
      await reload();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${user.username} and every record they own?`)) return;
    try {
      await api.delete(`/admin/users/${user.userId}`);
      success(`${user.username} deleted.`);
      await reload();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  if (loading && !overview) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="page">
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Admin console</h1>
          <p className="page-head__subtitle">Moderate players, review participation and keep the boards healthy.</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => { setError(''); loadUsers(); }} compact />}

      <div className="segmented admin-tabs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'Players' },
          { id: 'games', label: 'Games' },
        ].map((t) => (
          <button
            key={t.id}
            className={cx('segmented__btn', tab === t.id && 'segmented__btn--active')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && overview && (
        <div className="admin-cards">
          {[
            { label: 'Total players', value: overview.users, icon: '👥' },
            { label: 'Games live', value: overview.games, icon: '🎮' },
            { label: 'Submissions', value: overview.submissions.toLocaleString('en-US'), icon: '🎯' },
            { label: 'Activity events', value: overview.activityCount.toLocaleString('en-US'), icon: '⚡' },
          ].map((card) => (
            <div key={card.label} className="admin-card card">
              <span className="admin-card__icon">{card.icon}</span>
              <span className="admin-card__value">{card.value}</span>
              <span className="game-hud__label">{card.label}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'games' && (
        <div className="card table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Difficulty</th>
                <th>Players</th>
                <th>Submissions</th>
                <th>Top score</th>
                <th>Top player</th>
              </tr>
            </thead>
            <tbody>
              {games?.map((g) => (
                <tr key={g.gameId}>
                  <td>
                    <span className="mono">{g.icon}</span> {g.name}
                  </td>
                  <td>
                    <span className={`difficulty-badge difficulty-badge--${String(g.difficulty).toLowerCase()}`}>
                      {g.difficulty}
                    </span>
                  </td>
                  <td>{g.players}</td>
                  <td>{g.submissions.toLocaleString('en-US')}</td>
                  <td>{g.topScore != null ? g.topScore.toLocaleString('en-US') : '—'}</td>
                  <td>{g.topPlayer || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="card table-card">
          <div className="admin-toolbar">
            <form className="admin-search" onSubmit={submitSearch}>
              <input
                className="input"
                placeholder="Search username or email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="btn btn--sm" type="submit">
                Search
              </button>
            </form>
            <select className="input input--select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              <option value="global">Sort: Global rank</option>
              <option value="newest">Sort: Newest</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          {loading ? (
            <div className="page-center" style={{ padding: '40px 0' }}>
              <Spinner />
            </div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Badges</th>
                    <th>Subs</th>
                    <th>Best total</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.userId} className={u.banned ? 'admin-row--banned' : ''}>
                      <td>
                        <span className="mono">{u.username}</span>
                        <small className="admin-email">{u.email}</small>
                      </td>
                      <td>{u.badges} 🏅</td>
                      <td>{u.submissions}</td>
                      <td>{u.totalBestScore.toLocaleString('en-US')}</td>
                      <td>
                        <span className={cx('badge', u.role === 'admin' ? 'badge--soft' : '')}>
                          {u.role}
                        </span>
                        {u.banned && <span className="badge badge--warn">banned</span>}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="btn btn--sm btn--ghost" onClick={() => changeRole(u)}>
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button className="btn btn--sm btn--ghost" onClick={() => toggleBan(u)}>
                            {u.banned ? 'Unban' : 'Ban'}
                          </button>
                          <button className="btn btn--sm btn--danger-ghost" onClick={() => removeUser(u)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination && pagination.total > pagination.limit && (
                <div className="pagination">
                  <button
                    className="btn btn--sm btn--ghost"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  <span className="muted">
                    Page {pagination.page} of {pagination.pages ?? Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    className="btn btn--sm btn--ghost"
                    disabled={page >= (pagination.pages ?? Math.ceil(pagination.total / pagination.limit))}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}