const express = require('express');
const router = express.Router();
const Bet = require('../models/Bet');
const { updateUserStats } = require('../utils/userStats');

// Get all bets for the authenticated user
router.get('/', async (req, res) => {
  const bets = await Bet.find({ user: req.user.id });
  res.json(bets);
});

// Add a new bet for the authenticated user
router.post('/', async (req, res) => {
  try {
    const newBet = new Bet({ ...req.body, user: req.user.id });
    await newBet.save();
    await updateUserStats(req.user.id);
    res.status(201).json(newBet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a bet for the authenticated user
router.put('/:id', async (req, res) => {
    try {
      const updatedBet = await Bet.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true }
      );
      await updateUserStats(req.user.id);
      res.json(updatedBet);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

// Delete all bets for the authenticated user
router.delete('/', async (req, res) => {
  await Bet.deleteMany({ user: req.user.id });
  await updateUserStats(req.user.id);
  res.json({ message: 'All bets deleted' });
});

// Delete a bet for the authenticated user
router.delete('/:id', async (req, res) => {
  await Bet.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  await updateUserStats(req.user.id);
  res.json({ message: 'Bet deleted' });
});

module.exports = router;
