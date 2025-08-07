const express = require('express');
const router = express.Router();
const Bet = require('../models/Bet');

// Get all bets
router.get('/', async (req, res) => {
  const bets = await Bet.find();
  res.json(bets);
});

// Add a new bet
router.post('/', async (req, res) => {
  try {
    const newBet = new Bet(req.body);
    await newBet.save();
    res.status(201).json(newBet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a bet
router.delete('/:id', async (req, res) => {
  await Bet.findByIdAndDelete(req.params.id);
  res.json({ message: 'Bet deleted' });
});

module.exports = router;