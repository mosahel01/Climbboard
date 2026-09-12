import { useCallback, useEffect, useState } from 'react';
import api, { extractError } from '../services/api.js';
import { subscribeToGlobal } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Card from '../components/ui/Card.jsx';
import LeaderboardTable from '../components/LeaderboardTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { formatScore, ordinal } from '../utils/format.js';

export default function GlobalLeaderboard() {
  const { user } = useAuth();
  const { info } = useToast();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const load = useCallback(async (targetPage) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/leaderboard/global', { params: { page: targetPage, limit } });
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

  useEffect(() => {
    const unsubscribe = subscribeToGlobal(() => {
      load(page);
      info('Global leaderboard changed.');
    });
    return unsubscribe;
  }, [page, load, info]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Global Top 100</h1>
          <p className="page-head__subtitle">Overall performance — the sum of your best score in every game.</p>
        </div>
      </div>

      <div className="lb-mytimer">
        <span>
          Your global rank:{' '}
          <span className="mono" style={{ fontWeight: 800 }}>
            {data?.currentUser?.rank != null ? ordinal(data.currentUser.rank) : '—'}
          </span>
          <span className="muted" style={{ marginLeft: 8 }}>·</span>{' '}
          <span className="mono" style={{ fontWeight: 800 }}>{formatScore(data?.currentUser?.score)}</span> total
        </span>
        <span className="lb-mytimer__live">
          <span className="hero__pulse" style={{ display: 'inline-block', marginRight: 6 }} /> LIVE
        </span>
      </div>

      {loading && !data ? (
        <div className="page-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : data ? (
        <Card padded={false}>
          <LeaderboardTable entries={data.entries} highlightUserId={user?.id} />
        </Card>
      ) : null}

      {data && data.entries.length > 0 && (
        <div className="mt-16" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination page={page} total={data.pagination.total} limit={limit} onChange={(p) => { setPage(p); load(p); }} />
        </div>
      )}
    </div>
  );
}