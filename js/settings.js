import { exportToCSV } from './bets.js';
import { decodeToken } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-bets-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
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
});
