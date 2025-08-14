const express = require('express');
const router = express.Router();
const Bet = require('../models/Bet');
const authorize = require('../middleware/authorize');

// Get bets - admins see all, others see their own
router.get('/', async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
  const bets = await Bet.find(filter);
  res.json(bets);
});

// Add a new bet for the authenticated user
router.post('/', async (req, res) => {
  try {
    const newBet = new Bet({ ...req.body, user: req.user.id });
    await newBet.save();
    res.status(201).json(newBet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete all bets from the database (admin only)
router.delete('/', authorize('admin'), async (req, res) => {
  await Bet.deleteMany({});
  res.json({ message: 'All bets deleted' });
});

// Update a bet - admin can update any bet
router.put('/:id', async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user.id };
    const updatedBet = await Bet.findOneAndUpdate(filter, req.body, { new: true });
    res.json(updatedBet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a bet - admin can delete any bet
router.delete('/:id', async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, user: req.user.id };
  await Bet.findOneAndDelete(filter);
  res.json({ message: 'Bet deleted' });
});

module.exports = router;