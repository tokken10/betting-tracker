import { API_BASE_URL } from './config.js';
import { decodeToken } from './utils.js';

const API_URL = `${API_BASE_URL}/users`;

async function loadUsers() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const user = decodeToken(token);
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    const users = await res.json();
    const list = document.getElementById('user-list');
    list.innerHTML = users.map(u => `<li>${u.username}</li>`).join('');
    document.getElementById('user-count-header').textContent = `Total Users: ${users.length}`;
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('shared:loaded', loadUsers);
