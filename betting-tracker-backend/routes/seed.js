const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.post('/nowbenj', authorize('admin'), (req, res) => {
  const scriptPath = path.resolve(__dirname, '../../scripts/seedNowbenj.js');
  execFile('node', [scriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error('Seed script error:', error);
      return res.status(500).json({ error: 'Seeding failed' });
    }
    res.json({ message: 'Seed script executed successfully' });
  });
});

module.exports = router;
