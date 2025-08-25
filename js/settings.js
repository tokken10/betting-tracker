import { exportToCSV, clearBets } from './bets.js';
import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
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
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    if (res.ok) {
      const user = await res.json();
      if (usernameDisplay && user?.username) {
        usernameDisplay.textContent = `Logged in as ${user.username}`;
        usernameDisplay.style.display = 'block';
      }
      if (clearLink) {
        clearLink.style.display = 'block';
      }
    }
  } catch {}
});
