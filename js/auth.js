import { API_BASE_URL } from './config.js';

async function getCurrentUser() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Simple auth state handling for UI
export async function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addBetBtn = document.getElementById('add-bet-btn');
  const signInBtn = document.getElementById('sign-in-btn');

  const user = await getCurrentUser();
  const isLoggedIn = Boolean(user);

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.addEventListener(
        'click',
        async () => {
          try {
            await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
          } catch {}
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
      signInBtn.addEventListener('click', () => {
        if (typeof window.saveFormData === 'function') {
          window.saveFormData();
        }
      }, { once: true });
    }
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
window.addEventListener('shared:loaded', updateAuthUI);
