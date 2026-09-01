/* =========================================================================
   APP SHELL — tự chèn thanh điều hướng, nút đổi theme, và cổng đăng nhập
   vào MỌI trang. Muốn đổi menu / thêm trang mới thì chỉ sửa mảng PAGES ở đây.
   ========================================================================= */
(function(){
  "use strict";

  const PAGES = [
    { id:'home',      href:'index.html',      label:'Trang chủ',  icon:'🏠' },
    { id:'calendar',  href:'lich-tuan.html',  label:'Lịch tuần',  icon:'📅' },
    { id:'expenses',  href:'chi-tieu.html',   label:'Chi tiêu',   icon:'💰' },
    { id:'tutoring',  href:'gia-su.html',     label:'Gia sư',     icon:'📒' },
    { id:'goals',     href:'muc-tieu.html',   label:'Mục tiêu',   icon:'🎯' },
    { id:'lists',     href:'danh-sach.html',  label:'Danh sách', icon:'✨' }
  ];

  function getCurrentPage(){
    try {
      return (document.body && document.body.dataset && document.body.dataset.page) || 'home';
    } catch (e) {
      return 'home';
    }
  }

  window.DateUtils = {
    pad(value){
      return String(value).padStart(2, '0');
    },
    parseISO(value){
      if (!value) return null;
      const parts = String(value).split(/[-/]/).map(part => Number(part));
      if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
      const [year, month, day] = parts;
      return new Date(year, month - 1, day);
    },
    formatDate(dateLike){
      const date = dateLike instanceof Date ? new Date(dateLike) : this.parseISO(dateLike) || new Date(dateLike);
      if (Number.isNaN(date.getTime())) return '';
      return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    },
    formatDateLabel(dateLike){
      const date = dateLike instanceof Date ? new Date(dateLike) : this.parseISO(dateLike) || new Date(dateLike);
      if (Number.isNaN(date.getTime())) return '';
      const dow = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()];
      return `${dow}, ${this.formatDate(date)}`;
    }
  };

  let currentPage = getCurrentPage();

  function setAuthState(state){
    const root = document.documentElement;
    if (!root) return;
    root.classList.remove('gpx-auth-checking', 'gpx-authed', 'gpx-logged-out');
    if (state === 'checking') root.classList.add('gpx-auth-checking');
    if (state === 'authed') root.classList.add('gpx-authed');
    if (state === 'logged-out') root.classList.add('gpx-logged-out');
  }

  function ensureAppVisible(){
    setAuthState('authed');
    const gate = document.getElementById('gpx-authgate');
    if (gate) gate.classList.add('hidden');
  }

  try {
    const savedTheme = localStorage.getItem('gpx-theme') || 'light';
    if (document.documentElement) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    currentPage = getCurrentPage();
    ensureAppVisible();
    injectAuthGate();
    injectNav();
    injectSyncToast();
    wireFirebase();
  });

  function toggleTheme(){
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gpx-theme', next);
    document.querySelectorAll('.gpx-theme-btn').forEach(b=> b.textContent = next==='dark' ? '☀' : '🌙');
  }

  function injectSyncToast(){
    if (!document.body) return;
    const el = document.createElement('div');
    el.id = 'gpx-sync-toast';
    el.setAttribute('data-gpx-chrome','1');
    document.body.appendChild(el);
  }

  function injectAuthGate(){
    if (!document.body) return;
    let wrap = document.getElementById('gpx-authgate');
    if (wrap) return;

    wrap = document.createElement('div');
    wrap.id = 'gpx-authgate';
    wrap.setAttribute('data-gpx-chrome','1');
    wrap.innerHTML = `
      <div class="gpx-login-card">
        <div class="gpx-logo">🔒</div>
        <h2>mYnd</h2>
        <p>Đăng nhập để xem dữ liệu cá nhân của bạn</p>
        <input type="email" id="gpx-login-email" placeholder="Email" autocomplete="username">
        <input type="password" id="gpx-login-pass" placeholder="Mật khẩu" autocomplete="current-password">
        <button id="gpx-login-btn">Đăng nhập</button>
        <div class="gpx-login-err" id="gpx-login-err"></div>
        <div class="gpx-login-note">Dữ liệu được lưu riêng cho tài khoản này và tự đồng bộ giữa các thiết bị bạn đăng nhập.</div>
      </div>`;
    document.body.appendChild(wrap);

    const emailInp = wrap.querySelector('#gpx-login-email');
    const passInp = wrap.querySelector('#gpx-login-pass');
    const btn = wrap.querySelector('#gpx-login-btn');
    const err = wrap.querySelector('#gpx-login-err');

    function doLogin(){
      const email = emailInp.value.trim();
      const pass = passInp.value;
      if(!email || !pass){ err.textContent = 'Nhập email và mật khẩu.'; return; }
      btn.disabled = true; btn.textContent = 'Đang đăng nhập...';
      err.textContent = '';
      if (!window.gpxAuth || typeof window.gpxAuth.signInWithEmailAndPassword !== 'function') {
        err.textContent = 'Firebase Auth chưa sẵn sàng.';
        btn.disabled = false; btn.textContent = 'Đăng nhập';
        return;
      }
      window.gpxAuth.signInWithEmailAndPassword(email, pass)
        .catch(e=>{
          err.textContent = e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found'
            ? 'Sai email hoặc mật khẩu.' : ('Lỗi: '+e.message);
        })
        .finally(()=>{ btn.disabled = false; btn.textContent = 'Đăng nhập'; });
    }
    btn.addEventListener('click', doLogin);
    [emailInp, passInp].forEach(inp=> inp.addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); }));
  }

  function navLinkHtml(p, mobile){
    const active = p.id === currentPage;
    if(mobile){
      return `<a class="gpx-blink${active?' active':''}" href="${p.href}"><span class="ic">${p.icon}</span>${p.label}</a>`;
    }
    return `<a class="gpx-link${active?' active':''}" href="${p.href}"><span>${p.icon}</span>${p.label}</a>`;
  }

  function injectNav(){
    if (!document.body) return;
    currentPage = getCurrentPage();

    const theme = document.documentElement.getAttribute('data-theme');
    const themeIcon = theme==='dark' ? '☀' : '🌙';

    const top = document.createElement('nav');
    top.id = 'gpx-topnav';
    top.setAttribute('data-gpx-chrome','1');
    top.innerHTML = `
      <a class="gpx-brand" href="index.html"><span class="mark">🎯</span>mYnd</a>
      ${PAGES.map(p=>navLinkHtml(p,false)).join('')}
      <div class="gpx-spacer"></div>
      <div class="gpx-topctrls">
        <button class="gpx-ctrl-btn gpx-theme-btn" title="Đổi giao diện sáng/tối">${themeIcon}</button>
        <button class="gpx-ctrl-btn" id="gpx-signout-btn" title="Đăng xuất">⎋</button>
      </div>`;
    document.body.appendChild(top);

    const bottom = document.createElement('nav');
    bottom.id = 'gpx-bottomnav';
    bottom.setAttribute('data-gpx-chrome','1');
    bottom.innerHTML = PAGES.map(p=>navLinkHtml(p,true)).join('');
    document.body.appendChild(bottom);

    const mobileCtrls = document.createElement('div');
    mobileCtrls.id = 'gpx-mobile-controls';
    mobileCtrls.setAttribute('data-gpx-chrome','1');
    mobileCtrls.innerHTML = `
      <button class="gpx-ctrl-btn gpx-theme-btn" title="Đổi giao diện sáng/tối">${themeIcon}</button>
      <button class="gpx-ctrl-btn" id="gpx-signout-btn-m" title="Đăng xuất">⎋</button>`;
    document.body.appendChild(mobileCtrls);

    document.querySelectorAll('.gpx-theme-btn').forEach(b=> b.addEventListener('click', toggleTheme));
    ['gpx-signout-btn','gpx-signout-btn-m'].forEach(id=>{
      const b = document.getElementById(id);
      if(b) b.addEventListener('click', ()=>{
        if(confirm('Đăng xuất khỏi thiết bị này?')) {
          if (window.gpxAuth && typeof window.gpxAuth.signOut === 'function') {
            window.gpxAuth.signOut();
          }
        }
      });
    });
  }

  function applyAuthStatus(user){
    if (!document.documentElement) return;
    if (user) {
      setAuthState('authed');
      const gate = document.getElementById('gpx-authgate');
      if (gate) gate.classList.add('hidden');
      window.Store && typeof window.Store.init === 'function' && window.Store.init(window.gpxDb, user.uid);
      document.dispatchEvent(new CustomEvent('gpx-ready'));
      return;
    }

    ensureAppVisible();
    if (window.Store && typeof window.Store.reset === 'function') {
      window.Store.reset();
    }
  }

  function wireFirebase(){
    if(!window.gpxAuth || !window.gpxDb){
      console.warn('[AppShell] Firebase Auth/Firestore chưa sẵn sàng. Kiểm tra shared/firebase-config.js.');
      ensureAppVisible();
      return;
    }

    if(!window.Store || typeof window.Store.init !== 'function' || typeof window.Store.reset !== 'function'){
      console.warn('[AppShell] Store chưa sẵn sàng. Vui lòng kiểm tra shared/store.js.');
      ensureAppVisible();
      return;
    }

    window.gpxAuth.onAuthStateChanged(user => {
      applyAuthStatus(user);
    });
  }
})();
