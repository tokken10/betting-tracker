async function loadSharedComponents() {
  const includes = {
    header: 'shared/header.html',
    stats: 'shared/stats-bar.html',
    sort: 'shared/sort-controls.html',
    table: 'shared/table.html',
    modal: 'shared/modal.html'
  };

  const loadPromises = Object.entries(includes).map(async ([key, path]) => {
    const target = document.getElementById(`include-${key}`);
    if (!target) return;

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${path} not found`);
      const html = await res.text();
      target.innerHTML = html;

      // Profile-specific behavior
      if (key === 'header' && window.location.pathname.includes('profile.html')) {
        const profileRes = await fetch('shared/profile-header.html');
        if (!profileRes.ok) throw new Error('shared/profile-header.html not found');
        const profileHTML = await profileRes.text();

        const headerContainer = target.querySelector('.header');
        if (headerContainer) {
          headerContainer.insertAdjacentHTML('beforeend', profileHTML);
        }

        // Optionally hide default header title/subtitle
        const title = document.getElementById('page-title');
        const subtitle = document.getElementById('page-subtitle');
        if (title) title.style.display = 'none';
        if (subtitle) subtitle.style.display = 'none';
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