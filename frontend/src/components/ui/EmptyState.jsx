import cx from '../../utils/cx.js';

export default function EmptyState({ icon = '🗂️', title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h4 className="empty-state__title">{title}</h4>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}