/* =====================================================================
   booking.js — booking CRUD (add / edit / delete), localStorage-backed
===================================================================== */

const Booking = (function () {
  const STORAGE_KEY = 'wanderly_bookings';
  let pendingDeleteId = null;

  const SEED = [
    { id: 'bk1', destination: 'Interlaken, Switzerland', date: '2026-08-14', travelers: 2, price: 2498, status: 'confirmed' },
    { id: 'bk2', destination: 'Kyoto, Japan',             date: '2026-09-02', travelers: 1, price: 1099, status: 'pending' },
    { id: 'bk3', destination: 'Cappadocia, Turkey',       date: '2026-05-20', travelers: 4, price: 2996, status: 'cancelled' }
  ];

  function getAll() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data) throw new Error('empty');
      return data;
    } catch (e) {
      save(SEED);
      return SEED;
    }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function add(data) {
    const list = getAll();
    const record = Object.assign({ id: 'bk' + Date.now() }, data);
    list.unshift(record);
    save(list);
    logActivity(`New booking added — ${data.destination}`, '🧳');
    return record;
  }

  function update(id, data) {
    const list = getAll();
    const idx = list.findIndex(b => b.id === id);
    if (idx > -1) {
      list[idx] = Object.assign({}, list[idx], data);
      save(list);
      logActivity(`Booking updated — ${data.destination}`, '✏️');
    }
  }

  function remove(id) {
    const list = getAll();
    const target = list.find(b => b.id === id);
    save(list.filter(b => b.id !== id));
    if (target) logActivity(`Booking deleted — ${target.destination}`, '🗑️');
  }

  /* -------------------- Activity log (simple, capped) -------------------- */
  function logActivity(text, icon) {
    const key = 'wanderly_activity';
    let list = [];
    try { list = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    list.unshift({ text, icon, time: 'Just now' });
    list = list.slice(0, 8);
    localStorage.setItem(key, JSON.stringify(list));
  }
  function getActivity() {
    try { return JSON.parse(localStorage.getItem('wanderly_activity')) || []; } catch (e) { return []; }
  }

  /* -------------------- Rendering -------------------- */
  function rowHTML(b) {
    return `
    <tr data-id="${b.id}">
      <td>${b.destination}</td>
      <td>${formatDate(b.date)}</td>
      <td>${b.travelers}</td>
      <td>$${Number(b.price).toLocaleString()}</td>
      <td><span class="status-pill ${b.status}">${b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span></td>
      <td>
        <div class="row-actions">
          <button data-action="view" title="View">👁️</button>
          <button data-action="edit" title="Edit">✏️</button>
          <button class="del" data-action="delete" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render(tbodyId, list, emptyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const data = list || getAll();
    tbody.innerHTML = data.map(rowHTML).join('');
    if (emptyId) {
      const empty = document.getElementById(emptyId);
      if (empty) empty.classList.toggle('hidden', data.length > 0);
    }
  }

  function renderAll() {
    render('booking-table-body', getAll(), 'booking-empty');
    render('booking-table-body-dash', getAll().slice(0, 4));
    renderStats();
    renderActivity();
    renderPayments();
  }

  function renderStats() {
    const list = getAll();
    const total = list.length;
    const upcoming = list.filter(b => b.status !== 'cancelled' && new Date(b.date) >= new Date(new Date().toDateString())).length;
    const cancelled = list.filter(b => b.status === 'cancelled').length;
    const spending = list.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.price || 0), 0);

    setText('stat-total', total);
    setText('stat-upcoming', upcoming);
    setText('stat-cancelled', cancelled);
    setText('stat-spending', '$' + spending.toLocaleString());
    setText('stat-wishlist', window.Wishlist ? window.Wishlist.getAll().length : 0);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderActivity() {
    const list = getActivity();
    const el = document.getElementById('activity-list');
    if (el) {
      el.innerHTML = list.length ? list.map(activityItemHTML).join('') :
        `<div class="empty-state"><div class="ico">📭</div><p>No activity yet.</p></div>`;
    }
    const notifEl = document.getElementById('notifications-list');
    if (notifEl) {
      notifEl.innerHTML = list.length ? list.map(activityItemHTML).join('') :
        `<div class="empty-state"><div class="ico">🔕</div><p>You're all caught up.</p></div>`;
    }
    window.updateBadgeCounts && window.updateBadgeCounts();
  }

  function activityItemHTML(item) {
    return `
    <div class="activity-item">
      <div class="dot-ico" style="background:var(--primary)">${item.icon}</div>
      <div>
        <div class="txt">${item.text}</div>
        <div class="time">${item.time}</div>
      </div>
    </div>`;
  }

  function renderPayments() {
    const tbody = document.getElementById('payments-table-body');
    if (!tbody) return;
    const list = getAll().filter(b => b.status !== 'pending');
    tbody.innerHTML = list.length ? list.map(b => `
      <tr>
        <td>${b.destination}</td>
        <td>${formatDate(b.date)}</td>
        <td>Card •••• 4291</td>
        <td>$${Number(b.price).toLocaleString()}</td>
        <td><span class="status-pill ${b.status === 'cancelled' ? 'cancelled' : 'confirmed'}">${b.status === 'cancelled' ? 'Refunded' : 'Paid'}</span></td>
      </tr>`).join('') : `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:30px;">No payments yet.</td></tr>`;
  }

  /* -------------------- Modal handling -------------------- */
  function openModal(booking) {
    const modal = document.getElementById('booking-modal');
    if (!modal) return;
    document.getElementById('booking-modal-title').textContent = booking ? 'Edit Booking' : 'Add Booking';
    document.getElementById('booking-id').value = booking ? booking.id : '';
    document.getElementById('b-destination').value = booking ? booking.destination : '';
    document.getElementById('b-date').value = booking ? booking.date : '';
    document.getElementById('b-travelers').value = booking ? booking.travelers : 1;
    document.getElementById('b-price').value = booking ? booking.price : 500;
    document.getElementById('b-status').value = booking ? booking.status : 'confirmed';
    document.querySelectorAll('#booking-form .form-group').forEach(g => g.classList.remove('invalid'));
    modal.classList.add('open');
  }

  function closeModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.remove('open');
  }

  function openConfirm(id) {
    pendingDeleteId = id;
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('open');
  }

  function closeConfirm() {
    pendingDeleteId = null;
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('open');
  }

  /* -------------------- Wiring -------------------- */
  function init() {
    if (!document.getElementById('booking-form')) return;
    renderAll();

    ['add-booking-btn', 'add-booking-btn-dash'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => openModal(null));
    });

    document.getElementById('booking-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('booking-modal').addEventListener('click', e => {
      if (e.target.id === 'booking-modal') closeModal();
    });

    document.getElementById('booking-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const result = window.Validate.validateBookingForm();
      if (!result.valid) {
        window.showToast && window.showToast('Please fix the highlighted fields', 'error');
        return;
      }
      const id = document.getElementById('booking-id').value;
      if (id) {
        update(id, result.data);
        window.showToast && window.showToast('Booking updated ✅', 'success');
      } else {
        add(result.data);
        window.showToast && window.showToast('Booking Successful ✅', 'success');
      }
      closeModal();
      renderAll();
    });

    // Delegate row actions for both table instances.
    ['booking-table-body', 'booking-table-body-dash'].forEach(id => {
      const tbody = document.getElementById(id);
      if (!tbody) return;
      tbody.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const row = btn.closest('tr');
        const bookingId = row.dataset.id;
        const booking = getAll().find(b => b.id === bookingId);
        if (btn.dataset.action === 'edit' || btn.dataset.action === 'view') {
          openModal(booking);
        } else if (btn.dataset.action === 'delete') {
          openConfirm(bookingId);
        }
      });
    });

    document.getElementById('confirm-cancel-btn').addEventListener('click', closeConfirm);
    document.getElementById('confirm-modal').addEventListener('click', e => {
      if (e.target.id === 'confirm-modal') closeConfirm();
    });
    document.getElementById('confirm-delete-btn').addEventListener('click', function () {
      if (pendingDeleteId) {
        remove(pendingDeleteId);
        window.showToast && window.showToast('Deleted Successfully 🗑️', 'success');
        renderAll();
      }
      closeConfirm();
    });

    // Search + status filter on the Bookings view.
    const searchEl = document.getElementById('booking-search');
    const statusEl = document.getElementById('booking-status-filter');
    function applyFilter() {
      const q = (searchEl.value || '').toLowerCase();
      const status = statusEl.value;
      const filtered = getAll().filter(b =>
        (!q || b.destination.toLowerCase().includes(q)) &&
        (!status || b.status === status)
      );
      render('booking-table-body', filtered, 'booking-empty');
    }
    if (searchEl) searchEl.addEventListener('input', applyFilter);
    if (statusEl) statusEl.addEventListener('change', applyFilter);
  }

  return { getAll, add, update, remove, renderAll, init };
})();

window.Booking = Booking;
