import { clearBets } from './bets.js';
import { renderBets } from './render.js';
import { updateStats } from './stats.js';

document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.getElementById('reset-bets-btn');
  if (!resetBtn) return;

  resetBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all bets?')) return;
    await clearBets();
    renderBets();
    await updateStats();
    alert('All bets have been cleared.');
  });
});
