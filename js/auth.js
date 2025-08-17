// Simple auth state handling for UI
function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addBetBtn = document.getElementById('add-bet-btn');
  const signInBtn = document.getElementById('sign-in-btn');
  const storageMsg = document.getElementById('storage-msg');

  const token = localStorage.getItem('token');
  const isLoggedIn = Boolean(token);

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        location.reload();
      }, { once: true });
    }
    if (addBetBtn) addBetBtn.style.display = 'inline-block';
    if (signInBtn) signInBtn.style.display = 'none';
    if (storageMsg) storageMsg.textContent = 'Your data is synced to your account and accessible on any device.';
  } else {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (addBetBtn) addBetBtn.style.display = 'inline-block';
    if (signInBtn) signInBtn.style.display = 'inline-block';
    if (storageMsg) storageMsg.textContent = 'Your data is saved locally and will persist between sessions. Sign up to sync across devices.';
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
