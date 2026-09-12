import { verifyToken } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

export function attachUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.sub };
    return req.user;
  } catch {
    return null;
  }
}

export function requireAuth(req, _res, next) {
  const user = attachUser(req);
  if (!user) {
    return next(new UnauthorizedError('Authentication required. Please log in.', 'AUTH_REQUIRED'));
  }
  return next();
}

export function optionalAuth(req, _res, next) {
  attachUser(req);
  return next();
}