import { exportToCSV, clearBets } from './bets.js';
import { decodeToken } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-bets-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }

  const clearLink = document.getElementById('clear-bets-link');
  if (clearLink) {
    clearLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to clear your betting history?')) {
        await clearBets();
        alert('Betting history cleared');
      }
    });
  }

  const usernameDisplay = document.getElementById('username-display');
  const token = localStorage.getItem('token');
  if (usernameDisplay && token) {
    const user = decodeToken(token);
    if (user?.username) {
      usernameDisplay.textContent = `Logged in as ${user.username}`;
      usernameDisplay.style.display = 'block';
    }
  }

  if (clearLink && token) {
    clearLink.style.display = 'block';
  }
});
