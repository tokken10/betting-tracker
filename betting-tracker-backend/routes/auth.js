const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Password must contain at least 8 characters including uppercase,
// lowercase, number and special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

// Track login attempts per IP to throttle repeated failures
const loginAttempts = {};
const windowMs = 60 * 1000; // 1 minute
const maxAttempts = 5;

function loginRateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  if (!loginAttempts[ip]) loginAttempts[ip] = [];
  // Remove timestamps outside the window
  loginAttempts[ip] = loginAttempts[ip].filter((ts) => now - ts < windowMs);
  if (loginAttempts[ip].length >= maxAttempts) {
    return res
      .status(429)
      .json({ error: 'Too many login attempts, please try again later.' });
  }
  loginAttempts[ip].push(now);
  next();
}

const router = express.Router();

function buildCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  // For cross-site frontend/backends, SameSite=None; Secure is required
  const sameSite = isProd ? 'none' : 'lax';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters and include uppercase, lowercase, number and special character'
      });
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

router.post('/login', loginRateLimiter, async (req, res) => {
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

// Current user from cookie (no auth middleware)
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('username role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username, role: user.role });
  } catch (err) {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout clears cookie
router.post('/logout', (req, res) => {
  const options = buildCookieOptions();
  res.clearCookie('token', { ...options, maxAge: undefined });
  res.status(204).end();
});

module.exports = router;
