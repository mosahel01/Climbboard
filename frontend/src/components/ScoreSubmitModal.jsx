import { useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';
import api, { extractError } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatScore, ordinal } from '../utils/format.js';
import Badge from './ui/Badge.jsx';

export default function ScoreSubmitModal({ game, myScore, onClose, onSubmit }) {
  const [score, setScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const { success } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = Number.parseInt(score, 10);
    if (!Number.isInteger(value) || value < 0) {
      setError('Enter a non-negative whole number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/games/${game.id}/scores`, { score: value });
      const data = res.data.data;
      setResult(data);
      success(data.isNewBest ? `New personal best — rank #${data.rank}!` : 'Score recorded.');
      if (onSubmit) onSubmit(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Submit score · ${game.name}`} onClose={onClose}>
      {!result ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-16 muted" style={{ fontSize: 13.5 }}>
            Your best score in {game.name} is currently{' '}
            <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
              {formatScore(myScore)}
            </span>
            . A higher score moves you up the leaderboard — a lower one is still saved to history.
          </div>
          <Input
            label="Score"
            type="number"
            min={0}
            autoFocus
            placeholder="e.g. 9500"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            error={error}
          />
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Submit score
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>{result.isNewBest ? '🎉' : '✅'}</div>
          <h4 className="mt-8 mb-16" style={{ fontSize: 18 }}>
            {result.isNewBest ? 'New personal best!' : 'Score recorded'}
          </h4>
          <div className="stat-card" style={{ marginBottom: 12 }}>
            <div className="stat-card__content" style={{ width: '100%', textAlign: 'center' }}>
              <p className="stat-card__label">Your rank</p>
              <p className="stat-card__value">{ordinal(result.rank)}</p>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <Badge color={result.isNewBest ? 'gold' : 'neutral'}>
              Best score: <span className="mono">{formatScore(result.score)}</span>
            </Badge>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
            <Button variant="primary" onClick={onClose}>
              Awesome
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}