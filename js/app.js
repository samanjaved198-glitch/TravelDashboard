/* =====================================================================
   app.js — page loader, navbar, scroll fx, counters, FAQ, reviews
   slider, toasts, weather/currency/tips widgets, dashboard view switch
===================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initPageLoader();
  initNavbar();
  initScrollProgress();
  initBackToTop();
  initCounters();
  initFAQ();
  initReviewsSlider();
  initNewsletterForm();
  initHeroSearchForm();
  initDashboardShell();
  initWeatherWidget();
  initCurrencyConverter();
  initTravelTips();

  // Data-driven sections (guarded internally if elements are absent).
  if (window.WanderlySearch) window.WanderlySearch.initDestinationSearch();
  if (window.WanderlySearch) window.WanderlySearch.renderGallery('gallery-grid');
  if (window.Wishlist) window.Wishlist.renderWishlistView();
  if (window.Wishlist && window.Wishlist.initCustomForm) window.Wishlist.initCustomForm();
  if (window.Notifications) window.Notifications.init();
  if (window.Booking) window.Booking.init();

  updateBadgeCounts();
});

/* ===================== BADGE COUNTS (wishlist + notifications) ===================== */
function updateBadgeCounts() {
  const wishlistCount = window.Wishlist
    ? window.Wishlist.getAll().length + window.Wishlist.getAllCustom().length
    : 0;

  let unreadCount = 0;
  try {
    const list = JSON.parse(localStorage.getItem('wanderly_activity')) || [];
    unreadCount = list.filter(n => !n.read).length;
  } catch (e) {}

  document.querySelectorAll('#nav-wishlist-badge, #topbar-wishlist-badge').forEach(el => el.textContent = wishlistCount);
  document.querySelectorAll('#nav-notif-badge, #notif-count').forEach(el => el.textContent = unreadCount);

  // Hide a badge entirely when its count is zero, so the icon isn't cluttered.
  document.querySelectorAll('#nav-wishlist-badge, #topbar-wishlist-badge').forEach(el => el.classList.toggle('hidden', wishlistCount === 0));
  document.querySelectorAll('#nav-notif-badge, #notif-count').forEach(el => el.classList.toggle('hidden', unreadCount === 0));
}
window.updateBadgeCounts = updateBadgeCounts;

/* ===================== PAGE LOADER ===================== */
function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  window.addEventListener('load', function () {
    setTimeout(() => loader.classList.add('hidden'), 350);
  });
  // Fallback in case 'load' already fired.
  setTimeout(() => loader.classList.add('hidden'), 1500);
}

/* ===================== NAVBAR (mobile menu) ===================== */
function initNavbar() {
  const hamburger = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (hamburger && menu) {
    hamburger.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }
  initNavActiveState();
}

/* ===================== NAV ACTIVE LINK (click + scroll-spy) ===================== */
function initNavActiveState() {
  const desktopLinks = document.querySelectorAll('.nav-links a');
  const mobileLinks = document.querySelectorAll('.mobile-menu a');
  if (!desktopLinks.length) return;

  function setActive(hash) {
    desktopLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
    mobileLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
  }

  // Clicking a link makes it active immediately.
  [...desktopLinks, ...mobileLinks].forEach(a => {
    a.addEventListener('click', () => setActive(a.getAttribute('href')));
  });

  // Scroll-spy: highlight the link for whichever section is in view.
  const sectionLinks = [...desktopLinks].filter(a => (a.getAttribute('href') || '').startsWith('#'));
  const sections = sectionLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive('#' + entry.target.id);
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(sec => observer.observe(sec));

  // Back at the very top of the page, Home is active.
  window.addEventListener('scroll', () => {
    if (window.scrollY < 80) setActive('index.html');
  });
}

/* ===================== SCROLL PROGRESS BAR ===================== */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    const scrollable = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + '%';
  });
}

/* ===================== BACK TO TOP ===================== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('show', window.scrollY > 420);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ===================== COUNTER ANIMATION ===================== */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + (progress === 1 ? '+' : '');
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ===================== FAQ ACCORDION ===================== */
function initFAQ() {
  document.querySelectorAll('.faq-item .faq-q').forEach(btn => {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ===================== REVIEWS SLIDER (auto + manual) ===================== */
function initReviewsSlider() {
  const slides = document.querySelectorAll('.review-slide');
  const dotsWrap = document.getElementById('reviews-dots');
  if (!slides.length || !dotsWrap) return;

  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('button');

  function goTo(i) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = i;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    resetTimer();
  }

  function next() { goTo((current + 1) % slides.length); }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5500);
  }

  resetTimer();
}

/* ===================== NEWSLETTER FORM ===================== */
function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!Validate.email(input.value)) {
      window.showToast('Please enter a valid email', 'error');
      return;
    }
    window.showToast('Subscribed! Watch your inbox ✉️', 'success');
    form.reset();
  });
}

/* ===================== HERO SEARCH FORM ===================== */
function initHeroSearchForm() {
  const form = document.getElementById('hero-search-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const where = document.getElementById('s-where').value.trim();
    document.getElementById('dest-search').value = where;
    document.getElementById('destinations-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.WanderlySearch) {
      window.WanderlySearch.renderDestinations(window.WanderlySearch.filterDestinations(), 'destinations-grid');
    }
  });
}

/* ===================== TOASTS ===================== */
function showToast(message, type) {
  const stack = document.getElementById('toast-stack');
  if (stack) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Every success toast doubles as an activity/notification entry,
  // so wishlist adds, bookings, settings saves, etc. all show up
  // automatically in the Notifications feed without extra wiring.
  if (type === 'success' && window.Notifications) {
    window.Notifications.log(message);
  }
}
window.showToast = showToast;

/* ===================== DASHBOARD SHELL: sidebar + view switching ===================== */
function initDashboardShell() {
  const sideNav = document.getElementById('side-nav');
  if (!sideNav) return;

  const links = sideNav.querySelectorAll('a[data-view]');
  const views = document.querySelectorAll('.view');
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  function showView(name) {
    views.forEach(v => v.classList.toggle('hidden', v.id !== 'view-' + name));
    links.forEach(l => l.classList.toggle('active', l.dataset.view === name));
    if (sidebar) sidebar.classList.remove('open');
    if (name === 'wishlist' && window.Wishlist) window.Wishlist.renderWishlistView();
    if (name === 'bookings' && window.Booking) window.Booking.renderAll();
    if (name === 'notifications' && window.Notifications) {
      window.Notifications.renderAll();
      // Give the user a moment to see what's unread, then clear the badge.
      setTimeout(() => window.Notifications.markAllRead(), 1000);
    }
  }

  links.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      showView(link.dataset.view);
    });
  });

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  const topbarWishlistBtn = document.getElementById('topbar-wishlist-btn');
  if (topbarWishlistBtn) topbarWishlistBtn.addEventListener('click', () => showView('wishlist'));
  const topbarNotifBtn = document.getElementById('topbar-notif-btn');
  if (topbarNotifBtn) topbarNotifBtn.addEventListener('click', () => showView('notifications'));

  const initial = (window.location.hash || '#dashboard').replace('#', '');
  showView(document.getElementById('view-' + initial) ? initial : 'dashboard');

  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => window.showToast('Settings saved ✅', 'success'));
  }
  const notifToggle = document.getElementById('notif-toggle');
  if (notifToggle) {
    notifToggle.addEventListener('click', () => notifToggle.classList.toggle('active'));
  }
}

/* ===================== WEATHER WIDGET (simulated) ===================== */
function initWeatherWidget() {
  const tempEl = document.getElementById('weather-temp');
  if (!tempEl) return;
  const conditions = [
    { loc: 'Karachi, PK', temp: 33, wind: 16, humidity: 61 },
    { loc: 'Dubai, UAE', temp: 39, wind: 10, humidity: 44 },
    { loc: 'Paris, FR', temp: 22, wind: 12, humidity: 55 },
    { loc: 'Kyoto, JP', temp: 27, wind: 8, humidity: 68 }
  ];
  const pick = conditions[Math.floor(Math.random() * conditions.length)];
  document.getElementById('weather-loc').textContent = pick.loc;
  tempEl.textContent = pick.temp + '°C';
  document.getElementById('weather-wind').textContent = pick.wind + ' km/h';
  document.getElementById('weather-humidity').textContent = pick.humidity + '%';
}

/* ===================== CURRENCY CONVERTER (fixed sample rates) ===================== */
function initCurrencyConverter() {
  const amountEl = document.getElementById('cur-amount');
  if (!amountEl) return;
  const fromEl = document.getElementById('cur-from');
  const toEl = document.getElementById('cur-to');
  const resultEl = document.getElementById('cur-result');
  const swapBtn = document.getElementById('cur-swap');

  // Approximate sample rates relative to USD (for demo purposes only).
  const rates = { USD: 1, EUR: 0.92, GBP: 0.79, PKR: 278, AED: 3.67, JPY: 157 };

  function convert() {
    const amount = parseFloat(amountEl.value) || 0;
    const from = fromEl.value, to = toEl.value;
    const usd = amount / rates[from];
    const converted = usd * rates[to];
    resultEl.textContent = `${amount.toLocaleString()} ${from} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`;
  }

  [amountEl, fromEl, toEl].forEach(el => el.addEventListener('input', convert));
  swapBtn.addEventListener('click', () => {
    const tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    convert();
  });

  convert();
}

/* ===================== TRAVEL TIPS ===================== */
function initTravelTips() {
  const box = document.getElementById('tip-box');
  if (!box) return;
  const tips = [
    'Book flights on Tuesday afternoons for some of the lowest fares.',
    'Pack a portable charger — airport outlets are often in short supply.',
    'Photograph your passport and tickets, and email copies to yourself.',
    'Learn 5 basic phrases in the local language — it goes a long way.',
    'Roll clothes instead of folding to save up to 30% suitcase space.',
    'Arrive at the airport 3 hours early for international flights.',
    'Carry a printed copy of hotel bookings in case of no signal.',
    'Notify your bank before traveling to avoid card freezes abroad.'
  ];
  function randomTip() {
    box.textContent = tips[Math.floor(Math.random() * tips.length)];
  }
  randomTip();
  const btn = document.getElementById('tip-refresh');
  if (btn) btn.addEventListener('click', randomTip);
}