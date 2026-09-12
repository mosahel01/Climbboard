import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import Countdown, { GameLoader } from '../games/Countdown.jsx';
import { getGameComponent, getHowTo, getDifficultyPresets, resolveDifficulty, DIFFICULTY_KEYS, DIFFICULTY_LABELS } from '../games/registry.jsx';
import { badgeInfo } from '../components/badgeInfo.js';

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | intro | countdown | playing | submitting | done | error
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState('normal');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/games/${gameId}`)
      .then((res) => {
        if (cancelled) return;
        setGame(res.data.data.game);
        setDifficulty(resolveDifficulty(res.data.data.game.difficulty));
        setPhase('intro');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractError(err));
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const Game = getGameComponent(gameId);
  const presets = getDifficultyPresets(gameId);

  const submitScore = (score) => {
    setPhase('submitting');
    api
      .post(`/games/${gameId}/scores`, { score })
      .then((res) => {
        setResult(res.data.data);
        setPhase('done');
      })
      .catch((err) => {
        setError(extractError(err));
        setPhase('error');
      });
  };

  const playAgain = () => {
    setResult(null);
    setError('');
    setAttempt((a) => a + 1);
    setPhase('countdown');
  };

  if (phase === 'loading') return <GameLoader />;

  if (phase === 'error') {
    return (
      <div className="page-center">
        <div className="empty-state">
          <div className="empty-state__icon">😵</div>
          <div className="empty-state__title">Something went wrong</div>
          <div className="empty-state__message">{error}</div>
          <div className="empty-state__action">
            <Link className="btn" to="/games">
              Back to games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="page">
        <div className="game-intro card">
          <div className="game-intro__head">
            <span className="game-intro__icon">{game.icon}</span>
            <div>
              <h1>{game.name}</h1>
              <p className="muted">
                <span className={`difficulty-badge difficulty-badge--${String(game.difficulty).toLowerCase()}`}>
                  {game.difficulty}
                </span>{' '}
                · {game.tagline}
              </p>
              <p className="game-intro__desc">{game.description}</p>
            </div>
          </div>

          {getHowTo(gameId).length > 0 && (
            <div className="game-intro__how">
              <h3>How to play</h3>
              <ul>
                {getHowTo(gameId).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="game-intro__stats">
            <div>
              <span className="game-hud__label">Your best</span>
              <span className="game-intro__stat-value">
                {game.myScore != null ? game.myScore.toLocaleString('en-US') : '—'}
              </span>
            </div>
            <div>
              <span className="game-hud__label">Your rank</span>
              <span className="game-intro__stat-value">{game.myRank != null ? `#${game.myRank}` : 'Unranked'}</span>
            </div>
          </div>

          {Game && presets && (
            <div className="difficulty-picker">
              <span className="game-hud__label">Difficulty</span>
              <div className="difficulty-picker__options">
                {DIFFICULTY_KEYS.map((key) => (
                  <button
                    key={key}
                    className={`difficulty-chip ${difficulty === key ? 'difficulty-chip--on' : ''}`}
                    onClick={() => setDifficulty(key)}
                  >
                    {DIFFICULTY_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn--primary btn--lg" onClick={() => setPhase('countdown')} disabled={!Game}>
            {Game ? `Start game · ${DIFFICULTY_LABELS[difficulty]}` : 'Not playable yet'}
          </button>
          {!Game && (
            <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
              A playable build of this game hasn’t been released yet — watch this space.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'countdown' || phase === 'playing' || phase === 'submitting') {
    return (
      <div className="page">
        <div className="game-play">
          <div className="game-play__bar">
            <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/games/${gameId}`)}>
              ← Back to board
            </button>
            <span className="game-play__name">
              {game.icon} {game.name}
            </span>
            {phase === 'playing' && (
              <span className="badge badge--soft">Attempt {attempt + 1}</span>
            )}
          </div>

          <div className="game-play__stage">
            {phase === 'countdown' && <Countdown key={attempt} onDone={() => setPhase('playing')} />}
            {phase === 'playing' && Game && (
              <Game key={`${attempt}-${difficulty}`} onFinish={submitScore} settings={presets?.[difficulty]} />
            )}
            {phase === 'submitting' && <GameLoader />}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'done' && result) {
    return (
      <div className="page">
        <div className="results card">
          <span className="results__icon">{game.icon}</span>
          <h1 className="results__title">That’s a wrap!</h1>
          <p className="muted">
            Final score in <b>{game.name}</b>
          </p>

          <div className="results__score">
            {result.score.toLocaleString('en-US')}
          </div>

          {result.isNewBest ? (
            <div className="results__flag results__flag--new">
              🎉 New personal best!
            </div>
          ) : (
            <div className="results__flag">
              Ranked — your best stays {result.score.toLocaleString('en-US')}
            </div>
          )}

          <div className="results__stats">
            <div className="results__stat">
              <span className="game-hud__label">Board rank</span>
              <b className="results__stat-value">#{result.rank}</b>
            </div>
            <div className="results__stat">
              <span className="game-hud__label">Position change</span>
              <b className={`results__stat-value ${result.rankJump > 0 ? 'trend--up' : 'trend--flat'}`}>
                {result.rankJump > 0 ? `▲ +${result.rankJump}` : result.rankJump < 0 ? `▼ ${result.rankJump}` : '—'}
              </b>
            </div>
          </div>

          {result.newBadges && result.newBadges.length > 0 && (
            <div className="results__badges">
              <span className="game-hud__label">Achievements unlocked</span>
              <div className="badge-row">
                {result.newBadges.map((id) => {
                  const b = badgeInfo(id);
                  return (
                    <span key={id} className="badge-chip" title={b.description}>
                      <span>{b.emoji}</span>
                      {b.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="results__actions">
            <button className="btn btn--primary" onClick={playAgain}>
              ↻ Play again
            </button>
            <Link className="btn" to={`/games/${gameId}`}>
              View leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <GameLoader />;
}