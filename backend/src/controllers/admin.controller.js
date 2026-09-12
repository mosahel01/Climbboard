import {
  getOverview,
  listUsers,
  updateUser,
  deleteUser,
  listGamesOverview,
} from '../services/admin.service.js';
import { parsePageQuery } from '../middleware/validate.middleware.js';

export async function adminOverviewController(req, res, next) {
  try {
    const overview = await getOverview();
    return res.status(200).json({ success: true, data: overview });
  } catch (err) {
    return next(err);
  }
}

export async function adminUsersController(req, res, next) {
  try {
    const { page, limit } = parsePageQuery(req);
    const sort = ['global', 'newest', 'name'].includes(req.query.sort) ? req.query.sort : 'global';
    const q = String(req.query.q || '').slice(0, 80);
    const { data, pagination } = await listUsers({ page, limit, sort, q });
    return res.status(200).json({ success: true, data: { users: data, pagination } });
  } catch (err) {
    return next(err);
  }
}

export async function adminUpdateUserController(req, res, next) {
  try {
    const { role } = req.body;
    const banned = req.body.banned == null ? undefined : Boolean(req.body.banned);
    const data = await updateUser(req.user.userId, req.params.userId, { role, banned });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

export async function adminDeleteUserController(req, res, next) {
  try {
    const data = await deleteUser(req.user.userId, req.params.userId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

export async function adminGamesController(req, res, next) {
  try {
    const data = await listGamesOverview();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}