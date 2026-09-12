import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current.set(id, setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500));
      return id;
    },
    [dismiss],
  );

  const success = useCallback((m) => push(m, 'success'), [push]);
  const error = useCallback((m) => push(m, 'error'), [push]);
  const info = useCallback((m) => push(m, 'info'), [push]);

  return (
    <ToastContext.Provider value={{ success, error, info, dismiss }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} onClick={() => dismiss(t.id)}>
            <span className="toast__icon">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'ℹ'}
            </span>
            <span className="toast__message">{t.message}</span>
            <button className="toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}