import cx from '../../utils/cx.js';

export default function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...rest }) {
  return (
    <button
      className={cx('btn', `btn--${variant}`, `btn--${size}`, loading && 'btn--loading', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}