import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import RankBadge from '../components/ui/RankBadge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { formatScore, initials } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';

const GAME_ICONS = { 'g-1': '🏃', 'g-2': '🧩', 'g-3': '🧮', 'g-4': '📖', 'g-5': '🧠' };

export default function Landing() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [gamesRes, globalRes] = await Promise.all([
          api.get('/games'),
          api.get('/leaderboard/global?limit=5'),
        ]);
        setGames(gamesRes.data.data.games);
        setTop(globalRes.data.data.entries);
      } catch (err) {
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featured = games.slice(0, 6);

  return (
    <div>
      <section className="hero">
        <div className="hero__badge">
          <span className="hero__pulse" /> Live leaderboards · powered by Redis Sorted Sets
        </div>
        <h1>
          Compete fast. Climb the <span className="hero__gradient">Climbboard</span>.
        </h1>
        <p className="hero__lead">
          Play rapid-fire games, submit scores, and watch the leaderboards shift in real time as
          rivals overtake you — no refresh needed.
        </p>
        <div className="hero__actions">
          {user ? (
            <Link to="/games" className="btn btn--primary btn--lg">
              Start playing →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn--primary btn--lg">
                Create free account
              </Link>
              <Link to="/login" className="btn btn--outline btn--lg">
                Sign in
              </Link>
            </>
          )}
        </div>
        <div className="hero__stat">
          <div className="hero__stat-item">
            <div className="hero__stat-num">{games.length}</div>
            <div className="hero__stat-label">Games</div>
          </div>
          <div className="hero__stat-item">
            <div className="hero__stat-num">16+</div>
            <div className="hero__stat-label">Competitors</div>
          </div>
          <div className="hero__stat-item">
            <div className="hero__stat-num">0</div>
            <div className="hero__stat-label">Page refreshes*</div>
          </div>
        </div>
        <p className="hero__lead muted" style={{ fontSize: 13.5, marginTop: 12 }}>
          *Leaderboards update through Socket.IO the moment someone posts a personal best.
        </p>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Featured games</h2>
          <Link to="/games" style={{ fontSize: 13.5, fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="page-center">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : (
          <div className="game-grid">
            {featured.map((game, idx) => (
              <Card key={game.id} className={`game-card ${idx < 3 ? 'featured-game' : ''}`}>
                <div className="game-card__top">
                  <div className="game-card__emoji">{GAME_ICONS[game.id] || '🎮'}</div>
                  <h3 className="game-card__name">{game.name}</h3>
                </div>
                <p className="game-card__desc">{game.description}</p>
                <div className="game-card__actions">
                  <Link to={`/games/${game.id}`} className="btn btn--outline btn--sm">
                    Leaderboard
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Top challengers right now</h2>
          <Link to="/leaderboard" style={{ fontSize: 13.5, fontWeight: 600 }}>
            Full ranking →
          </Link>
        </div>
        {loading ? (
          <div className="page-center">
            <Spinner />
          </div>
        ) : top.length ? (
          <Card padded={false}>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="table">
                <tbody>
                  {top.map((entry) => (
                    <tr key={entry.userId}>
                      <td style={{ width: 70 }}>
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td>
                        <div className="table__user">
                          <Avatar size="sm" seed={entry.username}>
                            {initials(entry.username)}
                          </Avatar>
                          <span className="table__username">{entry.username}</span>
                        </div>
                      </td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {formatScore(entry.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">
            <span style={{ marginRight: 8 }}>📡</span> Live market activity
          </h2>
          <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
            <span className="hero__pulse" style={{ display: 'inline-block', marginRight: 5 }} /> streaming in real time
          </span>
        </div>
        <Card padded={false}>
          <ActivityFeed limit={12} />
        </Card>
      </section>

      <footer
        style={{
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 13,
          padding: '40px 20px 30px',
        }}
      >
        Climbboard demo · React + Express + Redis Sorted Sets + Socket.IO
      </footer>
    </div>
  );
}