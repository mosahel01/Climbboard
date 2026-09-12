import { useEffect, useMemo, useRef, useState } from 'react';

const SYMBOLS = ['🚀', '🌟', '🦄', '🍕', '🎯', '🌋', '🍩', '🐙', '👽', '🔮'];
const PAIRS = 8;
const BASE_SCORE = 2000;
const PAIR_BONUS = 1500;
const MOVE_PENALTY = 150;
const TIME_PENALTY = 40;
const FREE_SECONDS = 20;

export default function MemoryChallenge({ onFinish, settings = {} }) {
  const pairs = settings.pairs || PAIRS;
  const columns = settings.columns || 4;
  const deck = useMemo(
    () => shuffle([...SYMBOLS.slice(0, pairs), ...SYMBOLS.slice(0, pairs)]),
    [pairs],
  );
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [shake, setShake] = useState(null);

  const secondsRef = useRef(0);
  const matchedRef = useRef([]);
  const movesRef = useRef(0);
  const timerRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const t = secondsRef.current;
    const score = Math.max(
      1,
      BASE_SCORE + pairs * PAIR_BONUS - Math.max(0, movesRef.current - pairs) * MOVE_PENALTY - Math.max(0, t - FREE_SECONDS) * TIME_PENALTY,
    );
    onFinish(score);
  };

  const flip = (index) => {
    if (matched.includes(index) || flipped.includes(index) || flipped.length === 2) return;

    if (!running) {
      setRunning(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    }

    setMoves(moves + 1);
    movesRef.current = moves + 1;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      const [a, b] = next;
      if (deck[a] === deck[b]) {
        const newMatched = [...matched, a, b];
        matchedRef.current = newMatched;
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === deck.length) {
          clearInterval(timerRef.current);
          finish();
        }
      } else {
        setTimeout(() => {
          setShake(index);
          setTimeout(() => {
            setFlipped([]);
            setShake(null);
          }, 260);
        }, 550);
      }
    }
  };

  const pairsLeft = pairs - matched.length / 2;

  return (
    <div className="game-memory">
      <div className="game-hud">
        <div className="game-hud__cell">
          <span className="game-hud__label">Pairs left</span>
          <span className="game-hud__value">{pairsLeft}</span>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Moves</span>
          <span className="game-hud__value game-hud__value--mono">{moves}</span>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Time</span>
          <span className="game-hud__value game-hud__value--mono">{running ? `${seconds}s` : '—'}</span>
        </div>
      </div>

      <div className={`memory-grid memory-grid--cols-${columns}`}>
        {deck.map((symbol, i) => {
          const isUp = flipped.includes(i) || matched.includes(i);
          const isMatched = matched.includes(i);
          return (
            <button
              key={i}
              className={`memory-cell ${isUp ? 'memory-cell--up' : ''} ${isMatched ? 'memory-cell--matched' : ''} ${i === shake ? 'memory-cell--shake' : ''}`}
              onClick={() => flip(i)}
              disabled={isMatched}
              aria-label={isUp ? symbol : 'Hidden tile'}
            >
              <span className="memory-cell__inner">
                <span className="memory-cell__back">?</span>
                <span className="memory-cell__face">{symbol}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}