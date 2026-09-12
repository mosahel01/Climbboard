import cx from '../../utils/cx.js';

export default function StatCard({ icon, label, value, sub, accent = 'indigo', className }) {
  return (
    <div className={cx('stat-card', `stat-card--${accent}`, className)}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {sub && <p className="stat-card__sub">{sub}</p>}
      </div>
    </div>
  );
}