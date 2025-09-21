import { API_BASE_URL } from './config.js';
import { showLearnMore, closeModal } from './modal.js';

// Ensure shared header links work
window.showLearnMore = showLearnMore;
window.closeModal = closeModal;

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordPattern.test(password)) {
    alert(
      'Password must be at least 8 characters and include uppercase, lowercase, number and special character.'
    );
    return;
  }
  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Registration failed');

    await res.json().catch(() => ({}));
    window.location.href = 'index.html';
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    alert(err.message || 'Registration failed. Please try again.');
  }
});
