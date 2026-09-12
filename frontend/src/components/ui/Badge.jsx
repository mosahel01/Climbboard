import cx from '../../utils/cx.js';

export default function Badge({ children, color = 'neutral', className }) {
  return <span className={cx('badge', `badge--${color}`, className)}>{children}</span>;
}