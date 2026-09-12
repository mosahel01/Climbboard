import { register, login, getMe } from '../services/auth.service.js';

export async function registerController(req, res, next) {
  try {
    const result = await register(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

export async function loginController(req, res, next) {
  try {
    const result = await login(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

export async function meController(req, res, next) {
  try {
    const user = await getMe(req.user.userId);
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    return next(err);
  }
}