import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import Card from '../components/ui/Card.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { formatScore } from '../utils/format.js';

const GAME_ICONS = { 'g-1': '🏃', 'g-2': '🧩', 'g-3': '🧮', 'g-4': '📖', 'g-5': '🧠' };

export default function Games() {
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/games');
        setGames(res.data.data.games);
      } catch (err) {
        setError(extractError(err));
      }
    })();
  }, []);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!games) {
    return (
      <div className="page-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Games</h1>
          <p className="page-head__subtitle">Pick a game, submit a score and climb the board.</p>
        </div>
      </div>

      <div className="game-grid">
        {games.map((game) => (
          <Card key={game.id} className="game-card">
            <div className="game-card__top">
              <div className="game-card__emoji">{game.icon || GAME_ICONS[game.id] || '🎮'}</div>
              <div className="game-card__top-info">
                <div className="game-card__name-row">
                  <h3 className="game-card__name">{game.name}</h3>
                  {game.difficulty && (
                    <span className={`difficulty-badge difficulty-badge--${String(game.difficulty).toLowerCase()}`}>
                      {game.difficulty}
                    </span>
                  )}
                </div>
                {game.tagline && <p className="muted game-card__tagline">{game.tagline}</p>}
                <div className="game-card__meta">
                  {game.myScore != null ? (
                    <Badge color="primary">
                      Rank #{game.myRank} · {formatScore(game.myScore)}
                    </Badge>
                  ) : (
                    <Badge color="neutral">Not played yet</Badge>
                  )}
                </div>
              </div>
            </div>
            <p className="game-card__desc">{game.description}</p>
            <div className="game-card__actions">
              <Link to={`/games/${game.id}/play`} className="btn btn--primary btn--sm">
                Play
              </Link>
              <Link to={`/games/${game.id}`} className="btn btn--outline btn--sm">
                Leaderboard
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}