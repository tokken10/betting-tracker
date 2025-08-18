function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}


function populateProfileHeader(container, username) {
  if (!username) return;
  const profileName = container.querySelector('#profile-username');
  if (profileName) profileName.textContent = username;

  const avatar = container.querySelector('.profile-avatar');
  if (avatar) avatar.textContent = username.slice(0, 2).toUpperCase();
}

async function loadSharedComponents() {
  const includes = {
    header: 'shared/header.html',
    stats: 'shared/stats-bar.html',
    sort: 'shared/sort-controls.html',
    table: 'shared/table.html',
    modal: 'shared/modal.html',
    footer: 'shared/footer.html'
  };

  const loadPromises = Object.entries(includes).map(async ([key, path]) => {
    const target = document.getElementById(`include-${key}`);
    if (!target) return;

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${path} not found`);
      const html = await res.text();
      target.innerHTML = html;

      const user = getUser();

      if (key === 'footer') {
        const desc = target.dataset.description;
        const descEl = target.querySelector('.footer-description');
        if (descEl && desc) descEl.textContent = desc;
      }

      if (key === 'header') {
        const adminLink = target.querySelector('a[href="admin.html"]');
        if (adminLink && user?.role !== 'admin') {
          adminLink.style.display = 'none';
        }

        const navToggle = target.querySelector('.nav-toggle');
        const navLinks = target.querySelector('.nav-links');
        if (navToggle && navLinks) {
          navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
          });
        }
      }

      // Profile-specific behavior
      if (key === 'header' && window.location.pathname.includes('profile.html')) {
        const profileRes = await fetch('shared/profile-header.html');
        if (!profileRes.ok) throw new Error('shared/profile-header.html not found');
        const profileHTML = await profileRes.text();

        const headerContainer = target.querySelector('.header');
        if (headerContainer) {
          headerContainer.insertAdjacentHTML('beforeend', profileHTML);

          if (user?.username) {
            populateProfileHeader(headerContainer, user.username);
          } else {
            const profileContainer = headerContainer.querySelector('.profile-header-container');
            if (profileContainer) {
              profileContainer.innerHTML = '<a href="login.html" class="btn">Sign in to Track</a>';
            }
          }

        }

        // Optionally hide default header title/subtitle
        const title = document.getElementById('page-title');
        const subtitle = document.getElementById('page-subtitle');
        const learnMore = document.getElementById('learn-more-link');
        if (title) title.style.display = 'none';
        if (subtitle) subtitle.style.display = 'none';
        if (learnMore) learnMore.style.display = 'none';
      }
    } catch (err) {
      console.error(`Failed to load ${key}:`, err.message);
      target.innerHTML = `<div style="color: red;">Error loading ${key}</div>`;
    }
  });

  // Wait until all includes are loaded, then dispatch event
  await Promise.all(loadPromises);
  window.dispatchEvent(new Event('shared:loaded'));
}

window.addEventListener('DOMContentLoaded', loadSharedComponents);
