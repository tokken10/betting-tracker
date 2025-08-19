import { API_BASE_URL } from './config.js';
import { showLearnMore, closeModal } from './modal.js';

// Ensure shared header links work
window.showLearnMore = showLearnMore;
window.closeModal = closeModal;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.status === 429) {
      alert('Too many login attempts. Please try again later.');
      return;
    }
    if (!res.ok) throw new Error('Login failed');

    const data = await res.json();
    localStorage.setItem('token', data.token);
    window.location.href = 'index.html';
  } catch (err) {
    console.error('❌ Login error:', err.message);
    alert(err.message || 'Login failed. Please check your credentials.');
  }
});
