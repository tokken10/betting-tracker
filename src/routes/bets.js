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
    const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
    const bets = await Bet.find(filter);
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
    const newBet = new Bet({ ...req.body, user: req.user.id });
    await newBet.save();
    res.status(201).json(newBet);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', authorize('admin'), async (req, res) => {
  try {
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
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user.id };
    const updatedBet = await Bet.findOneAndUpdate(filter, req.body, { new: true });
    res.json(updatedBet);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, user: req.user.id };
  await Bet.findOneAndDelete(filter);
  res.json({ message: 'Bet deleted' });
});

export default router;
