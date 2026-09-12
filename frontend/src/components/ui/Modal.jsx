import { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer, width = 'sm' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal modal--${width}`} onClick={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}