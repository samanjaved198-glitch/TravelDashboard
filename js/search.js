/* =====================================================================
   search.js — destinations data, card rendering, search & filter
===================================================================== */

const DESTINATIONS = [
  { id: 'dubai',       city: 'Dubai',       country: 'UAE',         price: 899,  rating: 4.8, colorA: '#F59E0B', colorB: '#2563EB', tag: 'Skyline & desert',        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdl-HAufV9fuKtt0LToHKDXW_bUh3M0YHPF0dTVfVC9w&s=10' },
  { id: 'turkey',      city: 'Cappadocia',  country: 'Turkey',      price: 749,  rating: 4.7, colorA: '#EF4444', colorB: '#F59E0B', tag: 'Balloons & history',      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbKS6R3McMqMzss2GGerP4k6Gg1nWSEKUrgo1liUb4hA&s=10' },
  { id: 'switzerland', city: 'Interlaken',  country: 'Switzerland', price: 1249, rating: 4.9, colorA: '#2563EB', colorB: '#06B6D4', tag: 'Alps & lakes',            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZv4ez8zUC5AP9ZW9zk_TyazXvPfdtk2XePljE5aPrGw&s=10' },
  { id: 'malaysia',    city: 'Kuala Lumpur',country: 'Malaysia',    price: 679,  rating: 4.6, colorA: '#10B981', colorB: '#06B6D4', tag: 'Towers & rainforest',     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_H7932TBAFV7bIUmlyB_Rd-8CZjt6mGzLQn41xCshVg&s=10' },
  { id: 'japan',       city: 'Kyoto',       country: 'Japan',       price: 1099, rating: 4.9, colorA: '#EC4899', colorB: '#F59E0B', tag: 'Temples & cherry blossom',image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFrlQt6jP8t_F3pIe6DvJ1htPdmLfZLvlU63IidpteUw&s=10' },
  { id: 'paris',       city: 'Paris',       country: 'France',      price: 959,  rating: 4.7, colorA: '#6366F1', colorB: '#EC4899', tag: 'Art & landmarks',         image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQi4PIx9zv8Xg0Buv77deSr57IQrgHk7YLOLaH7CNqJWQ&s=10' }
];

/** Deterministic pseudo-random building heights so each skyline looks distinct.
    Kept as a fallback graphic in case a destination's image fails to load. */
function skylineHeights(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  const bars = 9;
  const heights = [];
  for (let i = 0; i < bars; i++) {
    h = (h * 1103515245 + 12345) % 2147483648;
    heights.push(40 + (h % 130));
  }
  return heights;
}

function skylineSVG(dest) {
  const heights = skylineHeights(dest.id);
  const barWidth = 400 / heights.length;
  const bars = heights.map((hgt, i) => {
    const x = i * barWidth;
    const y = 190 - hgt;
    return `<rect x="${x + 3}" y="${y}" width="${barWidth - 6}" height="${hgt}" rx="3" fill="rgba(255,255,255,0.85)"/>`;
  }).join('');

  return `
  <svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-${dest.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${dest.colorA}"/>
        <stop offset="100%" stop-color="${dest.colorB}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="190" fill="url(#grad-${dest.id})"/>
    <circle cx="340" cy="46" r="22" fill="rgba(255,255,255,0.35)"/>
    ${bars}
  </svg>`;
}

function destCardHTML(dest, isWishlisted) {
  // The gradient sits behind the photo as a fallback background while the
  // image loads, and as a graceful fallback if the image URL ever fails.
  return `
  <article class="dest-card" data-id="${dest.id}">
    <div class="skyline" style="position:relative; overflow:hidden; background:linear-gradient(135deg, ${dest.colorA}, ${dest.colorB});">
      <img
        src="${dest.image}"
        alt="${dest.city}, ${dest.country}"
        loading="lazy"
        style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      >
      <div style="display:none; position:absolute; inset:0;">${skylineSVG(dest)}</div>
      <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%); pointer-events:none;"></div>
      <span class="rating-badge">★ ${dest.rating}</span>
      <button class="fav-btn ${isWishlisted ? 'active' : ''}" data-fav="${dest.id}" aria-label="Save to wishlist">${isWishlisted ? '❤️' : '🤍'}</button>
    </div>
    <div class="body">
      <div class="country">${dest.country}</div>
      <h3>${dest.city}</h3>
      <p style="color:var(--text-muted); font-size:0.85rem;">${dest.tag}</p>
      <div class="price-row">
        <div class="price">$${dest.price}<small> / person</small></div>
        <button class="btn btn-primary btn-sm" data-book="${dest.id}">Book Now</button>
      </div>
    </div>
  </article>`;
}

function renderDestinations(list, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const wishlist = window.Wishlist ? window.Wishlist.getAll() : [];
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">🧭</div><p>No destinations match your search.</p></div>`;
    return;
  }
  el.innerHTML = list.map(d => destCardHTML(d, wishlist.includes(d.id))).join('');
}

function filterDestinations() {
  const q = (document.getElementById('dest-search') || {}).value || '';
  const country = (document.getElementById('dest-filter-country') || {}).value || '';
  const priceBand = (document.getElementById('dest-filter-price') || {}).value || '';
  const minRating = (document.getElementById('dest-filter-rating') || {}).value || '';

  return DESTINATIONS.filter(d => {
    const matchesQuery = !q || d.city.toLowerCase().includes(q.toLowerCase()) || d.country.toLowerCase().includes(q.toLowerCase());
    const matchesCountry = !country || d.country === country;
    let matchesPrice = true;
    if (priceBand === 'low') matchesPrice = d.price < 700;
    if (priceBand === 'mid') matchesPrice = d.price >= 700 && d.price <= 1000;
    if (priceBand === 'high') matchesPrice = d.price > 1000;
    const matchesRating = !minRating || d.rating >= parseFloat(minRating);
    return matchesQuery && matchesCountry && matchesPrice && matchesRating;
  });
}

function populateCountryFilter() {
  const sel = document.getElementById('dest-filter-country');
  if (!sel) return;
  const countries = [...new Set(DESTINATIONS.map(d => d.country))];
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function initDestinationSearch() {
  if (!document.getElementById('destinations-grid')) return;
  populateCountryFilter();
  renderDestinations(DESTINATIONS, 'destinations-grid');

  ['dest-search', 'dest-filter-country', 'dest-filter-price', 'dest-filter-rating'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => renderDestinations(filterDestinations(), 'destinations-grid'));
  });

  document.getElementById('destinations-grid').addEventListener('click', handleDestinationCardClick);
}

function handleDestinationCardClick(e) {
  const favBtn = e.target.closest('[data-fav]');
  if (favBtn) {
    const id = favBtn.dataset.fav;
    const dest = DESTINATIONS.find(d => d.id === id);
    window.Wishlist.toggle(dest);
    return;
  }
  const bookBtn = e.target.closest('[data-book]');
  if (bookBtn) {
    window.showToast && window.showToast(`Redirecting to book ${bookBtn.closest('.dest-card').querySelector('h3').textContent}...`, 'success');
    setTimeout(() => { window.location.href = 'dashboard.html#bookings'; }, 700);
  }
}

// Renders the destination gallery used on the dashboard.
function renderGallery(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const wishlist = window.Wishlist ? window.Wishlist.getAll() : [];
  el.innerHTML = DESTINATIONS.map(d => destCardHTML(d, wishlist.includes(d.id))).join('');
  el.addEventListener('click', handleDestinationCardClick);
}

window.WanderlySearch = { DESTINATIONS, renderDestinations, filterDestinations, initDestinationSearch, renderGallery, destCardHTML };