import Button from './Button.jsx';

export default function ErrorState({ title = 'Something went wrong', message = 'Please try again.', onRetry }) {
  return (
    <div className="empty-state error-state">
      <div className="empty-state__icon">⚠️</div>
      <h4 className="empty-state__title">{title}</h4>
      <p className="empty-state__message">{message}</p>
      {onRetry && (
        <div className="empty-state__action">
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}