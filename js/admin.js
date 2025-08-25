import { API_BASE_URL } from './config.js';
import { escapeHtml } from './utils.js';

const API_URL = `${API_BASE_URL}/users`;

async function loadUsers() {
  try {
    const meRes = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    if (!meRes.ok) {
      window.location.href = 'login.html';
      return;
    }
    const currentUser = await meRes.json();
    if (currentUser.role !== 'admin') {
      window.location.href = 'index.html';
      return;
    }

    const res = await fetch(API_URL, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch users');
    const users = await res.json();
    const list = document.getElementById('user-list');
    list.innerHTML = users.map(u => `<li>${escapeHtml(u.username)}</li>`).join('');
    document.getElementById('user-count-header').textContent = `Total Users: ${users.length}`;
  } catch (err) {
    console.error(err);
    alert(err.message || 'Failed to load users');
  }
}

window.addEventListener('shared:loaded', loadUsers);
