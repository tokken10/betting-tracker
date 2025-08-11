import { API_BASE_URL } from './config.js';

const API_URL = `${API_BASE_URL}/api/users`;

async function loadUsers() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    const users = await res.json();
    const list = document.getElementById('user-list');
    list.innerHTML = users.map(u => `<li>${u.username}</li>`).join('');
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('shared:loaded', loadUsers);
