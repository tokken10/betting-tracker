// Auth state handling with HTTP-only cookies
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include', // Important for sending cookies
    });
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

async function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addBetBtn = document.getElementById('add-bet-btn');
  const signInBtn = document.getElementById('sign-in-btn');

  try {
    const authData = await checkAuth();
    const isLoggedIn = !!authData?.user;

    if (isLoggedIn) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
        logoutBtn.removeEventListener('click', logout);
        logoutBtn.addEventListener('click', logout, { once: true });
      }
      if (addBetBtn) addBetBtn.style.display = 'inline-block';
      if (signInBtn) signInBtn.style.display = 'none';
    } else {
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
        logoutBtn.removeEventListener('click', logout);
      }
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
  } catch (error) {
    console.error('Error updating auth UI:', error);
  }
}

// Update auth state when page loads
document.addEventListener('DOMContentLoaded', updateAuthUI);
