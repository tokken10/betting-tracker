import { Router } from 'express';
import Bet from '../models/Bet.js';
import authorize from '../middleware/authorize.js';

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
    const bets = await Bet.find();
    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

router.post('/', async (req, res) => {
  const validationError = validateBet(req.body);
  if (validationError) {
    console.error('Validation error:', validationError);
    return res.status(400).json({ error: validationError });
  }
  try {
    const newBet = new Bet(req.body);
    await newBet.save();
    res.status(201).json(newBet);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', authorize('admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    await Bet.deleteMany({});
    res.json({ message: 'All bets deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bets' });
  }
});

router.put('/:id', async (req, res) => {
  const validationError = validateBet(req.body);
  if (validationError) {
    console.error('Validation error:', validationError);
    return res.status(400).json({ error: validationError });
  }
  try {
    const updatedBet = await Bet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBet);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await Bet.findByIdAndDelete(req.params.id);
  res.json({ message: 'Bet deleted' });
});

export default router;
