import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { keys, buildUserId } from '../utils/keys.js';
import { AppError, ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const ROLES = ['user', 'admin'];

export function toPublicUser(user) {
  if (!user || user.username == null) return null;
  const { passwordHash, ...safe } = user;
  return {
    ...safe,
    role: ROLES.includes(user.role) ? user.role : 'user',
    banned: user.banned === '1' || user.banned === 'true',
  };
}

export async function getUserById(userId) {
  const redis = await getRedis();
  const user = await redis.hgetall(keys.user(userId));
  if (!user || user.username == null) return null;
  return user;
}

export async function getPublicUser(userId) {
  const user = await getUserById(userId);
  return toPublicUser(user);
}

export async function register({ username, email, password, role = 'user' }) {
  const redis = await getRedis();

  if (!USERNAME_PATTERN.test(username)) {
    throw new AppError(
      'Username must be 3-20 characters using letters, numbers or underscores.',
      422,
      'INVALID_USERNAME',
    );
  }

  const [usernameTaken, emailTaken] = await Promise.all([
    redis.hexists(keys.userNameIndex(), username),
    redis.hexists(keys.userEmailIndex(), email),
  ]);

  if (usernameTaken) throw new ConflictError('Username is already taken.', 'USERNAME_TAKEN');
  if (emailTaken) throw new ConflictError('An account with that email already exists.', 'EMAIL_TAKEN');

  const id = await redis.incr(keys.counters.user());
  const userId = buildUserId(id);
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = new Date().toISOString();

  const pipeline = redis.pipeline();
  pipeline.hset(keys.user(userId), {
    username,
    email,
    passwordHash,
    role,
    banned: '0',
    createdAt,
  });
  pipeline.hset(keys.userNameIndex(), username, userId);
  pipeline.hset(keys.userEmailIndex(), email, userId);
  pipeline.sadd(keys.allUserIds(), userId);
  await pipeline.exec();

  const token = signToken(userId);
  return { user: toPublicUser({ id: userId, username, email, role, banned: '0', createdAt }), token };
}

export async function login({ email, password }) {
  const redis = await getRedis();

  const userId = await redis.hget(keys.userEmailIndex(), email);
  if (!userId) throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');

  const user = await redis.hgetall(keys.user(userId));
  if (!user || user.passwordHash == null) {
    throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');

  if (user.banned === '1' || user.banned === 'true') {
    throw new ForbiddenError('This account has been banned. Contact an administrator.', 'ACCOUNT_BANNED');
  }

  const token = signToken(userId);
  return { user: toPublicUser(user), token };
}

export async function getMe(userId) {
  const user = await getPublicUser(userId);
  if (!user) throw new NotFoundError('User not found.', 'USER_NOT_FOUND');
  return user;
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}