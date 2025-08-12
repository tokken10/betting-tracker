import { Router } from 'express';
import Bet from '../models/Bet.js';

const router = Router();

router.get('/', async (req, res) => {
  const bets = await Bet.find();
  res.json(bets);
});

router.post('/', async (req, res) => {
  try {
    const newBet = new Bet(req.body);
    await newBet.save();
    res.status(201).json(newBet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', async (req, res) => {
  await Bet.deleteMany({});
  res.json({ message: 'All bets deleted' });
});

router.put('/:id', async (req, res) => {
  try {
    const updatedBet = await Bet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await Bet.findByIdAndDelete(req.params.id);
  res.json({ message: 'Bet deleted' });
});

export default router;
