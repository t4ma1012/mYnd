(function(){
  "use strict";

  const STORAGE_KEY = 'muc_tieu_hoc_tap_goals_v1';
  function storageGet(key){ return window.Store.storageGetRaw(key); }
  function storageSet(key, value){ return window.Store.storageSetRaw(key, value); }

  let goals = [];

  async function loadGoals(){
    const raw = await storageGet(STORAGE_KEY);
    if(raw){
      try{ goals = JSON.parse(raw) || []; }catch(e){ goals = []; }
    } else {
      goals = [];
    }
  }
  function persist(){ storageSet(STORAGE_KEY, JSON.stringify(goals)); }

  function parseDateInput(str){
    if(!str) return null;
    const parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1]-1, parts[2]);
  }
  function todayDate(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
  function todayISO(){ return fmtISO(todayDate()); }
  function fmtISO(d){
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+dd;
  }
  function fmtVN(d){
    if(!d) return '—';
    const dd=String(d.getDate()).padStart(2,'0'), m=String(d.getMonth()+1).padStart(2,'0');
    return dd+'/'+m+'/'+d.getFullYear();
  }
  function addDays(d,n){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()+n); }
  function addMonths(d,n){ return new Date(d.getFullYear(), d.getMonth()+n, d.getDate()); }
  function daysBetween(a,b){ return Math.round((b-a)/86400000); }
  function startOfWeekMonday(d){
    const day = d.getDay();
    const diff = (day===0? -6 : 1-day);
    return addDays(d, diff);
  }
  function round1(n){ return Math.round(n*10)/10; }

  function escapeHtml(str){
    return String(str==null?'':str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const TYPE_META = {
    certificate: { label:'Chứng chỉ', color:'var(--cert)', bg:'var(--cert-soft)', emoji:'🎓' },
    project:     { label:'Dự án lớn', color:'var(--project)', bg:'var(--project-soft)', emoji:'🚀' },
    life:        { label:'Mục tiêu cuộc sống', color:'var(--life)', bg:'var(--life-soft)', emoji:'🌟' }
  };
  function typeMeta(t){ return TYPE_META[t] || TYPE_META.certificate; }

  function statusLabel(s){
    return { ahead:'Vượt tiến độ', ontrack:'Đúng tiến độ', behind:'Chậm tiến độ', overdue:'Quá hạn', done:'Hoàn thành' }[s] || '';
  }
  function statusClass(s){ return 'status-'+s; }

  function computeStats(goal){
    const today = todayDate();
    const start = parseDateInput(goal.startDate);
    const target = parseDateInput(goal.targetDate);
    const totalDays = Math.max(1, daysBetween(start, target));
    const totalWeeks = totalDays/7;

    let elapsedDays = daysBetween(start, today);
    elapsedDays = Math.max(0, Math.min(elapsedDays, totalDays));

    const remainingDaysRaw = daysBetween(today, target);
    const isOverdue = remainingDaysRaw < 0;
    const remainingDaysClamped = Math.max(remainingDaysRaw, 0);
    const remainingWeeks = remainingDaysClamped/7;

    const sessions = goal.sessions || [];
    const hoursLogged = sessions.reduce((s,x)=>s+Number(x.hours||0), 0);
    const hoursTotal = (goal.hoursTotal!==null && goal.hoursTotal!==undefined && goal.hoursTotal!=='') ? Number(goal.hoursTotal) : null;
    const hoursRemaining = hoursTotal!=null ? Math.max(0, hoursTotal-hoursLogged) : null;

    let paceHoursPerWeek = null;
    if(hoursTotal!=null){
      if(isOverdue){
        paceHoursPerWeek = hoursRemaining;
      } else if(remainingWeeks > 0.05){
        paceHoursPerWeek = hoursRemaining/remainingWeeks;
      } else {
        paceHoursPerWeek = hoursRemaining;
      }
    }
    const hoursPerSession = (goal.hoursPerSession!==null && goal.hoursPerSession!==undefined && goal.hoursPerSession!=='') ? Number(goal.hoursPerSession) : null;
    let paceSessionsPerWeek = null;
    if(paceHoursPerWeek!=null && hoursPerSession>0){
      paceSessionsPerWeek = paceHoursPerWeek/hoursPerSession;
    }

    let progressByHours = null;
    if(hoursTotal!=null && hoursTotal>0){
      progressByHours = Math.min(1, hoursLogged/hoursTotal);
    }
    const milestones = goal.milestones || [];
    const milestoneDoneCount = milestones.filter(m=>m.done).length;
    const progressByMilestones = milestones.length>0 ? milestoneDoneCount/milestones.length : null;
    const progressByTime = Math.min(1, elapsedDays/totalDays);

    let progress;
    if(progressByHours!=null) progress = progressByHours;
    else if(progressByMilestones!=null) progress = progressByMilestones;
    else progress = 0;

    let status;
    if(goal.completed){
      status = 'done';
    } else if(isOverdue && progress < 1){
      status = 'overdue';
    } else {
      const diff = progress - progressByTime;
      if(diff >= 0.08) status = 'ahead';
      else if(diff <= -0.08) status = 'behind';
      else status = 'ontrack';
    }

    const weekStart = startOfWeekMonday(today);
    const weekEnd = addDays(weekStart, 6);
    const sessionsThisWeek = sessions.filter(s=>{
      const d = parseDateInput(s.date);
      return d && d >= weekStart && d <= weekEnd;
    });
    const hoursThisWeek = sessionsThisWeek.reduce((s,x)=>s+Number(x.hours||0), 0);

    const nextMilestone = milestones
      .filter(m=>!m.done)
      .sort((a,b)=> parseDateInput(a.due) - parseDateInput(b.due))[0] || null;

    return {
      today, start, target, totalDays, totalWeeks, elapsedDays,
      remainingDaysRaw, isOverdue, remainingDaysClamped, remainingWeeks,
      hoursLogged, hoursTotal, hoursRemaining, paceHoursPerWeek, hoursPerSession, paceSessionsPerWeek,
      progressByHours, progressByMilestones, progressByTime, progress, status,
      milestones, milestoneDoneCount, nextMilestone, sessionsThisWeek, hoursThisWeek
    };
  }

  function fmtRemaining(stats){
    if(stats.isOverdue) return 'Quá hạn ' + Math.abs(stats.remainingDaysRaw) + ' ngày';
    if(stats.remainingDaysClamped < 14) return stats.remainingDaysClamped + ' ngày';
    return round1(stats.remainingWeeks) + ' tuần';
  }

  function paceCellText(stats){
    if(stats.paceSessionsPerWeek!=null) return round1(stats.paceSessionsPerWeek) + ' buổi/tuần';
    if(stats.paceHoursPerWeek!=null) return round1(stats.paceHoursPerWeek) + ' giờ/tuần';
    return '—';
  }

  function buildPaceNoteHtml(goal, stats){
    if(goal.completed){
      return '<div class="pace-note" style="background:var(--green-soft);color:var(--green);border-color:transparent;"><b>🎉 Đã hoàn thành!</b> Chúc mừng bạn đã đạt được mục tiêu này.</div>';
    }
    if(stats.isOverdue && stats.progress < 1){
      let extra = '';
      if(stats.hoursRemaining!=null) extra = ' Còn thiếu khoảng <b>'+round1(stats.hoursRemaining)+' giờ</b> học.';
      return '<div class="pace-note late"><b>⚠ Đã quá hạn '+Math.abs(stats.remainingDaysRaw)+' ngày.</b>'+extra+' Cân nhắc dời hạn hoặc tăng tốc.</div>';
    }
    if(stats.hoursTotal==null){
      return '<div class="pace-note">Chưa nhập tổng số giờ cần học — sửa mục tiêu để hệ thống tự tính nhịp học mỗi tuần. Hiện đang theo dõi bằng mốc nhỏ (milestone).</div>';
    }
    const paceCls = stats.status==='behind' ? 'pace-note warn' : 'pace-note';
    let txt = 'Cần học khoảng <b>'+round1(stats.paceHoursPerWeek)+' giờ/tuần</b>';
    if(stats.paceSessionsPerWeek!=null) txt += ' (~<b>'+round1(stats.paceSessionsPerWeek)+' buổi/tuần</b>)';
    txt += ' để về đích đúng hạn.';
    if(stats.status==='behind') txt += ' Bạn đang chậm hơn tiến độ dự kiến, cố gắng bắt kịp nhé!';
    if(stats.status==='ahead') txt += ' Bạn đang vượt tiến độ, tuyệt vời!';
    return '<div class="'+paceCls+'">'+txt+'</div>';
  }

  let currentTab = 'all';
  const expandedMilestones = {};
  const expandedSessions = {};
  let editingGoalId = null;
  let pendingType = 'certificate';
  let sessionModalGoalId = null;

  const TAB_HEADINGS = { all:'Tất cả mục tiêu', certificate:'Chứng chỉ đang học', project:'Dự án lớn', life:'Mục tiêu cuộc sống' };

  function renderOverviewStats(){
    const wrap = document.getElementById('overviewStats');
    const active = goals.filter(g=>!g.completed);
    let upcoming = 0;
    let overdueCount = 0;
    let hoursThisWeekTotal = 0;

    goals.forEach(g=>{
      const stats = computeStats(g);
      hoursThisWeekTotal += stats.hoursThisWeek;
      if(!g.completed){
        if(stats.status==='overdue') overdueCount++;
        if(!stats.isOverdue && stats.remainingDaysClamped <= 14) upcoming++;
        (g.milestones||[]).forEach(m=>{
          if(!m.done){
            const due = parseDateInput(m.due);
            const d = daysBetween(todayDate(), due);
            if(d>=0 && d<=14) upcoming++;
          }
        });
      }
    });

    const cards = [
      { label:'Đang theo đuổi', value: active.length, sub: goals.length + ' mục tiêu tổng cộng' },
      { label:'Sắp tới hạn (14 ngày)', value: upcoming, sub:'Mục tiêu + mốc nhỏ' },
      { label:'Giờ học tuần này', value: round1(hoursThisWeekTotal)+'h', sub:'Cộng dồn tất cả mục tiêu' },
      { label:'Đang quá hạn', value: overdueCount, sub: overdueCount>0 ? 'Cần chú ý ngay' : 'Không có, tốt lắm!' }
    ];
    wrap.innerHTML = cards.map(c=>
      '<div class="stat-card"><div class="stat-label">'+c.label+'</div><div class="stat-value">'+c.value+'</div><div class="stat-sub">'+c.sub+'</div></div>'
    ).join('');
  }

  function visibleGoals(){
    if(currentTab==='all') return goals.slice().sort(sortGoals);
    return goals.filter(g=>g.type===currentTab).sort(sortGoals);
  }
  function sortGoals(a,b){
    if(!!a.completed !== !!b.completed) return a.completed ? 1 : -1;
    return parseDateInput(a.targetDate) - parseDateInput(b.targetDate);
  }

  function attachSharedDateInputs(){
    document.querySelectorAll('.shared-date-input').forEach((input) => {
      if (window.DateInput && typeof window.DateInput.attach === 'function') {
        window.DateInput.attach(input);
      }
    });
  }

  function getInputDateIso(el){
    if (!el) return '';
    if (window.DateInput && typeof window.DateInput.getValue === 'function') return window.DateInput.getValue(el) || '';
    return el.value || '';
  }

  function renderGoalGrid(){
    document.getElementById('sectionHeading').textContent = TAB_HEADINGS[currentTab];
    const grid = document.getElementById('goalGrid');
    const list = visibleGoals();
    const empty = document.getElementById('emptyState');
    if(list.length===0){
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = list.map(g=>buildGoalCardHtml(g)).join('');
    attachSharedDateInputs();
  }

  function buildGoalCardHtml(goal){
    const stats = computeStats(goal);
    const meta = typeMeta(goal.type);
    const milestonesOpen = !!expandedMilestones[goal.id];
    const sessionsOpen = !!expandedSessions[goal.id];
    const progressPct = Math.round(stats.progress*100);

    const targetSessions = stats.paceSessionsPerWeek!=null ? Math.max(1, Math.round(stats.paceSessionsPerWeek)) : 3;
    const dotTotal = Math.max(targetSessions, stats.sessionsThisWeek.length, 1);
    let dots = '';
    for(let i=0;i<dotTotal;i++){
      dots += '<div class="week-dot'+(i<stats.sessionsThisWeek.length?' filled':'')+'"></div>';
    }

    const milestonesHtml = (goal.milestones||[]).slice().sort((a,b)=>parseDateInput(a.due)-parseDateInput(b.due)).map(m=>{
      const due = parseDateInput(m.due);
      const late = !m.done && due && due < todayDate();
      return '<div class="milestone-row'+(m.done?' done':'')+'">'
        + '<input type="checkbox" data-action="toggle-milestone" data-id="'+goal.id+'" data-mid="'+m.id+'" '+(m.done?'checked':'')+'>'
        + '<div class="m-title">'+escapeHtml(m.title)+'</div>'
        + '<div class="m-due'+(late?' late':'')+'">'+fmtVN(due)+'</div>'
        + '<div class="m-del" data-action="delete-milestone" data-id="'+goal.id+'" data-mid="'+m.id+'">✕</div>'
        + '</div>';
    }).join('') || '<div class="milestone-empty">Chưa có mốc nhỏ nào. Hãy chia mục tiêu lớn thành các bước nhỏ hơn.</div>';

    const sessionsSorted = (goal.sessions||[]).slice().sort((a,b)=>parseDateInput(b.date)-parseDateInput(a.date));
    const sessionsHtml = sessionsSorted.map(s=>
      '<div class="session-row">'
      + '<div class="s-left"><div class="s-date">'+fmtVN(parseDateInput(s.date))+'</div>'+(s.note?'<div class="s-note">'+escapeHtml(s.note)+'</div>':'')+'</div>'
      + '<div class="s-right"><div class="s-hours">'+round1(Number(s.hours))+'h</div><div class="s-del" data-action="delete-session" data-id="'+goal.id+'" data-sid="'+s.id+'">✕</div></div>'
      + '</div>'
    ).join('') || '<div class="milestone-empty">Chưa ghi buổi học nào.</div>';

    return ''
    + '<div class="goal-card" style="--gl-color:'+meta.color+';--gl-bg:'+meta.bg+'" data-id="'+goal.id+'">'
    +   '<div class="goal-card-body">'
    +     '<div class="goal-card-head">'
    +       '<div class="goal-badges">'
    +         '<span class="badge">'+meta.emoji+' '+meta.label+'</span>'
    +         '<span class="status-badge '+statusClass(stats.status)+'">'+statusLabel(stats.status)+'</span>'
    +       '</div>'
    +       '<div class="goal-actions">'
    +         '<button class="icon-btn" data-action="edit-goal" data-id="'+goal.id+'" title="Sửa">✎</button>'
    +         '<button class="icon-btn" data-action="delete-goal" data-id="'+goal.id+'" title="Xoá">🗑</button>'
    +       '</div>'
    +     '</div>'
    +     '<div class="goal-name">'+escapeHtml(goal.name)+'</div>'
    +     (goal.note ? '<div class="goal-note">'+escapeHtml(goal.note)+'</div>' : '')
    +     '<div class="progress-block">'
    +       '<div class="progress-label"><span>Tiến độ</span><span>'+progressPct+'%</span></div>'
    +       '<div class="progress-bar"><div class="progress-fill" style="width:'+progressPct+'%"></div></div>'
    +     '</div>'
    +     '<div class="stat-grid">'
    +       '<div class="cell"><div class="lbl">Bắt đầu</div><div class="val">'+fmtVN(stats.start)+'</div></div>'
    +       '<div class="cell"><div class="lbl">Hạn chót</div><div class="val">'+fmtVN(stats.target)+'</div></div>'
    +       '<div class="cell"><div class="lbl">Còn lại</div><div class="val">'+fmtRemaining(stats)+'</div></div>'
    +       '<div class="cell"><div class="lbl">Nhịp cần đạt</div><div class="val">'+paceCellText(stats)+'</div></div>'
    +     '</div>'
    +     buildPaceNoteHtml(goal, stats)
    +     '<div class="week-row"><div class="week-dots">'+dots+'</div><span>Tuần này: '+stats.sessionsThisWeek.length+' buổi ('+round1(stats.hoursThisWeek)+'h)'
           + (stats.hoursTotal!=null ? ' · Đã học '+round1(stats.hoursLogged)+'h/'+round1(stats.hoursTotal)+'h' : '') + '</span></div>'
    +     (stats.nextMilestone ? '<div class="hint" style="margin-top:8px;">Mốc tiếp theo: <b style="color:var(--ink);">'+escapeHtml(stats.nextMilestone.title)+'</b> — hạn '+fmtVN(parseDateInput(stats.nextMilestone.due))+'</div>' : '')
    +     '<div class="goal-card-actions">'
    +       '<button class="btn btn-sm btn-solid" style="background:'+meta.color+'" data-action="log-session" data-id="'+goal.id+'">+ Ghi buổi học</button>'
    +       '<button class="btn btn-sm" data-action="toggle-complete" data-id="'+goal.id+'">'+(goal.completed?'↺ Mở lại':'✓ Hoàn thành')+'</button>'
    +     '</div>'
    +   '</div>'
    +   '<div class="milestones-wrap">'
    +     '<div class="milestones-toggle'+(milestonesOpen?' open':'')+'" data-action="toggle-milestones" data-id="'+goal.id+'">'
    +       '<span>🧩 Mốc nhỏ ('+stats.milestoneDoneCount+'/'+stats.milestones.length+')</span><span class="chev">▶</span>'
    +     '</div>'
    +     '<div class="milestones-body'+(milestonesOpen?' open':'')+'">'
    +       '<div class="milestone-list">'+milestonesHtml+'</div>'
    +       '<div class="milestone-add-row">'
    +         '<input type="text" class="m-add-title" placeholder="Tên mốc nhỏ, VD: Hoàn thành Domain 1">'
    +         '<input type="text" class="m-add-due shared-date-input" placeholder="dd/mm/yyyy">'
    +         '<button class="btn btn-sm" data-action="add-milestone" data-id="'+goal.id+'">+ Thêm</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="sessions-wrap">'
    +     '<div class="milestones-toggle'+(sessionsOpen?' open':'')+'" data-action="toggle-sessions" data-id="'+goal.id+'">'
    +       '<span>📜 Lịch sử buổi học ('+sessionsSorted.length+')</span><span class="chev">▶</span>'
    +     '</div>'
    +     (sessionsOpen ? '<div class="session-list">'+sessionsHtml+'</div>' : '')
    +   '</div>'
    + '</div>';
  }

  function renderAll(){
    renderOverviewStats();
    renderGoalGrid();
  }

  document.getElementById('tabs').addEventListener('click', (e)=>{
    const btn = e.target.closest('.tab-btn');
    if(!btn) return;
    currentTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b===btn));
    renderGoalGrid();
  });

  const goalOverlay = document.getElementById('goalOverlay');
  const gfName = document.getElementById('gf-name');
  const gfStart = document.getElementById('gf-start');
  const gfTarget = document.getElementById('gf-target');
  const gfHoursTotal = document.getElementById('gf-hours-total');
  const gfHoursSession = document.getElementById('gf-hours-session');
  const gfNote = document.getElementById('gf-note');

  function setPendingType(t){
    pendingType = t;
    document.querySelectorAll('#typeSeg button').forEach(b=>b.classList.toggle('active', b.dataset.type===t));
  }
  document.getElementById('typeSeg').addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(btn) setPendingType(btn.dataset.type);
  });

  document.getElementById('durationQuick').addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const months = Number(btn.dataset.months);
    const startIso = getInputDateIso(gfStart);
    const start = startIso ? parseDateInput(startIso) : todayDate();
    if(!startIso) {
      if (window.DateInput && typeof window.DateInput.setValue === 'function') window.DateInput.setValue(gfStart, fmtISO(start));
      else gfStart.value = fmtISO(start);
    }
    if (window.DateInput && typeof window.DateInput.setValue === 'function') window.DateInput.setValue(gfTarget, fmtISO(addMonths(start, months)));
    else gfTarget.value = fmtISO(addMonths(start, months));
    updateGoalComputedBox();
  });

  function updateGoalComputedBox(){
    const box = document.getElementById('goalComputedBox');
    const startIso = getInputDateIso(gfStart);
    const targetIso = getInputDateIso(gfTarget);
    if(!startIso || !targetIso){ box.style.display='none'; return; }
    const start = parseDateInput(startIso);
    const target = parseDateInput(targetIso);
    const totalDays = daysBetween(start, target);
    if(totalDays<=0){ box.style.display='none'; return; }
    const weeks = totalDays/7;
    const months = totalDays/30.44;
    let html = '⏱ Tổng thời gian: <b>'+round1(weeks)+' tuần</b> (~'+round1(months)+' tháng)';
    const hoursTotal = Number(gfHoursTotal.value);
    if(gfHoursTotal.value && hoursTotal>0){
      const perWeek = hoursTotal/weeks;
      html += '<br>📚 Cần học ~<b>'+round1(perWeek)+' giờ/tuần</b>';
      const perSession = Number(gfHoursSession.value);
      if(gfHoursSession.value && perSession>0){
        html += ' (~<b>'+round1(perWeek/perSession)+' buổi/tuần</b>, mỗi buổi '+perSession+'h)';
      }
    }
    box.innerHTML = html;
    box.style.display = 'block';
  }
  [gfStart, gfTarget, gfHoursTotal, gfHoursSession].forEach(inp=>{
    inp.addEventListener('input', updateGoalComputedBox);
  });

  function openGoalModalNew(){
    editingGoalId = null;
    document.getElementById('goalModalTitle').textContent = 'Thêm mục tiêu';
    gfName.value = '';
    if (window.DateInput && typeof window.DateInput.setValue === 'function') {
      window.DateInput.setValue(gfStart, todayISO());
      window.DateInput.setValue(gfTarget, '');
    } else {
      gfStart.value = todayISO();
      gfTarget.value = '';
    }
    gfHoursTotal.value = '';
    gfHoursSession.value = '1.5';
    gfNote.value = '';
    setPendingType(currentTab!=='all' ? currentTab : 'certificate');
    document.getElementById('goalComputedBox').style.display = 'none';
    openOverlay(goalOverlay);
    setTimeout(()=>gfName.focus(), 50);
  }

  function openGoalModalEdit(id){
    const g = goals.find(x=>x.id===id);
    if(!g) return;
    editingGoalId = id;
    document.getElementById('goalModalTitle').textContent = 'Sửa mục tiêu';
    gfName.value = g.name;
    if (window.DateInput && typeof window.DateInput.setValue === 'function') {
      window.DateInput.setValue(gfStart, g.startDate || '');
      window.DateInput.setValue(gfTarget, g.targetDate || '');
    } else {
      gfStart.value = g.startDate;
      gfTarget.value = g.targetDate;
    }
    gfHoursTotal.value = g.hoursTotal!=null ? g.hoursTotal : '';
    gfHoursSession.value = g.hoursPerSession!=null ? g.hoursPerSession : '';
    gfNote.value = g.note || '';
    setPendingType(g.type);
    updateGoalComputedBox();
    openOverlay(goalOverlay);
  }

  function openOverlay(el){ el.classList.add('open'); }
  function closeOverlay(el){ el.classList.remove('open'); }

  document.getElementById('addGoalBtn').addEventListener('click', openGoalModalNew);
  document.getElementById('goalCancelBtn').addEventListener('click', ()=>closeOverlay(goalOverlay));
  goalOverlay.addEventListener('click', (e)=>{ if(e.target===goalOverlay) closeOverlay(goalOverlay); });

  document.getElementById('goalSaveBtn').addEventListener('click', ()=>{
    const name = gfName.value.trim();
    if(!name){ gfName.focus(); gfName.style.borderColor='var(--red)'; return; }
    const startIso = window.DateInput && typeof window.DateInput.getValue === 'function' ? window.DateInput.getValue(gfStart) : gfStart.value;
    const targetIso = window.DateInput && typeof window.DateInput.getValue === 'function' ? window.DateInput.getValue(gfTarget) : gfTarget.value;
    if(!startIso || !targetIso){ gfTarget.style.borderColor='var(--red)'; return; }
    if(parseDateInput(targetIso) <= parseDateInput(startIso)){ gfTarget.style.borderColor='var(--red)'; return; }

    if(editingGoalId){
      const g = goals.find(x=>x.id===editingGoalId);
      g.type = pendingType;
      g.name = name;
      g.startDate = startIso;
      g.targetDate = targetIso;
      g.hoursTotal = gfHoursTotal.value!=='' ? Number(gfHoursTotal.value) : null;
      g.hoursPerSession = gfHoursSession.value!=='' ? Number(gfHoursSession.value) : null;
      g.note = gfNote.value.trim();
    } else {
      goals.push({
        id: 'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),
        type: pendingType,
        name,
        startDate: startIso,
        targetDate: targetIso,
        hoursTotal: gfHoursTotal.value!=='' ? Number(gfHoursTotal.value) : null,
        hoursPerSession: gfHoursSession.value!=='' ? Number(gfHoursSession.value) : null,
        note: gfNote.value.trim(),
        completed: false,
        milestones: [],
        sessions: [],
        createdAt: Date.now()
      });
    }
    persist();
    closeOverlay(goalOverlay);
    renderAll();
  });
  [gfName, gfTarget].forEach(inp=>inp.addEventListener('input', ()=>{ inp.style.borderColor='var(--border)'; }));

  const sessionOverlay = document.getElementById('sessionOverlay');
  const sfDate = document.getElementById('sf-date');
  const sfHours = document.getElementById('sf-hours');
  const sfNote = document.getElementById('sf-note');

  function openSessionModal(goalId){
    const g = goals.find(x=>x.id===goalId);
    if(!g) return;
    sessionModalGoalId = goalId;
    document.getElementById('sessionGoalName').textContent = g.name;
    if (window.DateInput && typeof window.DateInput.setValue === 'function') {
      window.DateInput.setValue(sfDate, todayISO());
    } else {
      sfDate.value = todayISO();
    }
    sfHours.value = g.hoursPerSession!=null ? g.hoursPerSession : '';
    sfNote.value = '';
    openOverlay(sessionOverlay);
    setTimeout(()=>sfHours.focus(), 50);
  }
  document.getElementById('sessionCancelBtn').addEventListener('click', ()=>closeOverlay(sessionOverlay));
  sessionOverlay.addEventListener('click', (e)=>{ if(e.target===sessionOverlay) closeOverlay(sessionOverlay); });
  document.getElementById('sessionSaveBtn').addEventListener('click', ()=>{
    const g = goals.find(x=>x.id===sessionModalGoalId);
    if(!g) return;
    const hours = Number(sfHours.value);
    const sessionDateIso = window.DateInput && typeof window.DateInput.getValue === 'function' ? window.DateInput.getValue(sfDate) : sfDate.value;
    if(!sessionDateIso || !hours || hours<=0){ sfHours.style.borderColor='var(--red)'; return; }
    g.sessions = g.sessions || [];
    g.sessions.push({
      id:'s_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),
      date: sessionDateIso,
      hours,
      note: sfNote.value.trim()
    });
    persist();
    closeOverlay(sessionOverlay);
    renderAll();
  });
  sfHours.addEventListener('input', ()=>{ sfHours.style.borderColor='var(--border)'; });

  document.getElementById('goalGrid').addEventListener('click', (e)=>{
    const t = e.target;
    const action = t.dataset.action;
    if(!action) return;
    const id = t.dataset.id;

    if(action==='edit-goal'){ openGoalModalEdit(id); return; }
    if(action==='delete-goal'){
      if(confirm('Xoá mục tiêu này? Toàn bộ mốc nhỏ và lịch sử buổi học sẽ mất.')){
        goals = goals.filter(g=>g.id!==id);
        persist(); renderAll();
      }
      return;
    }
    if(action==='toggle-complete'){
      const g = goals.find(x=>x.id===id);
      if(g){ g.completed = !g.completed; persist(); renderAll(); }
      return;
    }
    if(action==='log-session'){ openSessionModal(id); return; }

    if(action==='toggle-milestones'){
      expandedMilestones[id] = !expandedMilestones[id];
      renderGoalGrid();
      return;
    }
    if(action==='toggle-sessions'){
      expandedSessions[id] = !expandedSessions[id];
      renderGoalGrid();
      return;
    }
    if(action==='add-milestone'){
      const card = t.closest('.milestones-body');
      const titleInp = card.querySelector('.m-add-title');
      const dueInp = card.querySelector('.m-add-due');
      const title = titleInp.value.trim();
      const dueIso = getInputDateIso(dueInp);
      if(!title || !dueIso){ titleInp.style.borderColor = title? 'var(--border)':'var(--red)'; dueInp.style.borderColor = dueIso?'var(--border)':'var(--red)'; return; }
      const g = goals.find(x=>x.id===id);
      g.milestones = g.milestones || [];
      g.milestones.push({ id:'m_'+Date.now()+'_'+Math.random().toString(36).slice(2,7), title, due: dueIso, done:false });
      expandedMilestones[id] = true;
      persist(); renderAll();
      return;
    }
    if(action==='delete-milestone'){
      const mid = t.dataset.mid;
      const g = goals.find(x=>x.id===id);
      if(g){ g.milestones = (g.milestones||[]).filter(m=>m.id!==mid); expandedMilestones[id]=true; persist(); renderAll(); }
      return;
    }
    if(action==='delete-session'){
      const sid = t.dataset.sid;
      const g = goals.find(x=>x.id===id);
      if(g){ g.sessions = (g.sessions||[]).filter(s=>s.id!==sid); expandedSessions[id]=true; persist(); renderAll(); }
      return;
    }
  });

  document.getElementById('goalGrid').addEventListener('change', (e)=>{
    const t = e.target;
    if(t.dataset.action==='toggle-milestone'){
      const id = t.dataset.id, mid = t.dataset.mid;
      const g = goals.find(x=>x.id===id);
      const m = g && (g.milestones||[]).find(mm=>mm.id===mid);
      if(m){ m.done = t.checked; expandedMilestones[id]=true; persist(); renderAll(); }
    }
  });

  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(goals, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'muc-tieu-hoc-tap.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(confirm('Xoá toàn bộ mục tiêu, mốc nhỏ và lịch sử buổi học? Không thể hoàn tác.')){
      goals = [];
      persist();
      renderAll();
    }
  });

  function initializeGoals() {
    loadGoals().then(() => {
      renderAll();
      attachSharedDateInputs();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.gpxAuth && window.gpxAuth.currentUser) {
      initializeGoals();
      return;
    }
    document.addEventListener('gpx-ready', initializeGoals, { once: true });
  });
})();
