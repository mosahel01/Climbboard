import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Card from '../components/ui/Card.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Badge from '../components/ui/Badge.jsx';
import { formatDateTime, formatScore } from '../utils/format.js';

const GAME_ICONS = { 'g-1': '🏃', 'g-2': '🧩', 'g-3': '🧮', 'g-4': '📖', 'g-5': '🧠' };

export default function ScoreHistory() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const load = useCallback(async (targetPage) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/me/scores', { params: { page: targetPage, limit } });
      setData(res.data.data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Score history</h1>
          <p className="page-head__subtitle">Every submission is recorded — even the ones that didn’t move you up.</p>
        </div>
      </div>

      {loading && !data ? (
        <div className="page-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : data ? (
        data.scores.length === 0 ? (
          <Card>
            <EmptyState
              icon="🗒️"
              title="No submissions yet"
              message="Head to a game and drop your first score."
              action={
                <Link to="/games" className="btn btn--primary">
                  Explore games
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Score</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scores.map((s, i) => (
                    <tr key={`${s.gameId}-${i}`}>
                      <td>
                        <div className="row">
                          <span style={{ fontSize: 18 }}>{GAME_ICONS[s.gameId] || '🎮'}</span>
                          <Link to={`/games/${s.gameId}`} className="table__username">
                            {s.gameName}
                          </Link>
                        </div>
                      </td>
                      <td className="num">{formatScore(s.score)}</td>
                      <td className="muted" style={{ fontSize: 13 }}>
                        {formatDateTime(s.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-16" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                page={page}
                total={data.pagination.total}
                limit={limit}
                onChange={(p) => {
                  setPage(p);
                  load(p);
                }}
              />
            </div>
          </>
        )
      ) : null}
    </div>
  );
}