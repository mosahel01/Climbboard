import { useEffect, useRef, useState } from 'react';

const DEFAULT_ROUNDS = 7;
const WAIT_MIN = 1200;
const WAIT_MAX = 2600;
const PAR_MS = 1200;
const ROUND_BASE = 1000;
const FALSE_START_PENALTY = 500;
const TARGETS = ['🎯', '⚡', '💥', '🔥', '🔔', '🚨'];

export default function FlashReaction({ onFinish, settings = {} }) {
  const rounds = settings.rounds || DEFAULT_ROUNDS;
  const [round, setRound] = useState(0);
  const [state, setState] = useState('wait'); // wait | go | result
  const [latestRt, setLatestRt] = useState(null);
  const [falseStarts, setFalseStarts] = useState(0);
  const [avgRt, setAvgRt] = useState(null);
  const [score, setScore] = useState(0);

  const scoreRef = useRef(0);
  const rtsRef = useRef([]);
  const fsRef = useRef(0);
  const goAtRef = useRef(0);
  const doneRef = useRef(false);
  const goTimerRef = useRef(null);

  const clearGoTimer = () => {
    if (goTimerRef.current) {
      clearTimeout(goTimerRef.current);
      goTimerRef.current = null;
    }
  };

  useEffect(() => () => clearGoTimer(), []);

  const beginRound = (extraWait = 0) => {
    setState('wait');
    clearGoTimer();
    const wait = WAIT_MIN + Math.random() * (WAIT_MAX - WAIT_MIN) + extraWait;
    goTimerRef.current = setTimeout(() => {
      setState('go');
      goAtRef.current = Date.now();
    }, wait);
  };

  useEffect(() => {
    if (doneRef.current) return;
    if (round >= rounds) {
      doneRef.current = true;
      onFinish(Math.max(1, Math.round(scoreRef.current)));
      return;
    }
    setLatestRt(null);
    beginRound();
    return clearGoTimer;
  }, [round, rounds]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = () => {
    if (doneRef.current || state === 'result') return;

    if (state === 'go') {
      const rt = Date.now() - goAtRef.current;
      rtsRef.current.push(rt);
      const avg = Math.round(rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length);
      setAvgRt(avg);
      setLatestRt(rt);
      setScore(scoreRef.current + ROUND_BASE + Math.max(0, PAR_MS - rt));
      scoreRef.current += ROUND_BASE + Math.max(0, PAR_MS - rt);
      setState('result');
      setTimeout(() => setRound((r) => r + 1), 420);
      return;
    }

    if (state === 'wait') {
      fsRef.current += 1;
      setFalseStarts(fsRef.current);
      scoreRef.current -= FALSE_START_PENALTY;
      setScore(scoreRef.current);
      setLatestRt(null);
      beginRound(600);
    }
  };

  const target = TARGETS[round % TARGETS.length];
  const isPlaying = round < rounds;

  return (
    <div className="game-flash">
      <div className="game-hud">
        <div className="game-hud__cell">
          <span className="game-hud__label">Round</span>
          <span className="game-hud__value game-hud__value--mono">
            {isPlaying ? `${round + 1}/${rounds}` : '—'}
          </span>
        </div>
        <div className="game-hud__cell game-hud__cell--center">
          <span className="game-hud__label">Avg reaction</span>
          <span className="game-hud__value game-hud__value--mono">
            {avgRt != null ? `${avgRt}ms` : '—'}
          </span>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Score</span>
          <span className="game-hud__value game-hud__value--mono">{score.toLocaleString('en-US')}</span>
        </div>
      </div>

      <button
        className={`flash-arena flash-arena--${state} ${latestRt != null && latestRt <= 400 ? 'flash-arena--blazing' : ''}`}
        onClick={press}
        aria-label={state === 'go' ? 'Strike the target' : 'Wait for the target'}
      >
        {state === 'go' && (
          <span className="flash-target" key={round}>
            {target}
          </span>
        )}
        {state === 'wait' && <span className="flash-prompt">wait for it…</span>}
        {state === 'result' && (
          <span className="flash-prompt">
            {latestRt != null ? `${latestRt}ms` : ''}
          </span>
        )}
      </button>

      <div className="game-hud game-hud--mini">
        <span className="muted">
          False starts <b className="mono">{falseStarts}</b> · perfect round{' '}
          <b className="mono">&lt;400ms</b>
        </span>
      </div>
    </div>
  );
}