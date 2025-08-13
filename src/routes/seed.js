import { Router } from 'express';
import authorize from '../middleware/authorize.js';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

router.post('/nowbenj', authorize('admin'), (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = path.resolve(__dirname, '../../scripts/seedNowbenj.js');

  execFile('node', [scriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error(stderr);
      return res.status(500).json({ error: 'Seeding failed' });
    }
    res.json({ message: 'Seeding complete', output: stdout });
  });
});

export default router;

