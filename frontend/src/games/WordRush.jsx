import { useEffect, useRef, useState } from 'react';

const DURATION = 60;
const BASE = 150;
const LENGTH_BONUS = 20;
const STREAK_BONUS = 10;

const WORDS = [
  'leaderboard', 'realtime', 'market', 'speed', 'arena', 'pixel', 'combine', 'thunder',
  'rocket', 'comet', 'voltage', 'magnet', 'crystal', 'monsoon', 'engine', 'matrix',
  'nebula', 'orbit', 'plasma', 'quantum', 'signal', 'turbine', 'vector', 'zenith',
  'blaze', 'clutch', 'drift', 'ember', 'flare', 'grove', 'harbor', 'ignite',
  'jolt', 'kiln', 'lumen', 'meadow', 'nimbus', 'onyx', 'pebble', 'quill',
  'rapid', 'slate', 'torch', 'ultra', 'vault', 'wharf', 'axiom', 'border',
  'crane', 'delta', 'echo', 'facade', 'gloss', 'haste', 'island', 'judge',
  'kiosk', 'laser', 'maple', 'novel', 'oasis', 'prism', 'quarry', 'river',
  'snow', 'timber', 'unveil', 'vivid', 'wild', 'yield', 'zebra', 'latch',
  'midway', 'hurdle', 'brisk', 'cleave', 'dove', 'forge', 'grind', 'heave',
];

const pitchWeights = (word) => Math.min(8, word.length);

export default function WordRush({ onFinish, settings = {} }) {
  const duration = settings.duration || DURATION;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [word, setWord] = useState(() => pickWord());
  const [buffer, setBuffer] = useState('');
  const [streak, setStreak] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [score, setScore] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [flash, setFlash] = useState(null);

  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const clearedRef = useRef(0);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const tick = setInterval(() => {
      elapsedRef.current += 1;
      setTimeLeft((s) => {
        if (s <= 1 && !doneRef.current) {
          doneRef.current = true;
          clearInterval(tick);
          onFinish(scoreRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [onFinish]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(t);
  }, [flash]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const onType = (e) => {
    const input = e.target.value;
    if (input.length > word.length) {
      e.target.value = buffer;
      return;
    }
    const expected = word.slice(0, input.length);
    if (input !== expected) {
      streakRef.current = 0;
      setStreak(0);
      setBuffer('');
      setShaking(true);
      setTimeout(() => setShaking(false), 250);
      e.target.value = '';
      return;
    }
    setBuffer(input);
    if (input.length === word.length) {
      const gain = BASE + word.length * LENGTH_BONUS + streakRef.current * STREAK_BONUS;
      scoreRef.current += gain;
      clearedRef.current += 1;
      streakRef.current += 1;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      setCleared(clearedRef.current);
      setFlash({ gain, stamp: Date.now() });
      setWord(pickWord());
      setBuffer('');
      e.target.value = '';
    }
  };

  const pct = (timeLeft / duration) * 100;
  const wpm = elapsedRef.current > 0 ? Math.round((clearedRef.current / elapsedRef.current) * 60) : 0;

  return (
    <div className="game-wordrush" onClick={focusInput}>
      <div className="game-hud">
        <div className="game-hud__cell">
          <span className="game-hud__label">Timer</span>
          <span className="game-hud__value game-hud__value--mono">{timeLeft}s</span>
        </div>
        <div className="game-hud__cell game-hud__cell--center">
          <span className="game-hud__label">Streak</span>
          <span className={`game-hud__value ${streak > 0 ? 'game-hud__value--hot' : ''}`}>×{streak}</span>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Score</span>
          <span className="game-hud__value game-hud__value--mono">{score.toLocaleString('en-US')}</span>
        </div>
      </div>

      <div className="timer-track">
        <div className="timer-track__fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="word-stage">
        <div className={`word-display ${shaking ? 'word-display--shake' : ''}`} key={word}>
          {word.split('').map((ch, i) => (
            <span
              key={i}
              className={
                i < buffer.length ? 'word-char word-char--typed' : i === buffer.length ? 'word-char word-char--next' : 'word-char'
              }
            >
              {ch}
            </span>
          ))}
        </div>

        <input
          ref={inputRef}
          className="word-input"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={onType}
          placeholder="Start typing…"
          aria-label="Type the highlighted word"
        />

        {flash && (
          <span className="word-float" key={flash.stamp}>
            +{flash.gain}
          </span>
        )}
      </div>

      <div className="game-hud game-hud--mini">
        <span className="muted">
          Cleared <b className="mono">{cleared}</b> · speed <b className="mono">{wpm} wpm</b>
        </span>
      </div>
    </div>
  );
}

function pickWord() {
  let total = 0;
  if (!pickWord.weights) {
    pickWord.weights = WORDS.map((w) => { total += pitchWeights(w); return total; });
    pickWord.total = total;
  }
  const roll = Math.random() * pickWord.total;
  for (let i = 0; i < WORDS.length; i += 1) {
    if (roll < pickWord.weights[i]) return WORDS[i];
  }
  return WORDS[WORDS.length - 1];
}