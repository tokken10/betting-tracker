import { exportToCSV, clearBets } from './bets.js';
import { decodeToken } from './utils.js';
import { API_BASE_URL } from './config.js';

async function fetchProfile(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load profile');
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching profile:', err.message);
    return null;
  }
}

async function saveOpenAiKey(token, apiKey) {
  const res = await fetch(`${API_BASE_URL}/users/me/openai-key`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ apiKey })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to save key');
  }
}

async function removeOpenAiKey(token) {
  const res = await fetch(`${API_BASE_URL}/users/me/openai-key`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to remove key');
  }
}

function setAiKeyStatus(message, type = 'info') {
  const el = document.getElementById('openai-key-status');
  if (!el) return;
  el.textContent = message;
  el.dataset.state = type;
}

function updateAiKeyUI({ hasKey, setAt }) {
  const removeBtn = document.getElementById('remove-openai-key');
  const input = document.getElementById('openai-key');
  if (!input) return;
  if (hasKey) {
    if (removeBtn) removeBtn.style.display = 'inline-block';
    input.value = '';
    const updated = setAt ? new Date(setAt).toLocaleString() : 'saved';
    setAiKeyStatus(`Key stored securely (${updated}).`, 'success');
  } else {
    if (removeBtn) removeBtn.style.display = 'none';
    setAiKeyStatus('No key on file. Paste your OpenAI key to enable the analyst.', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
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
  const token = localStorage.getItem('token');
  if (usernameDisplay && token) {
    const user = decodeToken(token);
    if (user?.username) {
      usernameDisplay.textContent = `Logged in as ${user.username}`;
      usernameDisplay.style.display = 'block';
    }
  }

  if (clearLink && token) {
    clearLink.style.display = 'block';
  }

  const aiForm = document.getElementById('openai-key-form');
  const input = document.getElementById('openai-key');
  const removeBtn = document.getElementById('remove-openai-key');

  if (aiForm && input) {
    if (!token) {
      input.disabled = true;
      setAiKeyStatus('Log in to manage your AI analyst key.', 'info');
      aiForm.querySelector('button[type="submit"]').disabled = true;
      if (removeBtn) removeBtn.style.display = 'none';
      return;
    }

    fetchProfile(token).then(profile => {
      updateAiKeyUI({ hasKey: Boolean(profile?.aiKeyConfigured), setAt: profile?.aiKeySetAt });
    });

    aiForm.addEventListener('submit', async e => {
      e.preventDefault();
      const apiKey = input.value.trim();
      if (!apiKey) {
        setAiKeyStatus('Enter a valid OpenAI API key (starts with sk-...).', 'error');
        return;
      }
      try {
        setAiKeyStatus('Saving key...', 'info');
        await saveOpenAiKey(token, apiKey);
        updateAiKeyUI({ hasKey: true, setAt: new Date().toISOString() });
      } catch (err) {
        console.error('❌ Error saving OpenAI key:', err.message);
        setAiKeyStatus(err.message, 'error');
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', async () => {
        try {
          setAiKeyStatus('Removing key...', 'info');
          await removeOpenAiKey(token);
          updateAiKeyUI({ hasKey: false });
        } catch (err) {
          console.error('❌ Error removing OpenAI key:', err.message);
          setAiKeyStatus(err.message, 'error');
        }
      });
    }
  }
});
