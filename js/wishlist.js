/* =====================================================================
   wishlist.js — heart-to-save wishlist, persisted in localStorage.
   Also supports user-added custom destinations (not in the built-in
   DESTINATIONS catalog), stored separately and merged for display.
===================================================================== */

const Wishlist = (function () {
  const STORAGE_KEY = 'wanderly_wishlist';          // built-in destination ids
  const CUSTOM_KEY = 'wanderly_wishlist_custom';    // user-added destinations

  const PALETTES = [
    ['#6366F1', '#EC4899'], ['#10B981', '#06B6D4'], ['#F59E0B', '#EF4444'],
    ['#2563EB', '#06B6D4'], ['#EC4899', '#F59E0B'], ['#8B5CF6', '#6366F1']
  ];

  /* ---------------- built-in (catalog) wishlist ---------------- */

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  function has(id) {
    return getAll().includes(id);
  }

  function toggle(dest) {
    const ids = getAll();
    const idx = ids.indexOf(dest.id);
    if (idx > -1) {
      ids.splice(idx, 1);
      save(ids);
      window.showToast && window.showToast(`${dest.city} removed from wishlist`, 'success');
    } else {
      ids.push(dest.id);
      save(ids);
      window.showToast && window.showToast(`${dest.city} added to wishlist ❤️`, 'success');
    }
    refreshAllViews();
    return ids.includes(dest.id);
  }

  /* ---------------- custom (user-added) wishlist ---------------- */

  function getAllCustom() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCustom(list) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  }

  function randomPalette() {
    return PALETTES[Math.floor(Math.random() * PALETTES.length)];
  }

  function addCustom({ city, country, price, tag }) {
    const [colorA, colorB] = randomPalette();
    const item = {
      id: 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      city: city,
      country: country || '',
      price: parseFloat(price) || 0,
      tag: tag || 'Added by you',
      colorA, colorB
    };
    const list = getAllCustom();
    list.push(item);
    saveCustom(list);
    window.showToast && window.showToast(`${city} added to wishlist ❤️`, 'success');
    refreshAllViews();
    return item;
  }

  function removeCustom(id) {
    const item = getAllCustom().find(i => i.id === id);
    const list = getAllCustom().filter(i => i.id !== id);
    saveCustom(list);
    window.showToast && window.showToast(`${item ? item.city : 'Destination'} removed from wishlist`, 'success');
    refreshAllViews();
  }

  function customCardHTML(item) {
    const initials = item.city.trim().slice(0, 2).toUpperCase();
    return `
    <article class="dest-card" data-id="${item.id}">
      <div class="skyline" style="background:linear-gradient(135deg, ${item.colorA}, ${item.colorB}); display:flex; align-items:center; justify-content:center;">
        <span style="font-size:2.4rem; font-weight:700; color:rgba(255,255,255,0.85); letter-spacing:1px;">${initials}</span>
        <span class="rating-badge">✎ Custom</span>
        <button class="fav-btn active" data-remove-custom="${item.id}" aria-label="Remove from wishlist">🗑️</button>
      </div>
      <div class="body">
        <div class="country">${item.country}</div>
        <h3>${item.city}</h3>
        <p style="color:var(--text-muted); font-size:0.85rem;">${item.tag}</p>
        <div class="price-row">
          <div class="price">$${item.price.toLocaleString()}<small> / person</small></div>
        </div>
      </div>
    </article>`;
  }

  /* ---------------- shared rendering ---------------- */

  /** Re-renders any wishlist-aware UI currently on the page. */
  function refreshAllViews() {
    if (!window.WanderlySearch) return;
    const grid = document.getElementById('destinations-grid');
    if (grid) window.WanderlySearch.renderDestinations(window.WanderlySearch.filterDestinations(), 'destinations-grid');

    const gallery = document.getElementById('gallery-grid');
    if (gallery) window.WanderlySearch.renderGallery('gallery-grid');

    const wishGrid = document.getElementById('wishlist-grid');
    if (wishGrid) renderWishlistView();

    const statEl = document.getElementById('stat-wishlist');
    if (statEl) statEl.textContent = getAll().length + getAllCustom().length;

    window.updateBadgeCounts && window.updateBadgeCounts();
  }

  function renderWishlistView() {
    const el = document.getElementById('wishlist-grid');
    const empty = document.getElementById('wishlist-empty');
    if (!el || !window.WanderlySearch) return;

    const ids = getAll();
    const builtIn = window.WanderlySearch.DESTINATIONS.filter(d => ids.includes(d.id));
    const custom = getAllCustom();

    const html = builtIn.map(d => window.WanderlySearch.destCardHTML(d, true)).join('')
               + custom.map(customCardHTML).join('');

    el.innerHTML = html;
    const total = builtIn.length + custom.length;
    el.classList.toggle('hidden', total === 0);
    if (empty) empty.classList.toggle('hidden', total > 0);

    el.removeEventListener('click', wishlistClickHandler);
    el.addEventListener('click', wishlistClickHandler);
  }

  function wishlistClickHandler(e) {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const id = favBtn.dataset.fav;
      const dest = window.WanderlySearch.DESTINATIONS.find(d => d.id === id);
      if (dest) toggle(dest);
      return;
    }
    const removeBtn = e.target.closest('[data-remove-custom]');
    if (removeBtn) {
      removeCustom(removeBtn.dataset.removeCustom);
    }
  }

  /* ---------------- "Add to Wishlist" modal form ---------------- */

  function initCustomForm() {
    const openBtn = document.getElementById('add-wishlist-btn');
    const modal = document.getElementById('wishlist-modal');
    const form = document.getElementById('wishlist-form');
    const cancelBtn = document.getElementById('wishlist-cancel-btn');
    if (!openBtn || !modal || !form) return;

    function open() {
      modal.classList.add('active');
      modal.style.display = 'flex';
      const cityInput = document.getElementById('w-city');
      if (cityInput) cityInput.focus();
    }

    function close() {
      modal.classList.remove('active');
      modal.style.display = 'none';
      form.reset();
      const cityGroup = document.getElementById('w-city').closest('.form-group');
      if (cityGroup) cityGroup.classList.remove('invalid');
    }

    openBtn.addEventListener('click', open);
    cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const city = document.getElementById('w-city').value.trim();
      const country = document.getElementById('w-country').value.trim();
      const price = document.getElementById('w-price').value;
      const tag = document.getElementById('w-tag').value.trim();
      const cityGroup = document.getElementById('w-city').closest('.form-group');

      if (!city) {
        cityGroup.classList.add('invalid');
        return;
      }
      cityGroup.classList.remove('invalid');

      addCustom({ city, country, price, tag });
      close();
    });
  }

  return {
    getAll, has, toggle, refreshAllViews, renderWishlistView,
    getAllCustom, addCustom, removeCustom, initCustomForm
  };
})();

window.Wishlist = Wishlist;