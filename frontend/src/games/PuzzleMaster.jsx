import { useEffect, useRef, useState } from 'react';

const TOTAL_SECONDS_BASE = 10000;
const SECOND_PENALTY = 10;
const EXTRA_MOVE_PENALTY = 25;
const FREE_MOVES = 30;

function solvedState() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 0];
}

function indexOfZero(state) {
  return state.indexOf(0);
}

function shuffleState(shuffle) {
  let state = solvedState();
  const rand = () => Math.floor(Math.random() * 4);
  for (let i = 0; i < shuffle; i += 1) {
    const blank = indexOfZero(state);
    const row = Math.floor(blank / 3);
    const col = blank % 3;
    let delta = [0, 0, 0, 0];
    switch (rand()) {
      case 0: delta = [1, 0]; break;
      case 1: delta = [-1, 0]; break;
      case 2: delta = [0, 1]; break;
      default: delta = [0, -1]; break;
    }
    const nr = row + delta[0];
    const nc = col + delta[1];
    if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
    const swapIndex = nr * 3 + nc;
    [state[blank], state[swapIndex]] = [state[swapIndex], state[blank]];
  }
  return state;
}

function isSolved(state) {
  return state.join(',') === '1,2,3,4,5,6,7,8,0';
}

export default function PuzzleMaster({ onFinish, settings = {} }) {
  const shuffle = settings.shuffle || 400;
  const [board, setBoard] = useState(() => shuffleState(shuffle));
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const boardRef = useRef(board);
  const movesRef = useRef(0);
  const secondsRef = useRef(0);
  const solvedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const finish = (finalMoves, finalSeconds) => {
    if (solvedRef.current) return;
    solvedRef.current = true;
    clearInterval(timerRef.current);
    const score = Math.max(
      1,
      TOTAL_SECONDS_BASE - finalSeconds * SECOND_PENALTY - Math.max(0, finalMoves - FREE_MOVES) * EXTRA_MOVE_PENALTY,
    );
    onFinish(score);
  };

  const move = (index) => {
    if (solvedRef.current) return;
    const state = [...boardRef.current];
    const blank = indexOfZero(state);
    const targetRow = Math.floor(index / 3);
    const targetCol = index % 3;
    const blankRow = Math.floor(blank / 3);
    const blankCol = blank % 3;
    const adjacent = Math.abs(targetRow - blankRow) + Math.abs(targetCol - blankCol) === 1;
    if (!adjacent || state[index] === 0) return;

    [state[blank], state[index]] = [state[index], state[blank]];
    const newMoves = movesRef.current + 1;
    movesRef.current = newMoves;
    boardRef.current = state;
    setBoard(state);
    setMoves(newMoves);

    if (isSolved(state)) {
      finish(newMoves, secondsRef.current);
    }
  };

  const handleKey = (e) => {
    const dirs = { ArrowUp: -3, ArrowLeft: -1, ArrowRight: 1, ArrowDown: 3 };
    const d = dirs[e.key];
    if (d == null) return;
    e.preventDefault();
    const blank = indexOfZero(boardRef.current);
    const target = blank + d;
    if (target < 0 || target > 8) return;
    const blankRow = Math.floor(blank / 3);
    const targetRow = Math.floor(target / 3);
    if (Math.abs(blankRow - targetRow) > 1) return;
    move(target);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="game-puzzle">
      <div className="game-hud">
        <div className="game-hud__cell">
          <span className="game-hud__label">Time</span>
          <span className="game-hud__value game-hud__value--mono">{seconds}s</span>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Moves</span>
          <span className="game-hud__value game-hud__value--mono">{moves}</span>
        </div>
        <div className="game-hud__cell">
          <span className="game-hud__label">Best possible</span>
          <span className="game-hud__value game-hud__value--mono">10,000</span>
        </div>
      </div>

      <div className="puzzle-note muted">Click a tile next to the gap — or use the arrow keys.</div>

      <div className="puzzle-board" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {board.map((value, i) => {
          if (value === 0) return <div key={i} className="puzzle-tile puzzle-tile--blank" />;
          return (
            <button key={i} className="puzzle-tile" onClick={() => move(i)}>
              {value}
            </button>
          );
        })}
      </div>

      <div className="puzzle-reference">
        {solvedState().slice(0, 8).map((v) => (
          <span key={v} className="puzzle-reference__tile">
            {v}
          </span>
        ))}
        <span className="puzzle-reference__tile puzzle-reference__tile--blank"> </span>
      </div>
    </div>
  );
}