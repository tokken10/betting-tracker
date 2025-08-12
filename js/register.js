import { API_BASE_URL } from './config.js';

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Registration failed');

    const data = await res.json();
    localStorage.setItem('token', data.token);
    window.location.href = 'index.html';
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    alert('Registration failed. Please try again.');
  }
});
