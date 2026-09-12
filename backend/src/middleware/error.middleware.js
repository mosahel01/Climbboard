import { NotFoundError } from '../utils/errors.js';

export function notFoundHandler(_req, _res, next) {
  next(new NotFoundError('Route not found.', 'ROUTE_NOT_FOUND'));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong.';

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message: status >= 500 ? 'Internal server error.' : message,
    },
  });
}