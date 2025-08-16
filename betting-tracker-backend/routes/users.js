const express = require('express');
const User = require('../models/User');
const authorize = require('../middleware/authorize');
const { updateUserStats } = require('../utils/userStats');

const router = express.Router();

// Get all registered users (admin access)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('username');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user with stats
router.get('/me', async (req, res) => {
  try {
    await updateUserStats(req.user.id);
    const user = await User.findById(req.user.id).select('username stats');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
