// Simple auth state handling for UI
function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addBetBtn = document.getElementById('add-bet-btn');
  const signInBtn = document.getElementById('sign-in-btn');

  const token = localStorage.getItem('token');
  const isLoggedIn = Boolean(token);

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.addEventListener(
        'click',
        () => {
          localStorage.removeItem('token');
          window.location.href = '/index.html';
        },
        { once: true }
      );
    }
    if (addBetBtn) addBetBtn.style.display = 'inline-block';
    if (signInBtn) signInBtn.style.display = 'none';
  } else {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (addBetBtn) addBetBtn.style.display = 'none';
    if (signInBtn) {
      signInBtn.style.display = 'inline-block';
      signInBtn.addEventListener('click', () => {
        if (typeof window.saveFormData === 'function') {
          window.saveFormData();
        }
      }, { once: true });
    }
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
