import cx from '../../utils/cx.js';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RankBadge({ rank, size = 'md' }) {
  if (MEDALS[rank]) {
    return (
      <span className={cx('rank-badge', `rank-badge--medal`, `rank-badge--${size}`)} aria-label={`Rank ${rank}`}>
        {MEDALS[rank]}
      </span>
    );
  }
  return (
    <span className={cx('rank-badge', `rank-badge--num`, `rank-badge--${size}`)} aria-label={`Rank ${rank}`}>
      {rank}
    </span>
  );
}

export { MEDALS };