import { Router } from 'express';
import Bet from '../models/Bet.js';
import authorize from '../middleware/authorize.js';
import logger from '../utils/logger.js';

const router = Router();

function validateBet(data) {
  const required = ['date', 'sport', 'event', 'betType', 'odds', 'stake'];
  for (const field of required) {
    if (data[field] === undefined) {
      return `${field} is required`;
    }
  }
  if (typeof data.stake !== 'number') {
    return 'stake must be a number';
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.user.id });
    res.json(bets);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

router.post('/', async (req, res) => {
  const validationError = validateBet(req.body);
  if (validationError) {
    logger.warn('Validation error:', validationError);
    return res.status(400).json({ error: validationError });
  }
  try {
    const newBet = new Bet({ ...req.body, user: req.user.id });
    await newBet.save();
    res.status(201).json(newBet);
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', authorize('admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    await Bet.deleteMany({ user: req.user.id });
    res.json({ message: 'All bets deleted' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to delete bets' });
  }
});

router.put('/:id', async (req, res) => {
  const validationError = validateBet(req.body);
  if (validationError) {
    logger.warn('Validation error:', validationError);
    return res.status(400).json({ error: validationError });
  }
  try {
    const updatedBet = await Bet.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    res.json(updatedBet);
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await Bet.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ message: 'Bet deleted' });
});

export default router;
