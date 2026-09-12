import { useState } from 'react';
import cx from '../../utils/cx.js';

export default function Input({ label, error, hint, id, required, className, type = 'text', ...rest }) {
  const [show, setShow] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword && show ? 'text' : type;

  return (
    <div className={cx('field', className)}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label} {required && <span className="field__required">*</span>}
        </label>
      )}
      <div className="field__control">
        <input
          id={id}
          type={resolvedType}
          className={cx('input', error && 'input--error')}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        {isPassword && (
          <button type="button" className="field__toggle" onClick={() => setShow((s) => !s)} tabIndex={-1}>
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}