import { API_BASE_URL } from './config.js';

async function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addBetBtn = document.getElementById('add-bet-btn');
  const signInBtn = document.getElementById('sign-in-btn');

  let isLoggedIn = false;
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    isLoggedIn = res.ok;
  } catch {}

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.addEventListener(
        'click',
        async () => {
          await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
          window.location.href = '/index.html';
        },
        { once: true }
      );
    }
    if (addBetBtn) addBetBtn.style.display = 'inline-block';
    if (signInBtn) signInBtn.style.display = 'none';
  } else {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (addBetBtn) addBetBtn.style.display = 'none';
    if (signInBtn) {
      signInBtn.style.display = 'inline-block';
      signInBtn.addEventListener(
        'click',
        () => {
          if (typeof window.saveFormData === 'function') {
            window.saveFormData();
          }
        },
        { once: true }
      );
    }
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
