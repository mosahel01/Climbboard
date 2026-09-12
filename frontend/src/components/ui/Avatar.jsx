import cx from '../../utils/cx.js';

const PALETTE = ['#635bff', '#8b5cf6', '#0ea5e9', '#0fbf8f', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'];
const LIGHT = ['#eeedff', '#f3e8ff', '#e6f6fe', '#e4faf3', '#fef3dd', '#fde8f2', '#eeedff', '#dbfff9', '#fff1e6', '#f3e8ff'];

export default function Avatar({ children, seed = '', size = 'md', className }) {
  let hash = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const color = PALETTE[hash % PALETTE.length];
  const bg = LIGHT[hash % LIGHT.length];

  return (
    <span
      className={cx('avatar', `avatar--${size}`, className)}
      style={{ background: bg, color }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}