import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import { subscribeToLeaderboard } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import LeaderboardTable from '../components/LeaderboardTable.jsx';
import ScoreSubmitModal from '../components/ScoreSubmitModal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { formatScore, initials, ordinal } from '../utils/format.js';

export default function GameLeaderboard() {
  const { gameId } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { info, success } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);

  const limit = 20;

  const load = useCallback(
    async (targetPage) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/games/${gameId}/leaderboard`, {
          params: { page: targetPage, limit },
        });
        setData(res.data.data);
      } catch (err) {
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    },
    [gameId],
  );

  useEffect(() => {
    setPage(1);
    load(1);
  }, [gameId, load]);

  useEffect(() => {
    if (params.get('play') === '1') {
      setShowSubmit(true);
      params.delete('play');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(gameId, (payload) => {
      const { updatedUser } = payload;
      const mine = updatedUser.userId === user?.id;
      info(
        mine
          ? `Your new best put you at #${updatedUser.rank}!`
          : `${updatedUser.username} scored ${formatScore(updatedUser.score)} → #${updatedUser.rank}`,
      );
      load(page);
    });
    return unsubscribe;
  }, [gameId, page, load, user?.id, info]);

  const handlePage = (p) => {
    setPage(p);
    load(p);
  };

  const handleSubmitted = (result) => {
    if (result?.newBadges?.length) {
      success(
        result.newBadges.length === 1
          ? `New badge unlocked! ${result.newBadges[0]}`
          : `New badges unlocked! ${result.newBadges.join(', ')}`,
      );
    }
    load(page);
  };

  const top3 = data?.entries?.slice(0, 3) || [];
  const rest = data?.entries?.slice(3) || [];
  const current = data?.currentUser;
  const isOnPage =
    current?.onPage || data?.entries?.some((e) => e.userId === user?.id) || false;
  const myRankKnown = current?.rank != null;

  const podiumLabel = { 1: 'Leader', 2: 'Runner up', 3: 'Third place' };

  return (
    <div>
      <div className="page-head">
        <div>
          <Link to="/games" className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
            ← All games
          </Link>
          <h1 className="page-head__title" style={{ marginTop: 4 }}>
            {data?.game?.name || 'Leaderboard'}
          </h1>
          <p className="page-head__subtitle">Live board · updates in real time as players post scores.</p>
        </div>
        <div className="row">
          <Button variant="primary" onClick={() => navigate(`/games/${gameId}/play`)}>
            ▶ Play game
          </Button>
          <Button variant="outline" onClick={() => setShowSubmit(true)}>
            + Submit score
          </Button>
        </div>
      </div>

      <div className="lb-mytimer">
        <span>
          Your best: <span className="mono" style={{ fontWeight: 800 }}>{formatScore(current?.score)}</span>
          <span className="muted" style={{ marginLeft: 8 }}>·</span>{' '}
          Rank: <span className="mono" style={{ fontWeight: 800 }}>
            {current?.rank != null ? ordinal(current.rank) : '—'}
          </span>
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
        <>
          {top3.length > 0 && (
            <div className="lb-top3">
              {top3.map((entry) => (
                <div key={entry.userId} className={`lb-podium lb-podium--${entry.rank}`}>
                  <div className="lb-podium__rank">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</div>
                  <div className="lb-podium__name">
                    {entry.userId === user?.id ? 'You' : entry.username}
                  </div>
                  <div className="lb-podium__score">{formatScore(entry.score)}</div>
                  <div className="lb-podium__tag">{podiumLabel[entry.rank]}</div>
                </div>
              ))}
            </div>
          )}

          {data.entries.length === 0 ? (
            <Card>
              <EmptyState
                icon="🏁"
                title="No scores yet"
                message="This board is fresh. Submit the first score and take the #1 spot."
                action={
                  <Button variant="primary" onClick={() => setShowSubmit(true)}>
                    Set the first score
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {rest.length > 0 && (
                <LeaderboardTable entries={rest} highlightUserId={user?.id} showTrend />
              )}
              {myRankKnown && !isOnPage && (
                <Card className="mt-16" title="Your position">
                  <div className="row">
                    <Avatar seed={user?.username}>{initials(user?.username)}</Avatar>
                    <div className="row" style={{ flex: 1, justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div className="row" style={{ gap: 8 }}>
                          <span className="table__username">You</span>
                          <span className="badge badge--primary">#{current?.rank ?? '—'}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12.5 }}>
                          Not on this page — jump to your rank.
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const target = Math.max(1, Math.ceil((current?.rank || 1) / limit));
                          handlePage(target);
                        }}
                      >
                        Show my rank
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              <div className="mt-16" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination page={page} total={data.pagination.total} limit={limit} onChange={handlePage} />
              </div>
            </>
          )}
        </>
      ) : null}

      {showSubmit && data && (
        <ScoreSubmitModal
          game={{ id: gameId, name: data?.game?.name || 'Game' }}
          myScore={current?.score}
          onClose={() => setShowSubmit(false)}
          onSubmit={handleSubmitted}
        />
      )}
    </div>
  );
}