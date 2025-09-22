import { exportToCSV, clearBets } from './bets.js';
import { API_BASE_URL } from './config.js';

async function fetchProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load profile');
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching profile:', err.message);
    return null;
  }
}

async function saveOpenAiKey(apiKey) {
  const res = await fetch(`${API_BASE_URL}/users/me/openai-key`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to save key');
  }
}

async function removeOpenAiKey() {
  const res = await fetch(`${API_BASE_URL}/users/me/openai-key`, {
    method: 'DELETE',
    credentials: 'include',
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

document.addEventListener('DOMContentLoaded', async () => {
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
  let user = null;
  try {
    user = await fetchProfile();
  } catch {}
  if (usernameDisplay && user?.username) {
    usernameDisplay.textContent = `Logged in as ${user.username}`;
    usernameDisplay.style.display = 'block';
  }
  if (clearLink && user) clearLink.style.display = 'block';

  // Toggle auth buttons in Settings explicitly (in case global UI didn't yet)
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signupBtn) signupBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  const aiForm = document.getElementById('openai-key-form');
  const input = document.getElementById('openai-key');
  const removeBtn = document.getElementById('remove-openai-key');

  if (aiForm && input) {
    if (!user) {
      input.disabled = true;
      setAiKeyStatus('Log in to manage your AI analyst key.', 'info');
      aiForm.querySelector('button[type="submit"]').disabled = true;
      if (removeBtn) removeBtn.style.display = 'none';
      return;
    }

    // Prefer server-managed flag from AI context (local API),
    // since /users may be served by an external backend without this field.
    let managed = Boolean(user?.aiKeyManaged);
    try {
      const ctxRes = await fetch(`${API_BASE_URL}/ai/context`, { credentials: 'include' });
      if (ctxRes.ok) {
        const ctx = await ctxRes.json();
        if (typeof ctx.aiKeyManaged === 'boolean') managed = ctx.aiKeyManaged;
      }
    } catch {}

    // If admin manages the key, disable personal key UI and show status
    if (managed) {
      if (input) input.disabled = true;
      const submitBtn = aiForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (removeBtn) removeBtn.style.display = 'none';
      setAiKeyStatus('The OpenAI API key is managed by the site admin. The analyst is enabled for all users.', 'success');
      return;
    }

    updateAiKeyUI({ hasKey: Boolean(user?.aiKeyConfigured), setAt: user?.aiKeySetAt });

    aiForm.addEventListener('submit', async e => {
      e.preventDefault();
      const apiKey = input.value.trim();
      if (!apiKey) {
        setAiKeyStatus('Enter a valid OpenAI API key (starts with sk-...).', 'error');
        return;
      }
      try {
        setAiKeyStatus('Saving key...', 'info');
        await saveOpenAiKey(apiKey);
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
          await removeOpenAiKey();
          updateAiKeyUI({ hasKey: false });
        } catch (err) {
          console.error('❌ Error removing OpenAI key:', err.message);
          setAiKeyStatus(err.message, 'error');
        }
      });
    }
  }
});
