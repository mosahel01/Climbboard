import { useEffect, useRef, useState } from 'react';

const DURATION = 60;
const BASE = 100;

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function makeQuestion(level, levelSize) {
  const size = Math.min(12, levelSize + Math.floor(level / 4));
  const a = randInt(2, size);
  const b = randInt(2, size);
  const op = ['+', '-', '×', '×'][randInt(0, 3)];
  let answer;
  if (op === '+') answer = a + b;
  else if (op === '-') answer = a - b;
  else answer = a * b;

  const options = new Set([answer]);
  while (options.size < 4) {
    options.add(answer + randInt(-3, 3));
  }
  return { text: `${a} ${op} ${b}`, answer, options: shuffle([...options]), spawn: Date.now() };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MathChallenge({ onFinish, settings = {} }) {
  const duration = settings.duration || DURATION;
  const levelSize = settings.levelSize || 3;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [question, setQuestion] = useState(() => makeQuestion(0, levelSize));
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const scoreRef = useRef(0);
  const levelRef = useRef(0);
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

  const pick = (value) => {
    if (locked) return;
    setLocked(true);

    if (value === question.answer) {
      const mult = 1 + Math.min(5, Math.floor(streak / 3));
      const gain = BASE * mult;
      scoreRef.current += gain;
      setScore(scoreRef.current);
      setStreak((s) => s + 1);
      setAnswered((a) => a + 1);
      setFeedback({ ok: true, gain });
      levelRef.current += 1;
    } else {
      setStreak(0);
      setFeedback({ ok: false, correct: question.answer });
    }

    setTimeout(() => {
      setFeedback(null);
      setQuestion(makeQuestion(levelRef.current, levelSize));
      setLocked(false);
    }, 380);
  };

  const mult = 1 + Math.min(5, Math.floor(streak / 3));
  const pct = (timeLeft / duration) * 100;

  return (
    <div className="game-math">
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

      <div className="quiz-card" key={answered}>
        <p className="quiz-card__prompt">
          {question.text.split(' ').map((chunk, i) => (
            <span
              key={i}
              className={chunk === '×' || chunk === '+' || chunk === '-' ? 'quiz-card__op' : undefined}
            >
              {chunk}
            </span>
          ))}
        </p>
        <div className="quiz-card__grid">
          {question.options.map((opt) => (
            <button
              key={opt}
              className="quiz-card__opt"
              onClick={() => pick(opt)}
              disabled={locked}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={feedback.ok ? 'quiz-card__feedback quiz-card__feedback--ok' : 'quiz-card__feedback quiz-card__feedback--bad'}>
          {feedback.ok ? `+${feedback.gain}` : `✗ correct was ${feedback.correct}`}
        </div>
      )}
    </div>
  );
}