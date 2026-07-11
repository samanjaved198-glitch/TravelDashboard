/* =====================================================================
   darkmode.js — theme toggle + localStorage persistence
   Runs immediately (before DOMContentLoaded) to avoid a flash of
   the wrong theme on page load.
===================================================================== */

(function () {
  const STORAGE_KEY = 'wanderly_theme';

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-pending');
      document.body && document.body.classList.add('dark');
    } else {
      document.body && document.body.classList.remove('dark');
    }
  }

  // Apply saved theme as early as possible.
  const saved = localStorage.getItem(STORAGE_KEY) || 'light';
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(saved);
    wireToggles();
  });

  function currentTheme() {
    return document.body.classList.contains('dark') ? 'dark' : 'light';
  }

  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    window.showToast && window.showToast(
      next === 'dark' ? 'Dark mode on 🌙' : 'Light mode on ☀️',
      'success'
    );
  }

  function wireToggles() {
    // Every element used as a dark-mode switch across pages.
    const ids = ['dark-toggle', 'dark-toggle-settings'];
    ids.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', toggleTheme);
    });
  }

  window.WanderlyTheme = { toggle: toggleTheme, current: currentTheme };
})();
