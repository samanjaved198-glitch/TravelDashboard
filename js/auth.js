/* =====================================================================
   auth.js — simple client-side auth (localStorage-backed demo)
   Handles: register, login, logout, session, and personalizing the
   navbar / dashboard profile with the signed-in user's name.
===================================================================== */

const Auth = (function () {
  const USERS_KEY = 'wanderly_users';
  const SESSION_KEY = 'wanderly_user';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }

  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  }
  function setCurrentUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function initials(name) {
    return (name || 'Guest').trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
  function firstName(name) {
    return (name || 'Guest').trim().split(/\s+/)[0];
  }

  /** Creates a new account. Does NOT sign the user in — they must sign in next. */
  function register(name, email, password) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    users.push({ name, email, password });
    saveUsers(users);
    return { ok: true };
  }

  /** Verifies credentials and starts a session. */
  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, message: 'Incorrect email or password.' };
    setCurrentUser({ name: user.name, email: user.email });
    return { ok: true };
  }

  /* -------------------- UI: navbar auth area (index.html) -------------------- */
  function authAreaHTML(current) {
    if (current) {
      return `
        <div class="user-chip" id="user-chip" tabindex="0">
          <div class="user-chip-avatar">${initials(current.name)}</div>
          <span class="user-chip-name">${firstName(current.name)}</span>
        </div>`;
    }
    return `
      <a href="auth.html?mode=signin" class="btn btn-ghost btn-sm">Sign In</a>
      <a href="auth.html?mode=signup" class="btn btn-primary btn-sm">Sign Up</a>`;
  }

  function renderNavAuth() {
    const current = getCurrentUser();
    const desktopArea = document.getElementById('nav-auth-area');
    const mobileArea = document.getElementById('mobile-auth-area');
    if (desktopArea) {
      desktopArea.innerHTML = authAreaHTML(current);
      const chip = document.getElementById('user-chip');
      if (chip) chip.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
    }
    if (mobileArea) {
      mobileArea.innerHTML = authAreaHTML(current);
      mobileArea.style.display = 'flex';
      mobileArea.style.width = '100%';
      mobileArea.querySelectorAll('.btn').forEach(b => b.classList.add('btn-block'));
    }
  }

  /* -------------------- UI: dashboard profile personalization -------------------- */
  function renderDashboardProfile() {
    const current = getCurrentUser();
    if (!current) return;

    const nameEl = document.getElementById('dash-user-name');
    const avatarEl = document.getElementById('dash-avatar');
    const welcomeEl = document.getElementById('dash-welcome');
    const setName = document.getElementById('set-name');
    const setEmail = document.getElementById('set-email');

    if (nameEl) nameEl.textContent = firstName(current.name);
    if (avatarEl) avatarEl.textContent = initials(current.name);
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${firstName(current.name)} 👋`;
    if (setName) setName.value = current.name;
    if (setEmail) setEmail.value = current.email;
  }

  function wireLogout() {
    document.querySelectorAll('[data-logout]').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
        window.showToast && window.showToast('Logged out — see you next trip! 👋', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
      });
    });
  }

  /* -------------------- Page: auth.html form wiring -------------------- */
  function initAuthPage() {
    const signinForm = document.getElementById('signin-form');
    if (!signinForm) return; // Not on the auth page.

    const signupForm = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.auth-tab');

    function showTab(mode) {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === mode));
      signinForm.classList.toggle('hidden', mode !== 'signin');
      signupForm.classList.toggle('hidden', mode !== 'signup');
    }

    tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));

    const params = new URLSearchParams(window.location.search);
    showTab(params.get('mode') === 'signup' ? 'signup' : 'signin');

    signinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailEl = document.getElementById('si-email');
      const passEl = document.getElementById('si-password');

      const emailOk = Validate.email(emailEl.value);
      Validate.setFieldState(emailEl, emailOk);
      const passOk = Validate.required(passEl.value);
      Validate.setFieldState(passEl, passOk);
      if (!emailOk || !passOk) {
        window.showToast('Please fix the highlighted fields', 'error');
        return;
      }

      const result = login(emailEl.value.trim(), passEl.value);
      if (!result.ok) {
        window.showToast(result.message, 'error');
        return;
      }
      window.showToast(`Welcome back, ${firstName(getCurrentUser().name)} 👋`, 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    });

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const nameEl = document.getElementById('su-name');
      const emailEl = document.getElementById('su-email');
      const passEl = document.getElementById('su-password');

      const nameOk = Validate.required(nameEl.value);
      Validate.setFieldState(nameEl, nameOk);
      const emailOk = Validate.email(emailEl.value);
      Validate.setFieldState(emailEl, emailOk);
      const passOk = passEl.value.length >= 6;
      Validate.setFieldState(passEl, passOk);
      if (!nameOk || !emailOk || !passOk) {
        window.showToast('Please fix the highlighted fields', 'error');
        return;
      }

      const result = register(nameEl.value.trim(), emailEl.value.trim(), passEl.value);
      if (!result.ok) {
        window.showToast(result.message, 'error');
        return;
      }
      window.showToast(`Account created 🎉 Please sign in, ${firstName(nameEl.value)}`, 'success');

      // Send them to the Sign In tab, with their email pre-filled, instead of logging in automatically.
      const signedUpEmail = emailEl.value.trim();
      signupForm.reset();
      showTab('signin');
      document.getElementById('si-email').value = signedUpEmail;
      document.getElementById('si-password').focus();
    });
  }

  return {
    getCurrentUser, register, login, logout, initials, firstName,
    renderNavAuth, renderDashboardProfile, wireLogout, initAuthPage
  };
})();

window.Auth = Auth;

document.addEventListener('DOMContentLoaded', function () {
  Auth.renderNavAuth();
  Auth.renderDashboardProfile();
  Auth.wireLogout();
  Auth.initAuthPage();
});
