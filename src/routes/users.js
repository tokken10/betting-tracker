import { Router } from 'express';
import User from '../models/User.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('username');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
