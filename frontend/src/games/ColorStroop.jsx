import { useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 45;
const BASE = 100;
const COLORS = [
  { name: 'Red', hex: '#e5484d' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#30a46c' },
  { name: 'Yellow', hex: '#e3c200' },
  { name: 'Purple', hex: '#8e4ec6' },
];

function makeDeno() {
  const ink = COLORS[Math.floor(Math.random() * COLORS.length)];
  const words = COLORS.filter((c) => c.name !== ink.name).map((c) => c.name);
  const word = words[Math.floor(Math.random() * words.length)];
  const options = shuffle(COLORS.map((c) => c.name));
  return { word, ink, options, spawn: Date.now() };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ColorStroop({ onFinish, settings = {} }) {
  const duration = settings.duration || DEFAULT_DURATION;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [deno, setDeno] = useState(() => makeDeno());
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const scoreRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1 && !doneRef.current) {
          doneRef.current = true;
          clearInterval(t);
          onFinish(scoreRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onFinish]);

  const pick = (name) => {
    if (locked) return;
    setLocked(true);

    if (name === deno.ink.name) {
      const mult = 1 + Math.min(5, Math.floor(streak / 3));
      const gain = BASE * mult;
      scoreRef.current += gain;
      setScore(scoreRef.current);
      setStreak((s) => s + 1);
      setAnswered((a) => a + 1);
      setFeedback({ ok: true, gain });
    } else {
      setStreak(0);
      setFeedback({ ok: false, correct: deno.ink.name });
    }

    setTimeout(() => {
      setFeedback(null);
      setDeno(makeDeno());
      setLocked(false);
    }, 420);
  };

  const mult = 1 + Math.min(5, Math.floor(streak / 3));
  const pct = (timeLeft / duration) * 100;

  return (
    <div className="game-stroop">
      <div className="game-hud">
        <div className="game-hud__cell">
          <span className="game-hud__label">Timer</span>
          <span className="game-hud__value game-hud__value--mono">{timeLeft}s</span>
        </div>
        <div className="game-hud__cell game-hud__cell--center">
          <span className="game-hud__label">Streak ×{mult}</span>
          <div className="streak-dots">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= mult ? 'streak-dot streak-dot--on' : 'streak-dot'} />
            ))}
          </div>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Score</span>
          <span className="game-hud__value game-hud__value--mono">{score.toLocaleString('en-US')}</span>
        </div>
      </div>

      <div className="timer-track">
        <div className="timer-track__fill" style={{ width: `${pct}%` }} />
      </div>

      <p className="stroop-instruct">Pick the color of the <b>ink</b>, not the word.</p>

      <div className="stroop-word" key={answered}>
        <div className="stroop-word__text" style={{ color: deno.ink.hex }}>
          {deno.word}
        </div>
      </div>

      <div className="quiz-card__grid">
        {deno.options.map((name) => {
          const c = COLORS.find((x) => x.name === name);
          return (
            <button
              key={name}
              className={`quiz-card__opt stroop-opt ${feedback && feedback.ok && name === deno.ink.name ? 'quiz-card__opt--correct' : ''}`}
              style={{ '--swatch': c.hex }}
              onClick={() => pick(name)}
              disabled={locked}
            >
              {name}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={feedback.ok ? 'quiz-card__feedback quiz-card__feedback--ok' : 'quiz-card__feedback quiz-card__feedback--bad'}>
          {feedback.ok ? `+${feedback.gain}` : `✗ ink was ${feedback.correct}`}
        </div>
      )}
    </div>
  );
}