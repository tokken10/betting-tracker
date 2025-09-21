import { API_BASE_URL } from './config.js';
import { escapeHtml } from './utils.js';

const API_URL = `${API_BASE_URL}/users`;

async function loadUsers() {
  const me = window.CURRENT_USER || null;
  if (!me) return (window.location.href = 'login.html');
  if (me.role !== 'admin') return (window.location.href = 'index.html');

  try {
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
