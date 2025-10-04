import { exportToCSV, clearBets } from './bets.js';
import { API_BASE_URL } from './config.js';

async function fetchProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load profile');
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching profile:', err.message);
    return null;
  }
}

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
  let user = null;
  try {
    user = await fetchProfile();
  } catch {}
  if (usernameDisplay && user?.username) {
    usernameDisplay.textContent = `Logged in as ${user.username}`;
    usernameDisplay.style.display = 'block';
  }
  if (clearLink && user) clearLink.style.display = 'block';

  // Toggle auth buttons in Settings explicitly (in case global UI didn't yet)
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signupBtn) signupBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

});
