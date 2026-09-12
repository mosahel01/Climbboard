import { useEffect, useRef, useState } from 'react';

const DURATION = 30;
const BASE = 100;
const COMBO_STEP = 10;
const TARGET_LIFE_MS = 1600;
const TARGETS = ['🎯', '👾', '⚡', '🍀', '💎'];

export default function SpeedRun({ onFinish, settings = {} }) {
  const duration = settings.duration || DURATION;
  const life = settings.life || TARGET_LIFE_MS;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [target, setTarget] = useState(() => randomTarget(0));
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState(null);

  const expireRef = useRef(null);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const doneRef = useRef(false);
  const targetIdRef = useRef(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1 && !doneRef.current) {
          doneRef.current = true;
          clearInterval(tick);
          clearTimeout(expireRef.current);
          onFinish(scoreRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    setTimeout(spawn, 350);

    return () => {
      clearInterval(tick);
      clearTimeout(expireRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(t);
  }, [flash]);

  function spawn(bad = false) {
    clearTimeout(expireRef.current);
    targetIdRef.current += 1;
    setTarget(randomTarget(targetIdRef.current));
    if (bad) {
      comboRef.current = 0;
      setCombo(0);
      missesRef.current += 1;
      setMisses(missesRef.current);
    }
    expireRef.current = setTimeout(() => {
      if (!doneRef.current) spawn(true);
    }, life);
  }

  function pop() {
    if (doneRef.current) return;
    const mult = 1 + Math.min(40, comboRef.current);
    const gain = BASE + mult * COMBO_STEP;
    comboRef.current += 1;
    const nc = comboRef.current;
    setCombo(nc);
    setBestCombo((b) => Math.max(b, nc));
    hitsRef.current += 1;
    setHits(hitsRef.current);
    scoreRef.current += gain;
    setScore(scoreRef.current);
    setFlash({ gain, stamp: targetIdRef.current });
    spawn(false);
  }

  const pct = (timeLeft / duration) * 100;

  return (
    <div className="game-speed">
      <div className="game-hud">
        <div className="game-hud__cell">
          <span className="game-hud__label">Time</span>
          <span className="game-hud__value game-hud__value--mono">{timeLeft}s</span>
        </div>
        <div className="game-hud__cell game-hud__cell--center">
          <span className="game-hud__label">Combo</span>
          <span className={`game-hud__value game-hud__value--combo ${combo > 0 ? 'game-hud__value--hot' : ''}`}>
            ×{combo}
          </span>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Score</span>
          <span className="game-hud__value game-hud__value--mono">{score.toLocaleString('en-US')}</span>
        </div>
      </div>

      <div className="timer-track">
        <div className="timer-track__fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="speed-arena">
        {target && (
          <button
            key={target.id}
            className="speed-target"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            onClick={pop}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Tap the target"
          >
            {target.emoji}
          </button>
        )}
        {flash && (
          <span className="speed-float" key={flash.stamp}>
            +{flash.gain}
          </span>
        )}
      </div>

      <div className="game-hud game-hud--mini">
        <span className="muted">
          Hits <b className="mono">{hits}</b> · Misses <b className="mono">{misses}</b> · Best combo{' '}
          <b className="mono">×{bestCombo}</b>
        </span>
      </div>
    </div>
  );
}

function randomTarget(id) {
  return {
    id,
    x: 8 + Math.random() * 84,
    y: 10 + Math.random() * 78,
    emoji: TARGETS[Math.floor(Math.random() * TARGETS.length)],
  };
}