import { validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';

/**
 * Runs express-validator checks and rejects the request if any failed.
 * Attach after your validation chain: [body('email').isEmail(), validate]
 */
export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => e.msg);
  return next(new AppError(details.join(' '), 422, 'VALIDATION_ERROR'));
}

export const isId = (value) => /^[a-zA-Z0-9_-]+$/.test(String(value));

export const parsePageQuery = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  return { page, limit };
};