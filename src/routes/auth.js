import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { buildAuthCookieOptions, signAuthToken } from '../utils/authTokens.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ username, password: hashedPassword, role: role || 'user' });
    await user.save();
    const token = signAuthToken(user);
    res
      .cookie('token', token, buildAuthCookieOptions())
      .status(201)
      .json({ user: { username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = signAuthToken(user);
    res
      .cookie('token', token, buildAuthCookieOptions())
      .json({ user: { username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return current user if cookie is valid
router.get('/me', async (req, res) => {
  try {
    // If middleware already set req.user, we can just use it. But keep a local check too.
    const payload = req.user || (req.cookies?.token ? jwt.verify(req.cookies.token, process.env.JWT_SECRET) : null);
    if (!payload?.id) return res.status(401).json({ error: 'Not authenticated' });
    const user = await User.findById(payload.id).select('username role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username, role: user.role });
  } catch (err) {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Clear auth cookie
router.post('/logout', (req, res) => {
  const options = buildAuthCookieOptions();
  res.clearCookie('token', { ...options, maxAge: undefined });
  res.status(204).end();
});

export default router;
