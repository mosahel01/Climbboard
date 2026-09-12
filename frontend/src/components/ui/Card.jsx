import cx from '../../utils/cx.js';

export default function Card({ title, subtitle, actions, className, children, padded = true }) {
  return (
    <section className={cx('card', className)}>
      {(title || actions) && (
        <header className="card__header">
          <div>
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className={cx('card__body', padded && 'card__body--padded')}>{children}</div>
    </section>
  );
}