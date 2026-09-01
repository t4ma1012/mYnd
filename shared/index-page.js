(function(){
  const WEEKDAY_LABELS = ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];

  function todayDate(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
  function fmtISO(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function parseDateInput(str){ if(!str) return null; const p=str.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
  function fmtVND(n){ return (Math.round(n)||0).toLocaleString('vi-VN')+' đ'; }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function getUserName(){
    const user = window.gpxAuth && window.gpxAuth.currentUser ? window.gpxAuth.currentUser : null;
    if(!user) return 'bạn';
    if(user.displayName && user.displayName.trim()) return user.displayName.trim();
    if(user.email && user.email.trim()) {
      const localPart = user.email.trim().split('@')[0] || 'bạn';
      const firstName = localPart.split(/[._-]+/).filter(Boolean)[0] || localPart;
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }
    return 'bạn';
  }

  function getUserInitials() {
    const name = getUserName();
    const parts = name.split(/\s+/).filter(Boolean);
    if(!parts.length) return 'B';
    return parts.slice(0,2).map(p=>p[0].toUpperCase()).join('').slice(0,2);
  }

  const greetHeading = document.getElementById('greetHeading');
  if(greetHeading){ greetHeading.textContent = 'Chào ' + getUserName() + ' 👋'; }

  const todayDateLabel = document.getElementById('todayDateLabel');
  if(todayDateLabel){
    if (window.DateUtils && typeof window.DateUtils.formatDateLabel === 'function') {
      todayDateLabel.textContent = window.DateUtils.formatDateLabel(todayDate());
    } else {
      const d = todayDate();
      const pad = (value) => String(value).padStart(2, '0');
      todayDateLabel.textContent = `${WEEKDAY_LABELS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
  }

  const avatar = document.querySelector('.avatar');
  if(avatar){ avatar.textContent = getUserInitials(); }

  async function loadJson(key){
    try{
      const raw = await window.Store.storageGetRaw(key);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function renderFocusFromTasks(tasks){
    const list = Array.isArray(tasks) ? tasks : [];
    const container = document.getElementById('focusList');
    if(!container) return;
    const colors = ['#3B82F6','#0EA69E','#F0932B'];
    if(!list.length){
      container.innerHTML = '<div class="focus-item" data-nav="lich-tuan.html"><span class="focus-bullet"></span><div><strong>Không có việc nào</strong><span>Hôm nay bạn đang ở trạng thái nghỉ ngơi và sẵn sàng cho việc mới.</span></div></div>';
      return;
    }
    container.innerHTML = list.slice(0,3).map((task,i)=>
      '<div class="focus-item" data-task-id="' + escapeHtml(task.id || task.text || 'task-' + i) + '" data-nav="lich-tuan.html">'
      + '<label class="task-toggle" title="Đánh dấu hoàn thành"><input type="checkbox" data-task-toggle="true" '+(task.done ? 'checked':'')+'></label>'
      + '<span class="focus-bullet" style="background:' + colors[i % colors.length] + ';"></span>'
      + '<div><strong>' + escapeHtml(task.text || 'Công việc mới') + '</strong><span>' + (task.priority ? (task.priority === 'q1' ? 'Khẩn cấp & quan trọng' : task.priority === 'q2' ? 'Quan trọng' : task.priority === 'q3' ? 'Khẩn cấp' : 'Bình thường') : 'Việc cần hoàn thành') + '</span></div>'
      + '</div>'
    ).join('');
  }

  function getTodoSnapshot(todoData){
    const data = todoData && typeof todoData === 'object' ? todoData : {};
    const general = data.general && typeof data.general === 'object' ? data.general : {};
    const byDate = data.byDate && typeof data.byDate === 'object' ? data.byDate : {};
    const todayIso = fmtISO(todayDate());
    const buckets = [];
    ['q1','q2','q3','q4'].forEach(key => {
      if(Array.isArray(general[key])) buckets.push(...general[key]);
      if(Array.isArray(byDate[todayIso] && byDate[todayIso][key])) buckets.push(...byDate[todayIso][key]);
    });
    const total = buckets.length;
    const done = buckets.filter(item => item && item.done).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  function getNextGoalDelta(goals){
    const list = Array.isArray(goals) ? goals.filter(goal => !goal.completed && goal.targetDate) : [];
    if(!list.length) return null;
    const now = todayDate();
    let best = null;
    list.forEach(goal => {
      const targetDate = parseDateInput(goal.targetDate);
      if(!targetDate) return;
      const delta = Math.ceil((targetDate - now) / 86400000);
      if(!best || delta < best.daysRemaining) {
        best = {
          goalId: goal.id || goal.name || String(Math.random()),
          goalName: goal.name || 'Mục tiêu',
          targetDate,
          daysRemaining: delta,
          dueLabel: delta >= 0 ? `${delta} ngày` : `${Math.abs(delta)} ngày quá hạn`
        };
      }
    });
    return best;
  }

  function updateCountdownUI(goals){
    const next = getNextGoalDelta(goals);
    const valueEl = document.querySelector('.countdown-value');
    const labelEl = document.querySelector('.countdown-label');
    const metaEl = document.querySelector('.countdown-panel .meta-row strong');
    const panel = document.querySelector('.countdown-panel');

    if(!valueEl || !labelEl || !metaEl) return;

    if(!next){
      valueEl.textContent = '—';
      labelEl.textContent = 'Không có mục tiêu';
      metaEl.textContent = 'Chưa có mục tiêu';
      if(panel) panel.setAttribute('data-nav', 'muc-tieu.html');
      return;
    }

    valueEl.textContent = String(Math.max(0, next.daysRemaining));
    labelEl.textContent = next.daysRemaining >= 0 ? 'ngày tới kỳ hạn' : 'ngày quá hạn';
    metaEl.textContent = next.goalName;
    if(panel) panel.setAttribute('data-nav', 'muc-tieu.html');
  }

  async function toggleTask(taskId){
    if(!taskId || !window.Store || !window.Store.storageGetRaw || !window.Store.storageSetRaw) return null;
    const raw = await window.Store.storageGetRaw('todo-matrix-v1');
    const todoData = raw ? JSON.parse(raw) : { general: { q1: [], q2: [], q3: [], q4: [] }, byDate: {} };
    const buckets = [todoData.general || {}, todoData.byDate || {}];
    let matched = null;
    let matchedBucketKey = null;
    let matchedQ = null;

    for(const bucket of buckets){
      if(!bucket || typeof bucket !== 'object') continue;
      Object.keys(bucket).forEach(qKey => {
        if(!Array.isArray(bucket[qKey])) return;
        const item = bucket[qKey].find(entry => String(entry.id) === String(taskId));
        if(item){ matched = item; matchedBucketKey = bucket; matchedQ = qKey; }
      });
      if(matched) break;
    }

    if(!matched) return null;

    matched.done = !matched.done;
    await window.Store.storageSetRaw('todo-matrix-v1', JSON.stringify(todoData));
    return matched.done;
  }

  function goToModule(moduleName){
    const map = {
      home: 'index.html',
      calendar: 'lich-tuan.html',
      finance: 'chi-tieu.html',
      tutoring: 'gia-su.html',
      goals: 'muc-tieu.html',
      'lich-tuan.html': 'lich-tuan.html',
      'chi-tieu.html': 'chi-tieu.html',
      'gia-su.html': 'gia-su.html',
      'muc-tieu.html': 'muc-tieu.html',
      'index.html': 'index.html'
    };
    const href = map[moduleName] || moduleName || 'index.html';
    if(typeof window !== 'undefined' && window.location){ window.location.href = href; }
  }

  function bindDashboardInteractions(){
    const focusList = document.querySelector('.focus-list');
    if(focusList){
      focusList.addEventListener('change', async (event) => {
        const input = event.target.closest && event.target.closest('input[data-task-toggle="true"]');
        if(!input) return;
        const taskId = input.closest('.focus-item') && input.closest('.focus-item').dataset.taskId;
        if(!taskId) return;
        const nextDone = await toggleTask(taskId);
        if(nextDone !== null){
          await renderDashboardData();
        }
      });

      focusList.addEventListener('click', (event) => {
        const item = event.target.closest('.focus-item');
        if(!item) return;
        const targetInput = event.target.closest('input[data-task-toggle="true"]');
        if(targetInput) return;
        const nav = item.getAttribute('data-nav');
        if(nav){ goToModule(nav); }
      });
    }

    const countdownPanel = document.querySelector('.countdown-panel');
    if(countdownPanel){
      countdownPanel.addEventListener('click', () => goToModule('muc-tieu.html'));
    }

    document.querySelectorAll('[data-nav]').forEach(node => {
      if(node.classList && node.classList.contains('focus-item')) return;
      node.addEventListener('click', (event) => {
        if(event.target.closest('a, button, .quick-btn')) return;
        const nav = node.getAttribute('data-nav');
        if(nav) goToModule(nav);
      });
    });
  }

  function renderTodoProgress(todoData){
    const snapshot = getTodoSnapshot(todoData);
    const meter = document.getElementById('todoMeter');
    const label = document.getElementById('todoProgressValue');
    const text = document.getElementById('todoProgressText');
    if(meter) meter.style.width = snapshot.percent + '%';
    if(label) label.textContent = snapshot.percent + '%';
    if(text) text.textContent = `${snapshot.done} / ${snapshot.total}`;
  }

  function renderFinanceSnapshot(stats){
    const finance = stats && stats.finance ? stats.finance : { monthIncome: 0, monthExpense: 0, monthBalance: 0 };
    const values = document.querySelectorAll('.finance-panel .snapshot-item .value');
    if(values.length >= 3){
      values[0].textContent = fmtVND(finance.monthIncome);
      values[0].style.color = '#0EA69E';
      values[1].textContent = fmtVND(finance.monthExpense);
      values[1].style.color = '#F0932B';
      values[2].textContent = fmtVND(finance.monthBalance);
      values[2].style.color = '#3B82F6';
    }
  }

  async function renderCalendarSummary(){
    const events = (await loadJson('calendar-events-v1')) || [];
    const today = todayDate();
    const iso = fmtISO(today);
    const dow = today.getDay();
    const todays = events.filter(ev=>{ 
      if(ev.recurring){ 
        if(ev.dow !== dow) return false; 
        if(ev.recurStart && parseDateInput(ev.recurStart) > today) return false; 
        if(ev.recurEnd && parseDateInput(ev.recurEnd) < today) return false; 
        return true; 
      }
      return ev.date === iso; 
    }).sort((a,b)=> (a.start||'').localeCompare(b.start||''));
    const el = document.getElementById('sum-calendar');
    el.classList.remove('tile-loading');
    el.innerHTML = todays.length ? '<b>'+todays.length+' sự kiện</b> hôm nay — gần nhất: '+escapeHtml(todays[0].title)+' lúc '+(todays[0].start||'') : 'Hôm nay chưa có sự kiện nào.';
    const listEl = document.getElementById('todayList');
    if(todays.length===0){
      listEl.innerHTML = '<div class="empty-note">Không có lịch nào hôm nay. Nghỉ ngơi chút nhé 🌿</div>';
    } else {
      listEl.innerHTML = todays.map(ev=> '<div class="today-row"><div class="dot" style="background:'+(ev.color||'#3B82F6')+'"></div>' + '<div class="t-title">'+escapeHtml(ev.title)+(ev.location?' · <span style="color:var(--gpx-ink-faint);font-weight:400;">'+escapeHtml(ev.location)+'</span>':'')+'</div>' + '<div class="t-time">'+(ev.start||'')+'–'+(ev.end||'')+'</div></div>' ).join('');
    }
  }

  async function renderExpenseSummary(){
    const data = await loadJson('finance-data-v2');
    const el = document.getElementById('sum-expenses');
    el.classList.remove('tile-loading');
    if(!data || !Array.isArray(data.transactions)){ el.textContent = 'Chưa có dữ liệu.'; return; }
    const now = new Date();
    const mk = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    const monthTx = data.transactions.filter(t=>t.date && t.date.slice(0,7)===mk);
    const income = monthTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    el.innerHTML = 'Tháng này: thu <b>'+fmtVND(income)+'</b>, chi <b>'+fmtVND(expense)+'</b>';
  }

  async function renderTutoringSummary(){
    const db = await loadJson('gia-su-data-v1');
    const el = document.getElementById('sum-tutoring');
    el.classList.remove('tile-loading');
    if(!db || !Array.isArray(db.classes)){ el.textContent = 'Chưa có dữ liệu.'; return; }
    const teaching = db.classes.filter(c=>c.status==='Đang dạy');
    let unpaid = 0;
    db.classes.forEach(c=>{ (c.sessions||[]).forEach(s=>{ const amt = (c.rate||0) * (s.duration!=null ? s.duration : (c.duration||0)); if(s.payment !== 'Đã nhận') unpaid += amt; }); });
    const pendingApps = [...(db.teach||[]), ...(db.cyber||[])].filter(a=>a.status && a.status.includes('chờ')).length;
    el.innerHTML = '<b>'+teaching.length+' lớp</b> đang dạy · chưa nhận <b>'+fmtVND(unpaid)+'</b>' + (pendingApps>0 ? '<br>'+pendingApps+' hồ sơ đang chờ phản hồi' : '');
  }

  async function renderGoalsSummary(){
    const goals = (await loadJson('muc_tieu_hoc_tap_goals_v1')) || [];
    const el = document.getElementById('sum-goals');
    el.classList.remove('tile-loading');
    if(goals.length===0){ el.textContent = 'Chưa có mục tiêu nào.'; return; }
    const active = goals.filter(g=>!g.completed);
    const today = todayDate();
    let upcoming = 0;
    goals.forEach(g=>{ if(g.completed) return; const target = parseDateInput(g.targetDate); if(target){ const days = Math.round((target-today)/86400000); if(days>=0 && days<=14) upcoming++; } });
    el.innerHTML = '<b>'+active.length+' mục tiêu</b> đang theo đuổi' + (upcoming>0 ? '<br>⚠ '+upcoming+' mục tiêu sắp tới hạn (14 ngày)' : '<br>Không có mục tiêu nào sắp tới hạn');
  }

  async function renderDashboardData(){
    const [calendarData, financeData, goals, todoData] = await Promise.all([ loadJson('calendar-events-v1'), loadJson('finance-data-v2'), loadJson('muc_tieu_hoc_tap_goals_v1'), loadJson('todo-matrix-v1') ]);
    const safeGoals = Array.isArray(goals) ? goals : [];
    const todoPayload = todoData || { general: { q1: [], q2: [], q3: [], q4: [] }, byDate: {} };
    const stats = window.DashboardData.buildSnapshot({ authUser: window.gpxAuth && window.gpxAuth.currentUser ? window.gpxAuth.currentUser : null, todoData: todoPayload, goals: safeGoals, financeData: financeData || { transactions: [] }, events: Array.isArray(calendarData) ? calendarData : [], today: new Date().toISOString() });
    renderFocusFromTasks(stats.todayFocus);
    renderTodoProgress(todoPayload);
    renderFinanceSnapshot(stats);
    renderCalendarSummary();
    renderExpenseSummary();
    renderTutoringSummary();
    renderGoalsSummary();
    bindDashboardInteractions();
  }

  window.Dashboard = { toggleTask, getNextGoalDelta, goToModule };
  document.addEventListener('gpx-ready', ()=>{ renderDashboardData(); });
})();
