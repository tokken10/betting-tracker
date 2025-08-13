import { Router } from 'express';
import Bet from '../models/Bet.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const bets = await Bet.find();
    res.json(bets);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const newBet = new Bet(req.body);
    await newBet.save();
    res.status(201).json(newBet);
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    await Bet.deleteMany({});
    res.json({ message: 'All bets deleted' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updatedBet = await Bet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedBet);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Bet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bet deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
