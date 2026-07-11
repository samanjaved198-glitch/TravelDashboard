/* =====================================================================
   notifications.js — activity/notification feed, persisted in
   localStorage. Auto-captures success toasts (wishlist, bookings,
   settings, etc.) so the feed stays populated without extra wiring.
===================================================================== */

const Notifications = (function () {
  const STORAGE_KEY = 'wanderly_activity';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function pickIcon(message) {
    const m = message.toLowerCase();
    if (m.includes('wishlist')) return '❤️';
    if (m.includes('book')) return '🧳';
    if (m.includes('setting')) return '⚙️';
    if (m.includes('subscribe')) return '✉️';
    if (m.includes('remov') || m.includes('delet') || m.includes('cancel')) return '🗑️';
    return '🔔';
  }

  function timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  /** Adds a new notification to the top of the feed. */
  function log(message, icon) {
    const list = getAll();
    list.unshift({
      id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      icon: icon || pickIcon(message),
      message: message,
      time: Date.now(),
      read: false
    });
    save(list.slice(0, 40)); // cap history
    renderAll();
    window.updateBadgeCounts && window.updateBadgeCounts();
  }

  function markAllRead() {
    const list = getAll().map(n => ({ ...n, read: true }));
    save(list);
    renderAll();
    window.updateBadgeCounts && window.updateBadgeCounts();
  }

  function clearAll() {
    save([]);
    renderAll();
    window.updateBadgeCounts && window.updateBadgeCounts();
  }

  function itemHTML(n) {
    return `
    <div class="activity-item${n.read ? '' : ' unread'}" data-nid="${n.id}">
      <div class="ico">${n.icon}</div>
      <div class="content">
        <p>${n.message}</p>
        <span class="time">${timeAgo(n.time)}</span>
      </div>
    </div>`;
  }

  function renderInto(containerId, limit) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let list = getAll();
    if (limit) list = list.slice(0, limit);
    if (!list.length) {
      el.innerHTML = `<div class="empty-state"><div class="ico">🔔</div><p>No notifications yet.</p></div>`;
      return;
    }
    el.innerHTML = list.map(itemHTML).join('');
  }

  function renderAll() {
    renderInto('notifications-list');
    renderInto('activity-list', 6);
  }

  function seedIfEmpty() {
    if (getAll().length) return;
    const now = Date.now();
    const seeds = [
      { message: 'Welcome to Wanderly! Start by exploring destinations.', icon: '👋', read: false },
      { message: 'Your profile is 80% complete — add a payment method.', icon: '⚙️', read: true },
      { message: 'Prices for Dubai just dropped 10% this week.', icon: '💰', read: true }
    ];
    const list = seeds.map((s, i) => ({
      id: 'seed' + i,
      icon: s.icon,
      message: s.message,
      time: now - (i + 1) * 3600000,
      read: s.read
    }));
    save(list);
  }

  function init() {
    seedIfEmpty();
    renderAll();

    const markBtn = document.getElementById('notif-mark-read');
    if (markBtn) markBtn.addEventListener('click', markAllRead);

    const clearBtn = document.getElementById('notif-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearAll);
  }

  return { getAll, log, markAllRead, clearAll, renderAll, init };
})();

window.Notifications = Notifications;