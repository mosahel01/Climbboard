import { useEffect, useState } from 'react';
import Spinner from '../components/ui/Spinner.jsx';

export default function Countdown({ onDone, ms = 1000 }) {
  const [stage, setStage] = useState(3);

  useEffect(() => {
    if (stage <= 0) {
      const t = setTimeout(onDone, 120);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s - 1), ms);
    return () => clearTimeout(t);
  }, [stage, ms, onDone]);

  if (stage <= 0) {
    return (
      <div className="countdown countdown--go">
        <span>GO!</span>
      </div>
    );
  }

  return (
    <div className="countdown">
      <span key={stage} className="countdown__num">
        {stage}
      </span>
    </div>
  );
}

export function GameLoader() {
  return (
    <div className="page-center">
      <Spinner size="lg" />
    </div>
  );
}