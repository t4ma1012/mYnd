(function(){
  const DOW_LABELS = ['CN','T2','T3','T4','T5','T6','T7'];
  const DAY_HEAD_LABELS = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
  const COLORS = [
    {name:'Đỏ san hô',      hex:'#E56161'},
    {name:'Cam đất',        hex:'#E49D81'},
    {name:'Cam nghệ',       hex:'#E5AD61'},
    {name:'Vàng chanh',     hex:'#E4D681'},
    {name:'Vàng chanh non', hex:'#D2E561'},
    {name:'Xanh lá mạ',     hex:'#BAE481'},
    {name:'Xanh lá cây',    hex:'#87E561'},
    {name:'Xanh lá non',    hex:'#81E484'},
    {name:'Xanh ngọc lá',   hex:'#61E587'},
    {name:'Xanh bạc hà',    hex:'#81E4BA'},
    {name:'Xanh ngọc',      hex:'#61E5D2'},
    {name:'Xanh trời nhạt', hex:'#81D6E4'},
    {name:'Xanh dương',     hex:'#61ADE5'},
    {name:'Xanh tím nhạt',  hex:'#819DE4'},
    {name:'Chàm',           hex:'#6161E5'},
    {name:'Tím oải hương',  hex:'#9D81E4'},
    {name:'Tím',            hex:'#AD61E5'},
    {name:'Tím hồng',       hex:'#D681E4'},
    {name:'Hồng cánh sen',  hex:'#E561D2'},
    {name:'Hồng phấn',      hex:'#E481BA'},
    {name:'Hồng đào',       hex:'#E56187'},
  ];
  const HOUR_START = 0;
  const HOUR_END = 24;
  const HOUR_H = 64;

  let events = [];
  let currentWeekStart = mondayOf(new Date());
  let miniMonth = new Date();
  let editingId = null;
  let pendingType = 'once';

  function mondayOf(d){
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = x.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    x.setDate(x.getDate() + diff);
    return x;
  }
  function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function fmtISO(d){
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function sameDate(a,b){ return fmtISO(a)===fmtISO(b); }
  function todayISO(){ return fmtISO(new Date()); }
  function timeToMinutes(t){ const [h,m] = t.split(':').map(Number); return h*60+m; }
  function minutesLabel(mins){
    const h = Math.floor(mins/60), m = mins%60;
    return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
  }
  function hexToRgb(hex){
    const v = hex.replace('#','');
    return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)];
  }
  function darken(hex, amt){
    const [r,g,b] = hexToRgb(hex);
    const f = c => Math.max(0, Math.min(255, Math.round(c*(1-amt))));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  function storageGetRaw(key){ return window.Store.storageGetRaw(key); }
  function storageSetRaw(key, value){ return window.Store.storageSetRaw(key, value); }

  function normalizeEvent(event){
    if(!event || typeof event !== 'object') return event;
    const normalized = { ...event };
    if(Array.isArray(normalized.dows)){
      normalized.dows = normalized.dows
        .map(v => Number(v))
        .filter(v => Number.isInteger(v) && v >= 0 && v <= 6)
        .filter((v, idx, arr) => arr.indexOf(v) === idx);
    } else if(typeof normalized.dow === 'number'){
      normalized.dows = [Number(normalized.dow)];
    } else if(Array.isArray(normalized.dow)){
      normalized.dows = normalized.dow.map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6);
    } else {
      normalized.dows = [];
    }
    delete normalized.dow;
    normalized.note = typeof normalized.note === 'string' ? normalized.note : '';
    return normalized;
  }

  async function loadEvents(){
    const raw = await storageGetRaw('calendar-events-v1');
    events = (raw ? JSON.parse(raw) : []).map(normalizeEvent);
    persist();
    renderAll();
  }
  let saveTimer = null;
  function persist(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(()=>{ storageSetRaw('calendar-events-v1', JSON.stringify(events)); }, 250);
  }

  const QKEYS = ['q1','q2','q3','q4'];
  function emptyQuadrants(){ return {q1:[], q2:[], q3:[], q4:[]}; }
  let todoData = { general: emptyQuadrants(), byDate: {} };
  let todoMode = 'general';
  let todoDate = new Date();

  async function loadTodos(){
    const raw = await storageGetRaw('todo-matrix-v1');
    if(raw){
      try{
        const parsed = JSON.parse(raw);
        todoData.general = Object.assign(emptyQuadrants(), parsed.general||{});
        todoData.byDate = parsed.byDate || {};
      }catch(e){ todoData = { general: emptyQuadrants(), byDate:{} }; }
    }
    rolloverUnfinishedTasks();
    renderTodoPanel();
  }
  let todoSaveTimer = null;
  function persistTodos(){
    clearTimeout(todoSaveTimer);
    todoSaveTimer = setTimeout(()=>{ storageSetRaw('todo-matrix-v1', JSON.stringify(todoData)); }, 250);
  }

  function rolloverUnfinishedTasks(){
    const today = fmtISO(new Date());
    const todayBucket = todoData.byDate[today] || emptyQuadrants();
    if(!todoData.byDate[today]) todoData.byDate[today] = todayBucket;
    
    const datesToProcess = Object.keys(todoData.byDate).filter(dateKey => dateKey < today);
    
    for(const oldDate of datesToProcess){
      const oldBucket = todoData.byDate[oldDate];
      if(!oldBucket) continue;
      
      for(const qkey of QKEYS){
        const oldTasks = oldBucket[qkey] || [];
        const unfinishedTasks = [];
        const finishedTasks = [];
        
        for(const task of oldTasks){
          if(task.done){
            finishedTasks.push(task);
          } else {
            unfinishedTasks.push(task);
          }
        }
        
        for(const task of unfinishedTasks){
          if(!task.rolledFrom){
            task.rolledFrom = oldDate;
          }
          todayBucket[qkey].push(task);
        }
        
        oldBucket[qkey] = finishedTasks;
      }
    }
    
    persistTodos();
  }

  function currentTodoBucket(){
    if(todoMode === 'general') return todoData.general;
    const iso = fmtISO(todoDate);
    if(!todoData.byDate[iso]) todoData.byDate[iso] = emptyQuadrants();
    return todoData.byDate[iso];
  }

  function addTodo(qkey, text){
    text = text.trim();
    if(!text) return;
    const bucket = currentTodoBucket();
    bucket[qkey].push({ id: 'td_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), text, done:false });
    persistTodos();
    renderTodoPanel();
  }
  function toggleTodo(qkey, id){
    const bucket = currentTodoBucket();
    const item = bucket[qkey].find(t=>t.id===id);
    if(item){ item.done = !item.done; persistTodos(); renderTodoPanel(); }
  }
  function deleteTodo(qkey, id){
    const bucket = currentTodoBucket();
    bucket[qkey] = bucket[qkey].filter(t=>t.id!==id);
    persistTodos();
    renderTodoPanel();
  }

  function renderTodoPanel(){
    document.getElementById('todoDayNav').style.display = todoMode==='daily' ? 'flex' : 'none';
    if(todoMode==='daily'){
      const isToday = sameDate(todoDate, new Date());
      document.getElementById('todoDayLabel').textContent = isToday ? 'Hôm nay' : DAY_HEAD_LABELS[todoDate.getDay()];
      document.getElementById('todoDaySub').textContent = `${todoDate.getDate()}/${todoDate.getMonth()+1}/${todoDate.getFullYear()}`;
    }
    const bucket = currentTodoBucket();
    QKEYS.forEach(qk=>{
      const listEl = document.querySelector(`.q-list[data-q="${qk}"]`);
      listEl.innerHTML = '';
      const items = bucket[qk] || [];
      if(items.length===0){
        listEl.innerHTML = '<div class="q-empty">Chưa có việc nào.</div>';
        return;
      }
      items.forEach(t=>{
        const row = document.createElement('div');
        row.className = 'q-item' + (t.done ? ' done':'');
        const rolledBadge = t.rolledFrom ? `<span class="rolled-badge">⏰ Từ ${t.rolledFrom}</span>` : '';
        row.innerHTML = `
          <input type="checkbox" ${t.done?'checked':''}>
          <div class="q-text">${escapeHtml(t.text)}${rolledBadge}</div>
          <div class="q-del">✕</div>
        `;
        row.querySelector('input').addEventListener('change', ()=> toggleTodo(qk, t.id));
        row.querySelector('.q-del').addEventListener('click', ()=> deleteTodo(qk, t.id));
        listEl.appendChild(row);
      });
    });
  }

  document.getElementById('todoTabGeneral').addEventListener('click', ()=>{
    todoMode = 'general';
    document.getElementById('todoTabGeneral').classList.add('active');
    document.getElementById('todoTabDaily').classList.remove('active');
    renderTodoPanel();
  });
  document.getElementById('todoTabDaily').addEventListener('click', ()=>{
    todoMode = 'daily';
    document.getElementById('todoTabDaily').classList.add('active');
    document.getElementById('todoTabGeneral').classList.remove('active');
    renderTodoPanel();
  });
  document.getElementById('todoPrevDay').addEventListener('click', ()=>{
    todoDate = addDays(todoDate, -1); renderTodoPanel();
  });
  document.getElementById('todoNextDay').addEventListener('click', ()=>{
    todoDate = addDays(todoDate, 1); renderTodoPanel();
  });
  document.querySelectorAll('.q-add input').forEach(inp=>{
    inp.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        addTodo(inp.dataset.q, inp.value);
        inp.value = '';
      }
    });
  });
  document.getElementById('toggleTodo').addEventListener('click', ()=>{
    document.getElementById('todoPanel').classList.toggle('collapsed');
  });

  function occurrencesOn(d){
    const iso = fmtISO(d);
    const dow = d.getDay();
    const out = [];
    for(const ev of events){
      if(ev.recurring){
        const dows = Array.isArray(ev.dows) ? ev.dows : (typeof ev.dow === 'number' ? [ev.dow] : []);
        if(!dows.includes(dow)) continue;
        if(ev.recurStart && iso < ev.recurStart) continue;
        if(ev.recurEnd && iso > ev.recurEnd) continue;
        out.push(ev);
      } else {
        if(ev.date === iso) out.push(ev);
      }
    }
    return out;
  }

  function renderHeaderLabel(){
    const start = currentWeekStart, end = addDays(currentWeekStart,6);
    const sameMonth = start.getMonth()===end.getMonth() && start.getFullYear()===end.getFullYear();
    document.getElementById('periodLabel').textContent =
      sameMonth ? `Tháng ${start.getMonth()+1}, ${start.getFullYear()}`
                : `T${start.getMonth()+1} – T${end.getMonth()+1}, ${end.getFullYear()}`;
    document.getElementById('periodSub').textContent =
      `${start.getDate()}/${start.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1}`;
  }

  function renderWeekHead(){
    const head = document.getElementById('weekHead');
    head.innerHTML = '<div class="corner"></div>';
    for(let i=0;i<7;i++){
      const d = addDays(currentWeekStart, i);
      const isToday = sameDate(d, new Date());
      const div = document.createElement('div');
      div.className = 'day-head' + (isToday ? ' is-today' : '');
      div.innerHTML = `<div class="dow">${DOW_LABELS[d.getDay()]}</div><div class="num">${d.getDate()}</div>`;
      head.appendChild(div);
    }
  }

  function renderGridBody(){
    const body = document.getElementById('gridBody');
    body.innerHTML = '';
    const totalHours = HOUR_END - HOUR_START;
    body.style.setProperty('--rows', totalHours);

    const timeCol = document.createElement('div');
    timeCol.className = 'time-col';
    timeCol.style.height = (totalHours*HOUR_H)+'px';
    for(let h=HOUR_START; h<HOUR_END; h++){
      const cell = document.createElement('div');
      cell.className = 'time-cell';
      cell.innerHTML = `<span>${String(h).padStart(2,'0')}:00</span>`;
      timeCol.appendChild(cell);
    }
    body.appendChild(timeCol);

    for(let i=0;i<7;i++){
      const d = addDays(currentWeekStart, i);
      const isToday = sameDate(d, new Date());
      const isWeekend = d.getDay()===0 || d.getDay()===6;
      const col = document.createElement('div');
      col.className = 'day-col' + (isWeekend?' weekend-col':'') + (isToday?' today-col':'');
      col.style.height = (totalHours*HOUR_H)+'px';

      for(let h=HOUR_START; h<HOUR_END; h++){
        for(let half=0; half<2; half++){
          const hit = document.createElement('div');
          hit.className = 'slot-hit';
          hit.style.top = (((h-HOUR_START)+half*0.5)*HOUR_H)+'px';
          hit.style.height = (HOUR_H/2)+'px';
          const startM = h*60+half*30;
          hit.addEventListener('click', ()=> openModalForSlot(d, startM));
          col.appendChild(hit);
        }
      }

      if(isToday){
        const now = new Date();
        const mins = now.getHours()*60+now.getMinutes();
        if(mins >= HOUR_START*60 && mins <= HOUR_END*60){
          const line = document.createElement('div');
          line.className = 'now-line';
          line.style.top = ((mins - HOUR_START*60)/60*HOUR_H)+'px';
          col.appendChild(line);
        }
      }

      const dayEvents = occurrencesOn(d)
        .map(ev=>({ev, s: timeToMinutes(ev.start), e: timeToMinutes(ev.end)}))
        .sort((a,b)=> a.s-b.s || a.e-b.e);
      const cols = packColumns(dayEvents);
      const maxCols = cols.reduce((m,c)=>Math.max(m,c.col+1),0) || 1;

      dayEvents.forEach((item, idx)=>{
        const {ev, s, e} = item;
        const colIndex = cols[idx].col;
        const clampedS = Math.max(s, HOUR_START*60);
        const clampedE = Math.min(e, HOUR_END*60);
        if(clampedE <= clampedS) return;
        const top = (clampedS - HOUR_START*60)/60*HOUR_H;
        const height = Math.max(20, (clampedE - clampedS)/60*HOUR_H - 2);
        const widthPct = 100/maxCols;
        const block = document.createElement('div');
        const compact = height < 34;
        const showNote = !!(ev.note && !compact && height >= 54);
        block.className = 'event-block' + (compact ? ' compact' : '');
        block.style.top = top+'px';
        block.style.height = height+'px';
        block.style.left = `calc(${colIndex*widthPct}% + 2px)`;
        block.style.width = `calc(${widthPct}% - 4px)`;
        block.style.background = ev.color;
        block.style.borderLeftColor = darken(ev.color, 0.35);
        block.innerHTML = `
          <div class="e-title">${escapeHtml(ev.title)}</div>
          ${!compact ? `
            <div class="e-time">${ev.start}–${ev.end}</div>
            ${ev.location ? `<div class="e-loc">📍 ${escapeHtml(ev.location)}</div>` : ''}
            ${showNote ? `<div class="e-note">${escapeHtml(ev.note)}</div>` : ''}
          ` : ''}
        `;
        block.addEventListener('click', (ev2)=>{ ev2.stopPropagation(); openModalForEdit(ev, d); });
        col.appendChild(block);
      });

      body.appendChild(col);
    }
  }

  function packColumns(sortedItems){
    const colsEnd = [];
    const result = [];
    sortedItems.forEach(item=>{
      let placed = false;
      for(let c=0;c<colsEnd.length;c++){
        if(colsEnd[c] <= item.s){
          colsEnd[c] = item.e;
          result.push({col:c});
          placed = true;
          break;
        }
      }
      if(!placed){
        colsEnd.push(item.e);
        result.push({col: colsEnd.length-1});
      }
    });
    return result;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderMiniCal(){
    const label = document.getElementById('miniLabel');
    label.textContent = `Tháng ${miniMonth.getMonth()+1}/${miniMonth.getFullYear()}`;
    const grid = document.getElementById('miniGrid');
    grid.innerHTML = '';
    ['CN','T2','T3','T4','T5','T6','T7'].forEach(l=>{
      const el = document.createElement('div');
      el.className = 'mini-dow';
      el.textContent = l;
      grid.appendChild(el);
    });
    const firstOfMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth(), 1);
    const startGrid = addDays(firstOfMonth, -firstOfMonth.getDay());
    const weekEnd = addDays(currentWeekStart,6);

    for(let i=0;i<42;i++){
      const d = addDays(startGrid, i);
      const el = document.createElement('div');
      let cls = 'mini-day';
      if(d.getMonth() !== miniMonth.getMonth()) cls += ' other-month';
      if(sameDate(d, new Date())) cls += ' today';
      if(d >= currentWeekStart && d <= weekEnd) cls += ' selected-week';
      el.className = cls;
      el.textContent = d.getDate();
      if(occurrencesOn(d).length>0){
        const dot = document.createElement('div');
        dot.className = 'dot';
        el.appendChild(dot);
      }
      el.addEventListener('click', ()=>{
        currentWeekStart = mondayOf(d);
        renderAll();
      });
      grid.appendChild(el);
    }
  }

  function renderTodayList(){
    const list = document.getElementById('todayList');
    list.innerHTML = '';
    const todays = occurrencesOn(new Date()).sort((a,b)=>timeToMinutes(a.start)-timeToMinutes(b.start));
    if(todays.length===0){
      list.innerHTML = '<div class="empty-note">Chưa có sự kiện nào.</div>';
      return;
    }
    todays.forEach(ev=>{
      const item = document.createElement('div');
      item.className = 'today-item';
      item.innerHTML = `<div class="chip" style="background:${ev.color}"></div>
        <div><div class="t-title">${escapeHtml(ev.title)}</div><div class="t-time">${ev.start}–${ev.end}</div></div>`;
      item.addEventListener('click', ()=> openModalForEdit(ev, new Date()));
      list.appendChild(item);
    });
  }

  function renderLegend(){
    const grid = document.getElementById('legendGrid');
    grid.innerHTML = '';
    COLORS.forEach(c=>{
      const sw = document.createElement('div');
      sw.className = 'legend-swatch';
      sw.style.background = c.hex;
      sw.title = c.name;
      grid.appendChild(sw);
    });
  }

  function renderAll(){
    renderHeaderLabel();
    renderWeekHead();
    renderGridBody();
    renderMiniCal();
    renderTodayList();
  }

  const overlay = document.getElementById('overlay');
  const fTitle = document.getElementById('f-title');
  const fLocation = document.getElementById('f-location');
  const fNote = document.getElementById('f-note');
  const fDate = document.getElementById('f-date');
  const fRecurStart = document.getElementById('f-recur-start');
  const fRecurEnd = document.getElementById('f-recur-end');
  const fStart = document.getElementById('f-start');
  const fEnd = document.getElementById('f-end');
  const swatchesWrap = document.getElementById('f-swatches');
  const dowCheckboxes = Array.from(document.querySelectorAll('.dow-check input'));
  const dowCheckWrap = document.getElementById('dowChecks');
  let selectedColor = COLORS[0].hex;

  function getSelectedDows(){
    return dowCheckboxes.filter(box => box.checked).map(box => Number(box.value));
  }
  function setSelectedDows(dows){
    const values = Array.isArray(dows) ? dows.map(Number) : [];
    dowCheckboxes.forEach(box => {
      box.checked = values.includes(Number(box.value));
    });
    if(dowCheckWrap) dowCheckWrap.style.outline = 'none';
  }

  function buildSwatches(){
    swatchesWrap.innerHTML = '';
    COLORS.forEach(c=>{
      const sw = document.createElement('div');
      sw.className = 'swatch' + (c.hex===selectedColor ? ' active':'');
      sw.style.background = c.hex;
      sw.title = c.name;
      sw.addEventListener('click', ()=>{ selectedColor = c.hex; buildSwatches(); });
      swatchesWrap.appendChild(sw);
    });
  }

  function setSegType(type){
    pendingType = type;
    document.getElementById('seg-once').classList.toggle('active', type==='once');
    document.getElementById('seg-weekly').classList.toggle('active', type==='weekly');
    document.getElementById('onceFields').style.display = type==='once' ? 'block':'none';
    document.getElementById('weeklyFields').classList.toggle('show', type==='weekly');
  }
  document.getElementById('seg-once').addEventListener('click', ()=>setSegType('once'));
  document.getElementById('seg-weekly').addEventListener('click', ()=>setSegType('weekly'));

  function openModal(){
    overlay.classList.add('open');
  }
  function closeModal(){
    overlay.classList.remove('open');
    editingId = null;
  }

  function openModalForSlot(date, startMinutes){
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Sự kiện mới';
    document.getElementById('deleteBtn').style.display = 'none';
    fTitle.value = '';
    fLocation.value = '';
    fNote.value = '';
    selectedColor = COLORS[Math.floor(Math.random()*COLORS.length)].hex;
    buildSwatches();
    setSegType('once');
    fDate.value = fmtISO(date);
    setSelectedDows([]);
    fRecurStart.value = fmtISO(date);
    fRecurEnd.value = '';
    fStart.value = minutesLabel(startMinutes);
    fEnd.value = minutesLabel(Math.min(startMinutes+60, HOUR_END*60));
    openModal();
    setTimeout(()=>fTitle.focus(), 50);
  }

  function openModalForEdit(ev, dateClicked){
    editingId = ev.id;
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa sự kiện';
    document.getElementById('deleteBtn').style.display = 'block';
    fTitle.value = ev.title;
    fLocation.value = ev.location || '';
    fNote.value = ev.note || '';
    selectedColor = ev.color;
    buildSwatches();
    setSegType(ev.recurring ? 'weekly' : 'once');
    fDate.value = ev.recurring ? fmtISO(dateClicked) : ev.date;
    setSelectedDows(Array.isArray(ev.dows) ? ev.dows : (typeof ev.dow === 'number' ? [ev.dow] : []));
    fRecurStart.value = ev.recurring ? (ev.recurStart||'') : fmtISO(dateClicked);
    fRecurEnd.value = ev.recurring ? (ev.recurEnd||'') : '';
    fStart.value = ev.start;
    fEnd.value = ev.end;
    openModal();
  }

  document.getElementById('addBtn').addEventListener('click', ()=>{
    const now = new Date();
    let startM = now.getHours()*60 + (now.getMinutes()<30?0:30);
    startM = Math.max(startM, HOUR_START*60);
    openModalForSlot(now, startM);
  });
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(); });

  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const title = fTitle.value.trim();
    if(!title){ fTitle.focus(); fTitle.style.borderColor = 'var(--danger)'; return; }
    if(fStart.value >= fEnd.value){ fEnd.style.borderColor='var(--danger)'; return; }

    if(pendingType === 'weekly'){ 
      const chosenDays = getSelectedDows();
      if(chosenDays.length === 0){
        if(dowCheckWrap) dowCheckWrap.style.outline = '1px solid var(--danger)';
        return;
      }
    }

    const base = {
      id: editingId || ('ev_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      title,
      color: selectedColor,
      location: fLocation.value.trim(),
      note: fNote.value.trim(),
      start: fStart.value,
      end: fEnd.value,
      recurring: pendingType === 'weekly',
    };
    if(base.recurring){
      base.dows = getSelectedDows();
      base.recurStart = fRecurStart.value || todayISO();
      base.recurEnd = fRecurEnd.value || null;
      base.date = null;
    } else {
      base.date = fDate.value || todayISO();
      base.dows = []; base.recurStart = null; base.recurEnd = null;
    }

    if(editingId){
      const idx = events.findIndex(e=>e.id===editingId);
      if(idx>-1) events[idx] = base;
    } else {
      events.push(base);
    }
    persist();
    closeModal();
    renderAll();
  });

  document.getElementById('deleteBtn').addEventListener('click', ()=>{
    if(!editingId) return;
    events = events.filter(e=>e.id!==editingId);
    persist();
    closeModal();
    renderAll();
  });

  [fTitle, fEnd].forEach(inp=> inp.addEventListener('input', ()=> inp.style.borderColor='var(--panel-border)'));

  document.getElementById('prevWeek').addEventListener('click', ()=>{ currentWeekStart = addDays(currentWeekStart,-7); renderAll(); });
  document.getElementById('nextWeek').addEventListener('click', ()=>{ currentWeekStart = addDays(currentWeekStart,7); renderAll(); });
  document.getElementById('todayBtn').addEventListener('click', ()=>{
    currentWeekStart = mondayOf(new Date());
    miniMonth = new Date();
    renderAll();
    scrollToNow();
  });
  document.getElementById('miniPrev').addEventListener('click', ()=>{
    miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth()-1, 1);
    renderMiniCal();
  });
  document.getElementById('miniNext').addEventListener('click', ()=>{
    miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth()+1, 1);
    renderMiniCal();
  });
  document.getElementById('toggleSidebar').addEventListener('click', ()=>{
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  function scrollToNow(){
    const now = new Date();
    const totalMinutesInDay = (HOUR_END - HOUR_START) * 60;
    const mins = Math.max(0, Math.min(totalMinutesInDay, now.getHours()*60 + now.getMinutes() - HOUR_START*60));
    const scrollEl = document.getElementById('gridScroll');
    scrollEl.scrollTop = Math.max(0, (mins/60*HOUR_H) - 160);
  }

  function initializeCalendar() {
    buildSwatches();
    loadEvents().then(()=> scrollToNow());
    loadTodos();
    setInterval(renderGridBody, 60000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.gpxAuth && window.gpxAuth.currentUser) {
      initializeCalendar();
      return;
    }
    document.addEventListener('gpx-ready', initializeCalendar, { once: true });
  });
})();
