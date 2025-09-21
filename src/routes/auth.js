import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

function buildCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  // Cross-site (frontend on different origin) requires SameSite=None and Secure
  const sameSite = isProd ? 'none' : 'lax';
  return {
    httpOnly: true,
    secure: isProd, // must be true for SameSite=None on HTTPS
    sameSite,
    path: '/',
    // Optionally set domain if you have a custom domain; omit for vercel subdomains
    // domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

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
    const token = signToken(user);
    res
      .cookie('token', token, buildCookieOptions())
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
    const token = signToken(user);
    res
      .cookie('token', token, buildCookieOptions())
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
  const options = buildCookieOptions();
  res.clearCookie('token', { ...options, maxAge: undefined });
  res.status(204).end();
});

export default router;
