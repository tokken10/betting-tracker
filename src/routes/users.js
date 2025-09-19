import { Router } from 'express';
import User from '../models/User.js';
import Bet from '../models/Bet.js';
import authorize from '../middleware/authorize.js';
import { encrypt } from '../utils/crypto.js';
import { computeUserStatsForClient } from '../utils/analysis.js';

const router = Router();

router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('username');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const [user, bets] = await Promise.all([
      User.findById(req.user.id).select('username role openAiKeySetAt openAiKey').lean({ getters: true }),
      Bet.find({ user: req.user.id }).lean({ getters: true }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = computeUserStatsForClient(bets);
    res.json({
      username: user.username,
      role: user.role,
      stats,
      aiKeyConfigured: Boolean(user.openAiKey),
      aiKeySetAt: user.openAiKeySetAt || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/me/openai-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return res.status(400).json({ error: 'A valid OpenAI API key is required.' });
    }

    const encrypted = encrypt(apiKey.trim());
    await User.findByIdAndUpdate(req.user.id, {
      openAiKey: encrypted,
      openAiKeySetAt: new Date(),
    });

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/me/openai-key', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      openAiKey: null,
      openAiKeySetAt: null,
    });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
