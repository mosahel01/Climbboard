import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import RankBadge from '../components/ui/RankBadge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import { formatDate, formatDateTime, formatScore, initials, ordinal } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

const GAME_ICONS = { 'g-1': '🏃', 'g-2': '🧩', 'g-3': '🧮', 'g-4': '📖', 'g-5': '🧠' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/users/me/dashboard');
        setData(res.data.data);
      } catch (err) {
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="page-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const { stats, recentScores, badges, leaderComparison, globalNeighbours } = data;
  const maxPct = Math.max(4, ...leaderComparison.map((g) => g.pctOfLeader ?? 0));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Hey, {data.user.username} 👋</h1>
          <p className="page-head__subtitle">Your market position across Climbboard — live.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          icon="🌍"
          label="Global rank"
          value={stats.globalRank != null ? ordinal(stats.globalRank) : 'Unranked'}
          sub={stats.globalScore != null ? `${formatScore(stats.globalScore)} total best` : 'Submit a score to get ranked'}
          accent="primary"
        />
        <StatCard
          icon="🎯"
          label="Games participated"
          value={stats.gamesParticipated}
          sub={`of ${stats.gamesPlayed.length} available`}
          accent="success"
        />
        <StatCard
          icon="⚡"
          label="Total best score"
          value={formatScore(stats.totalBestScore)}
          sub="Sum of personal bests"
          accent="warn"
        />
        <StatCard
          icon="🎖️"
          label="Achievements"
          value={badges.length}
          sub={`${badges.length ? badges.map((b) => b.emoji).join(' ') : 'Play to earn your first'}`}
          accent="danger"
        />
      </div>

      <div className="dash-grid">
        <Card
          title="Market position"
          subtitle="Your best score vs the #1 player in each game"
        >
          {leaderComparison.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📉</div>
              <h4 className="empty-state__title">No market data yet</h4>
              <p className="empty-state__message">Submit a score to see how you stack up against the leaders.</p>
              <div className="empty-state__action">
                <Link to="/games" className="btn btn--primary">
                  Browse games
                </Link>
              </div>
            </div>
          ) : (
            leaderComparison.map((g) => {
              const pct = g.pctOfLeader ?? 0;
              return (
                <div className="market-row" key={g.gameId}>
                  <div className="market-row__head">
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{GAME_ICONS[g.gameId] || '🎮'}</span>
                      <div>
                        <div className="best-row__name">
                          <Link to={`/games/${g.gameId}`}>{g.gameName}</Link>
                        </div>
                        <div className="best-row__rank">
                          Rank {g.rank != null ? ordinal(g.rank) : '—'} · your best{' '}
                          <span className="mono">{formatScore(g.myScore)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`market-row__pct ${pct >= 80 ? 'market-row__pct--hot' : ''}`}>
                      {g.leaderScore ? `${pct}% of leader` : 'leader is clear'}
                    </span>
                  </div>
                  <div className="market-bar">
                    <div className="market-bar__fill" style={{ width: `${(pct / maxPct) * 100}%` }} />
                  </div>
                  <div className="market-row__foot muted">
                    {g.leaderScore != null ? (
                      <>
                        <span>🥇 {g.leaderName}</span>
                        <span className="mono">{formatScore(g.leaderScore)}</span>
                      </>
                    ) : (
                      <span>No leaderboard entries yet</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </Card>

        <Card title="Nearby rivals" subtitle="Who’s around you on the global board">
          {globalNeighbours.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🧭</div>
              <h4 className="empty-state__title">No ranking yet</h4>
              <p className="empty-state__message">Once ranked, we’ll show the players chasing you and the ones ahead.</p>
            </div>
          ) : (
            <div>
              {globalNeighbours.map((n) => (
                <div className={n.isMe ? 'best-row best-row--me' : 'best-row'} key={n.userId}>
                  <RankBadge rank={n.rank} />
                  <div className="best-row__info" style={{ flex: 1 }}>
                    {n.isMe ? (
                      <div className="best-row__name table__you">
                        You <span className="badge badge--primary">you</span>
                      </div>
                    ) : (
                      <Link to={`/profile/${n.userId}`} className="best-row__name table__link">
                        {n.username}
                      </Link>
                    )}
                  </div>
                  <div className="num mono" style={{ fontWeight: 700 }}>
                    {formatScore(n.score)}
                  </div>
                </div>
              ))}
              <div className="mt-16">
                <Link to="/leaderboard" className="btn btn--outline btn--sm btn--block">
                  View full global ladder →
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card
        className="mt-16"
        title="Live market activity"
        subtitle="Every submission across all games, streaming in real time"
        actions={<span className="lb-mytimer__live"><span className="hero__pulse" style={{ display: 'inline-block', marginRight: 5 }} /> LIVE</span>}
      >
        <ActivityFeed limit={25} compact />
      </Card>

      {badges.length > 0 && (
        <Card className="mt-16" title="Achievements" subtitle="Badges you’ve unlocked along the way">
          <div className="badge-grid">
            {badges.map((b) => (
              <div className="badge-tile" key={b.id} title={b.description}>
                <div className="badge-tile__emoji">{b.emoji}</div>
                <div className="badge-tile__name">{b.name}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="dash-grid mt-16">
        <Card title="My best scores" subtitle="Personal best per game">
          {stats.gamesPlayed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🎮</div>
              <h4 className="empty-state__title">No games played yet</h4>
              <p className="empty-state__message">Pick a game and submit your first score.</p>
              <div className="empty-state__action">
                <Link to="/games" className="btn btn--primary">
                  Browse games
                </Link>
              </div>
            </div>
          ) : (
            stats.gamesPlayed.map((g) => (
              <div className="best-row" key={g.gameId}>
                <div className="game-card__emoji" style={{ width: 40, height: 40, fontSize: 20 }}>
                  {GAME_ICONS[g.gameId] || '🎮'}
                </div>
                <div className="best-row__info">
                  <div className="best-row__name">
                    <Link to={`/games/${g.gameId}`}>{g.name || g.gameId}</Link>
                  </div>
                  <div className="best-row__rank">
                    Rank {g.rank != null ? ordinal(g.rank) : '—'}
                  </div>
                </div>
                <div className="num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {formatScore(g.score)}
                </div>
              </div>
            ))
          )}
        </Card>

        <Card title="Recent submissions" subtitle="Your latest attempts">
          {recentScores.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🕰️</div>
              <h4 className="empty-state__title">Nothing yet</h4>
            </div>
          ) : (
            <div>
              {recentScores.map((s, i) => (
                <div className="best-row" key={`${s.gameId}-${i}`}>
                  <div className="game-card__emoji" style={{ width: 40, height: 40, fontSize: 20 }}>
                    {GAME_ICONS[s.gameId] || '🎮'}
                  </div>
                  <div className="best-row__info">
                    <div className="best-row__name">
                      <Link to={`/games/${s.gameId}`}>{s.gameName}</Link>
                    </div>
                    <div className="best-row__rank">{formatDateTime(s.submittedAt)}</div>
                  </div>
                  <div className="num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {formatScore(s.score)}
                  </div>
                </div>
              ))}
              <div className="mt-16">
                <Link to="/history" className="btn btn--outline btn--sm btn--block">
                  View full history
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}