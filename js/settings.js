import { exportToCSV, clearBets } from './bets.js';
import { API_BASE_URL } from './config.js';
import { updateAuthUI } from './auth.js';

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
  const usernameSection = document.getElementById('username-section');
  const usernameForm = document.getElementById('username-form');
  const usernameInput = document.getElementById('username-input');
  const usernameMessage = document.getElementById('username-message');
  let user = null;
  try {
    user = await fetchProfile();
  } catch {}
  if (usernameDisplay && user?.username) {
    usernameDisplay.textContent = `Logged in as ${user.username}`;
    usernameDisplay.style.display = 'block';
  }
  if (usernameSection) {
    usernameSection.style.display = user ? 'block' : 'none';
  }
  if (usernameInput && user?.username) {
    usernameInput.value = user.username;
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

  if (usernameForm) {
    usernameForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!usernameInput) return;

      const submitButton = usernameForm.querySelector('button[type="submit"]');
      const newUsername = usernameInput.value.trim();

      if (usernameMessage) {
        usernameMessage.textContent = '';
        usernameMessage.classList.remove('success', 'error');
      }

      if (newUsername.length < 3 || newUsername.length > 30) {
        if (usernameMessage) {
          usernameMessage.textContent = 'Username must be between 3 and 30 characters.';
          usernameMessage.classList.add('error');
        }
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users/me/username`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: newUsername }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (usernameMessage) {
            usernameMessage.textContent = data?.error || 'Unable to update username.';
            usernameMessage.classList.add('error');
          }
          return;
        }

        if (usernameMessage) {
          usernameMessage.textContent = 'Username updated successfully!';
          usernameMessage.classList.add('success');
        }

        if (usernameDisplay && data?.username) {
          usernameDisplay.textContent = `Logged in as ${data.username}`;
          usernameDisplay.style.display = 'block';
        }

        if (usernameInput && data?.username) {
          usernameInput.value = data.username;
        }

        await updateAuthUI();
      } catch (err) {
        console.error('❌ Error updating username:', err);
        if (usernameMessage) {
          usernameMessage.textContent = 'Unexpected error updating username.';
          usernameMessage.classList.add('error');
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  }

});
