(function(){
  // ---------------- categories (eyeshadow palette) ----------------
  const DEFAULT_EXPENSE_CATS = [
    {key:'quan_ao',  name:'Quần áo',       icon:'👗', color:'#F0899E'},
    {key:'makeup',   name:'Đồ makeup',      icon:'💄', color:'#C9536B'},
    {key:'skincare', name:'Skincare',       icon:'🧴', color:'#F2B6B0'},
    {key:'nuoc_hoa', name:'Nước hoa',       icon:'🌸', color:'#B79CD9'},
    {key:'xe_co',    name:'Xe cộ đi lại',   icon:'🛵', color:'#E0965A'},
    {key:'gia_dung', name:'Đồ gia dụng',    icon:'🏠', color:'#C9A27A'},
    {key:'an_uong',  name:'Ăn uống',        icon:'🍜', color:'#E8B94B'},
    {key:'hoc_tap',  name:'Học tập / sách', icon:'📚', color:'#8FB3D9'},
    {key:'giai_tri', name:'Giải trí / cà phê', icon:'☕', color:'#A9764A'},
    {key:'hoa_don',  name:'Hóa đơn / tiện ích', icon:'💡', color:'#E8D06A'},
    {key:'nha_o',    name:'Nhà ở / thuê trọ', icon:'🛏️', color:'#D98A73'},
    {key:'suc_khoe', name:'Sức khỏe / y tế', icon:'💊', color:'#8FCBB0'},
    {key:'qua_tang', name:'Quà tặng / du lịch', icon:'🎁', color:'#C97FB0'},
    {key:'linh_tinh',name:'Linh tinh khác', icon:'🧾', color:'#B5A79C'},
  ];
  const DEFAULT_INCOME_CATS = [
    {key:'luong_lam',  name:'Lương đi làm',     icon:'💼', color:'#5E9A78'},
    {key:'luong_day',  name:'Lương đi dạy',     icon:'👩‍🏫', color:'#5FAFA0'},
    {key:'hoc_bong',   name:'Học bổng / trợ cấp', icon:'🎓', color:'#D4AF37'},
    {key:'gia_dinh',   name:'Gia đình cho',     icon:'💝', color:'#E17497'},
    {key:'thu_khac',   name:'Thu nhập khác',    icon:'💰', color:'#B8925A'},
  ];

  function normalizeLegacyWishlistItem(item){
    if(!item || typeof item !== 'object') return null;
    if(item.type && item.type !== 'wishlist') return item;
    const history = Array.isArray(item.history) ? item.history.map(h => ({
      date: h.date || todayISO(),
      amount: Number(h.amount || 0),
      note: h.note || ''
    })) : [];
    const savedAmount = Number(item.savedAmount || 0) + history.reduce((sum,h)=>sum + Number(h.amount || 0), 0);
    return {
      id: item.id || ('w_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      name: item.name || item.title || 'Mục mua sắp tới',
      price: Number(item.price || item.amount || 0),
      priority: item.priority || 'vừa',
      note: item.note || item.notes || '',
      purchased: Boolean(item.purchased),
      createdAt: item.createdAt || Date.now(),
      savedAmount: Math.max(0, savedAmount),
      history
    };
  }
  const SAVE_CAT = {key:'tiet_kiem', name:'Tiết kiệm', icon:'🐷', color:'#B8892A'};
  const PALETTE_COLORS = ['#F0899E','#C9536B','#F2B6B0','#B79CD9','#E0965A','#C9A27A','#E8B94B','#8FB3D9','#A9764A','#E8D06A','#D98A73','#8FCBB0','#C97FB0','#B5A79C','#5E9A78','#5FAFA0','#D4AF37','#E17497','#B8925A'];
  function randColor(){ return PALETTE_COLORS[Math.floor(Math.random()*PALETTE_COLORS.length)]; }
  function makeCatKey(){ return 'c_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

  const STORAGE_KEY = 'finance-data-v2';
  const DAILY_FOOD_BUDGET_KEY = 'finance-daily-food-budget-v1';
  const TRANSACTIONS_KEY = 'finance-transactions-v1';
  const BUDGET_LIMITS_KEY = 'finance-budget-limit-v1';
  const DEFAULT_DAILY_FOOD_BUDGET = 80000;
  let data = { transactions: [], wishlist: [], categoryBudgets:{}, planPeriodStart: null };
  let editingTxId = null, editingWishId = null;
  let dailyFoodBudget = DEFAULT_DAILY_FOOD_BUDGET;
  let openWishlistHistoryId = null;
  let openWishlistSaveFormId = null;
  let pendingType = 'income', pendingCategory = null;
  let dashMonth = new Date();

  function expenseCats(){ return data.categories.expense; }
  function incomeCats(){ return data.categories.income; }
  function allCats(){ return [...data.categories.expense, ...data.categories.income, SAVE_CAT]; }
  function catByKey(k){ return allCats().find(c=>c.key===k); }
  function catsForType(type){
    if(type==='income') return incomeCats();
    if(type==='expense') return expenseCats();
    return [SAVE_CAT];
  }

  function fmtVND(n){ return (Math.round(n)||0).toLocaleString('vi-VN') + ' đ'; }
  function pad(n){ return String(n).padStart(2,'0'); }
  function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function monthKey(dateStr){ return dateStr.slice(0,7); }
  function monthKeyOf(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; }
  function monthLabel(key){
    const [y,m] = key.split('-');
    return `Tháng ${Number(m)}/${y}`;
  }
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function dayLabel(dateStr){
    const d = new Date(dateStr+'T00:00:00');
    const dows = ['CN','T2','T3','T4','T5','T6','T7'];
    return `${dows[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  }

  function ensureDataShape(){
    if(!data || typeof data!=='object') data = {};
    if(!Array.isArray(data.transactions)) data.transactions = [];
    if(!Array.isArray(data.wishlist)) data.wishlist = [];
    else data.wishlist = data.wishlist.map(normalizeLegacyWishlistItem).filter(Boolean);
    if(!data.categories || typeof data.categories!=='object') data.categories = {};
    if(!Array.isArray(data.categories.expense)){
      data.categories.expense = JSON.parse(JSON.stringify(DEFAULT_EXPENSE_CATS));
    }
    if(!Array.isArray(data.categories.income)){
      data.categories.income = JSON.parse(JSON.stringify(DEFAULT_INCOME_CATS));
    }
    if(!data.categoryBudgets || typeof data.categoryBudgets!=='object') data.categoryBudgets = {};
    if(data.planPeriodStart===undefined) data.planPeriodStart = null;
  }

  function safeJsonParse(value, fallback){
    if(value == null || value === '') return fallback;
    try{ return JSON.parse(value); }catch(e){ return fallback; }
  }
  function getDailyFoodBudget(){ return Number(dailyFoodBudget) > 0 ? Number(dailyFoodBudget) : DEFAULT_DAILY_FOOD_BUDGET; }
  function setDailyFoodBudget(value){
    const next = Number(value || 0);
    dailyFoodBudget = Number.isFinite(next) && next > 0 ? next : DEFAULT_DAILY_FOOD_BUDGET;
  }
  function getWishlistSavedAmount(item){
    if(!item) return 0;
    const histTotal = Array.isArray(item.history) ? item.history.reduce((sum, h) => sum + Number(h.amount || 0), 0) : 0;
    return Math.max(0, Number(item.savedAmount || 0) + histTotal);
  }
  function addMoneyToWishlist(itemId, amount, note=''){
    const item = data.wishlist.find(w => w.id === itemId);
    if(!item) return false;
    const parsed = Number(amount || 0);
    if(!Number.isFinite(parsed) || parsed <= 0) return false;
    item.savedAmount = Number(item.savedAmount || 0) + parsed;
    item.history = Array.isArray(item.history) ? item.history : [];
    item.history.push({ date: todayISO(), amount: parsed, note: String(note || '').trim() });
    item.purchased = Number(item.savedAmount) >= Number(item.price || 0);
    return true;
  }
  function formatShortDate(dateValue){
    if(!dateValue) return '';
    const dt = new Date(dateValue.includes('/') ? dateValue.split('/').reverse().join('-') + 'T00:00:00' : dateValue + 'T00:00:00');
    return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()}`;
  }

  async function loadData(){
    let loaded = null;
    try{
      const raw = await window.Store.storageGetRaw(STORAGE_KEY);
      if(raw) loaded = safeJsonParse(raw, null);
    }catch(e){ }
    if(loaded) data = loaded;
    const budgetRaw = await window.Store.storageGetRaw(BUDGET_LIMITS_KEY);
    if(budgetRaw) data.categoryBudgets = safeJsonParse(budgetRaw, data.categoryBudgets || {});
    const transactionsRaw = await window.Store.storageGetRaw(TRANSACTIONS_KEY);
    if(transactionsRaw) data.transactions = safeJsonParse(transactionsRaw, data.transactions || []);
    const dailyBudgetRaw = await window.Store.storageGetRaw(DAILY_FOOD_BUDGET_KEY);
    if(dailyBudgetRaw != null){
      const parsed = Number(dailyBudgetRaw);
      if(Number.isFinite(parsed) && parsed > 0) dailyFoodBudget = parsed;
    } else if(loaded && Number(loaded.dailyFoodBudget) > 0){
      dailyFoodBudget = Number(loaded.dailyFoodBudget);
    }
    ensureDataShape();
    pendingCategory = incomeCats()[0] ? incomeCats()[0].key : null;
    buildPalette();
    renderAll();
  }
  let saveTimer=null;
  function persist(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async ()=>{
      try{
        const payload = { ...data, dailyFoodBudget: getDailyFoodBudget() };
        await window.Store.storageSetRaw(STORAGE_KEY, JSON.stringify(payload));
        await window.Store.storageSetRaw(TRANSACTIONS_KEY, JSON.stringify(data.transactions || []));
        await window.Store.storageSetRaw(BUDGET_LIMITS_KEY, JSON.stringify(data.categoryBudgets || {}));
        await window.Store.storageSetRaw(DAILY_FOOD_BUDGET_KEY, String(getDailyFoodBudget()));
      }
      catch(e){ console.error('Lỗi lưu dữ liệu', e); showToast('⚠️ Không lưu được dữ liệu — hãy thử xuất file sao lưu.'); }
    }, 250);
  }

  function showToast(msg){
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='.25s'; setTimeout(()=>el.remove(),260); }, 4200);
  }

  function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
  function categorySpentInMonth(catKey, mk){
    return data.transactions.filter(t=>t.type==='expense' && t.category===catKey && monthKey(t.date)===mk)
      .reduce((s,t)=>s+t.amount,0);
  }
  function planPeriodTx(){
    return data.planPeriodStart ? data.transactions.filter(t=>t.date>=data.planPeriodStart) : data.transactions;
  }
  function computePlanStats(){
    const tx = planPeriodTx();
    const income = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const savedIn = tx.filter(t=>t.type==='save_in').reduce((s,t)=>s+t.amount,0);
    const savedOut = tx.filter(t=>t.type==='save_out').reduce((s,t)=>s+t.amount,0);
    const saved = savedIn - savedOut;
    const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const allowance = income - saved;
    const leftover = allowance - expense;
    return {income, saved, expense, allowance, leftover};
  }
  function overBudgetCategories(mk){
    return expenseCats().map(c=>{
      const cap = Number(data.categoryBudgets[c.key])||0;
      if(cap<=0) return null;
      const spent = categorySpentInMonth(c.key, mk);
      if(spent<=cap) return null;
      return {cat:c, spent, cap};
    }).filter(Boolean);
  }

  function totals(){
    let income=0, expense=0, saveIn=0, saveOut=0;
    data.transactions.forEach(t=>{
      if(t.type==='income') income += t.amount;
      else if(t.type==='expense') expense += t.amount;
      else if(t.type==='save_in') saveIn += t.amount;
      else if(t.type==='save_out') saveOut += t.amount;
    });
    const savingsPot = saveIn - saveOut;
    const balance = income - expense - saveIn + saveOut;
    return {income, expense, saveIn, saveOut, savingsPot, balance};
  }

  function renderDashboard(){
    const t = totals();
    document.getElementById('sumBalance').textContent = fmtVND(t.balance);
    document.getElementById('sumIncome').textContent = fmtVND(t.income);
    document.getElementById('sumExpense').textContent = fmtVND(t.expense);
    document.getElementById('sumSavings').textContent = fmtVND(t.savingsPot);

    const mk = monthKeyOf(dashMonth);
    document.getElementById('dashMonthLabel').textContent = monthLabel(mk);
    const monthIncome = data.transactions.filter(x=>x.type==='income' && monthKey(x.date)===mk).reduce((s,x)=>s+x.amount,0);
    const monthExpense = data.transactions.filter(x=>x.type==='expense' && monthKey(x.date)===mk).reduce((s,x)=>s+x.amount,0);
    document.getElementById('sumIncomeFoot').textContent = `${fmtVND(monthIncome)} trong ${monthLabel(mk)}`;
    document.getElementById('sumExpenseFoot').textContent = `${fmtVND(monthExpense)} trong ${monthLabel(mk)}`;

    renderDonut(mk, monthExpense);
    renderRecent();
    renderBudgetAlert(mk);
    renderPlanCard();
    renderFoodCard();
  }

  function renderBudgetAlert(mk){
    const banner = document.getElementById('budgetAlert');
    const over = overBudgetCategories(mk);
    if(over.length===0){ banner.classList.add('hidden'); return; }
    banner.classList.remove('hidden');
    const txt = over.map(o=>`<b>${o.cat.icon} ${escapeHtml(o.cat.name)}</b>: ${fmtVND(o.spent)} / ${fmtVND(o.cap)}`).join(' &nbsp;·&nbsp; ');
    document.getElementById('budgetAlertText').innerHTML = `Vượt ngân sách ${monthLabel(mk)}: ${txt}`;
  }

  function fmtDateVN(iso){
    const d = new Date(iso+'T00:00:00');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  }

  function renderPlanCard(){
    const stats = computePlanStats();
    document.getElementById('planPeriodLabel').textContent = data.planPeriodStart
      ? `theo dõi từ ${fmtDateVN(data.planPeriodStart)}`
      : 'theo dõi từ giao dịch đầu tiên';
    document.getElementById('planIncome').textContent = fmtVND(stats.income);
    document.getElementById('planSavedAmt').textContent = fmtVND(stats.saved);
    document.getElementById('planAllowance').textContent = fmtVND(stats.allowance);
    document.getElementById('planSpent').textContent = fmtVND(stats.expense);
    document.getElementById('planLeftover').textContent = fmtVND(stats.leftover);
    const line = document.getElementById('planLeftoverLine');
    line.classList.toggle('over', stats.leftover<0);
    const bar = document.getElementById('planBar');
    const pct = stats.allowance>0 ? Math.min(100, (stats.expense/stats.allowance)*100) : (stats.expense>0?100:0);
    bar.style.width = pct+'%';
    bar.style.background = stats.leftover<0 ? 'linear-gradient(90deg,#E1607E,#B8425E)' : 'linear-gradient(90deg,#8FCBB0,#5E9A78)';
  }

  function resetPlanPeriod(){
    if(!confirm('Bắt đầu kỳ theo dõi mới từ hôm nay? Kế hoạch sẽ tính lại từ 0 (thu nhập, tiết kiệm, đã chi). Dữ liệu Sổ thu chi cũ vẫn được giữ nguyên, không bị xóa.')) return;
    data.planPeriodStart = todayISO();
    persist();
    renderDashboard(); renderReport();
    showToast('🔄 Đã bắt đầu kỳ theo dõi mới.');
  }

  let foodHeatmapMonth = new Date();

  function buildFoodHeatmapHtml(displayMonth) {
    const dailyBudget = getDailyFoodBudget();
    const todayKey = todayISO();
    const displayMonthKey = monthKeyOf(displayMonth);
    const [displayYear, displayMonthNum] = displayMonthKey.split('-').map(Number);
    const totalDays = daysInMonth(displayYear, displayMonthNum - 1);
    const firstDayOfMonth = new Date(displayYear, displayMonthNum - 1, 1).getDay();
    
    // Build calendar grid
    let cellsHtml = '';
    
    // Day headers (CN-T7)
    const dayHeaders = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    dayHeaders.forEach(header => {
      cellsHtml += `<div class="heatmap-col-header">${header}</div>`;
    });
    
    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      cellsHtml += `<div class="heatmap-cell empty"></div>`;
    }
    
    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      const dayISO = `${displayYear}-${pad(displayMonthNum)}-${pad(day)}`;
      const spentForDay = data.transactions.filter(t => t.type === 'expense' && t.category === 'an_uong' && t.date === dayISO)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const isFuture = dayISO > todayKey;
      const isToday = dayISO === todayKey;
      
      let cellClass = 'heatmap-cell';
      let cellContent = String(day);
      let tooltip = '';
      
      if (isFuture) {
        cellClass += ' future';
      } else if (spentForDay === 0) {
        cellClass += ' zero';
      } else if (spentForDay <= dailyBudget) {
        const ratio = spentForDay / dailyBudget;
        cellClass += ratio > 0.7 ? ' ok-high' : ' ok';
      } else {
        const ratio = spentForDay / dailyBudget;
        cellClass += ratio > 1.4 ? ' over-high' : ' over';
      }
      
      if (isToday) {
        cellClass += ' today';
      }
      
      if (!isFuture) {
        tooltip = `<div class="heatmap-tooltip">Ngày ${pad(day)}/${pad(displayMonthNum)}: ${fmtVND(spentForDay)} / ${fmtVND(dailyBudget)}</div>`;
      }
      
      cellsHtml += `<div class="${cellClass}">${cellContent}${tooltip}</div>`;
    }
    
    return cellsHtml;
  }

  function renderFoodHeatmapMonth() {
    const displayMonthKey = monthKeyOf(foodHeatmapMonth);
    const dailyBudget = getDailyFoodBudget();
    const todayKey = todayISO();
    const currentMonthKey = monthKey(todayKey);
    
    const spentToday = data.transactions.filter(t => t.type === 'expense' && t.category === 'an_uong' && t.date === todayKey).reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const remaining = dailyBudget - spentToday;
    const progress = dailyBudget > 0 ? Math.min(100, (spentToday / dailyBudget) * 100) : 0;
    const isOver = spentToday > dailyBudget;
    const monthFood = data.transactions.filter(t => t.type === 'expense' && t.category === 'an_uong' && monthKey(t.date) === currentMonthKey).reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const body = document.getElementById('foodCardBody');
    body.innerHTML = `
      <div class="fbig" style="color:${isOver ? 'var(--rose)' : 'var(--sage)'};">${fmtVND(spentToday)} / ${fmtVND(dailyBudget)}</div>
      <div class="fsub">${isOver ? 'Đã vượt định mức ăn uống hôm nay' : 'Còn trong định mức ăn uống hôm nay'}</div>
      <div class="progress-track" style="margin-top:14px;background:var(--bg-soft);">
        <div class="progress-fill" style="width:${Math.min(100, progress)}%;background:${isOver ? 'linear-gradient(90deg,#F0899E,#C9536B)' : 'linear-gradient(90deg,#8FCBB0,#5E9A78)'}"></div>
      </div>
      <div class="fmeta">
        <div class="fline"><span>Định mức hôm nay</span><b>${fmtVND(dailyBudget)}</b></div>
        <div class="fline"><span>Đã chi hôm nay</span><b>${fmtVND(spentToday)}</b></div>
        <div class="fline"><span>Đã chi trong tháng</span><b>${fmtVND(monthFood)}</b></div>
      </div>
      ${remaining > 0 ? `
        <div class="food-actions" style="justify-content:flex-start;">
          <div class="fline" style="width:100%;margin-top:4px;">
            <span>Dư:</span>
            <b style="font-family:'JetBrains Mono';color:var(--sage);">${fmtVND(remaining)}</b>
          </div>
        </div>
      ` : `<div class="hint" style="margin-top:12px;">${isOver ? 'Bạn đang vượt định mức ăn uống hôm nay.' : 'Bạn đã dùng hết định mức ăn uống hôm nay.'}</div>`}
      
      <div class="heatmap-wrapper">
        <div class="heatmap-nav">
          <button id="foodPrevBtn">‹</button>
          <div class="month-label" id="foodMonthLabel">${monthLabel(displayMonthKey)}</div>
          <button id="foodNextBtn">›</button>
        </div>
        <div class="heatmap-cal" id="foodHeatmapCal">
          ${buildFoodHeatmapHtml(foodHeatmapMonth)}
        </div>
        <div class="heatmap-legend">
          <div class="heatmap-legend-item"><div class="heatmap-legend-sample" style="background:rgba(120,167,137,0.28);"></div><span>Trong định mức</span></div>
          <div class="heatmap-legend-item"><div class="heatmap-legend-sample" style="background:rgba(120,167,137,0.5);"></div><span>Dùng nhiều (>70%)</span></div>
          <div class="heatmap-legend-item"><div class="heatmap-legend-sample" style="background:rgba(215,123,144,0.28);"></div><span>Vượt định mức</span></div>
          <div class="heatmap-legend-item"><div class="heatmap-legend-sample" style="background:var(--border);"></div><span>Chưa tới</span></div>
        </div>
      </div>
    `;

    // Attach event listeners
    document.getElementById('foodPrevBtn').addEventListener('click', () => {
      foodHeatmapMonth = new Date(foodHeatmapMonth.getFullYear(), foodHeatmapMonth.getMonth() - 1, 1);
      renderFoodHeatmapMonth();
    });

    document.getElementById('foodNextBtn').addEventListener('click', () => {
      foodHeatmapMonth = new Date(foodHeatmapMonth.getFullYear(), foodHeatmapMonth.getMonth() + 1, 1);
      renderFoodHeatmapMonth();
    });
  }

  function renderFoodCard(){
    // Reset to current month when opening food card
    if(monthKeyOf(foodHeatmapMonth) !== monthKey(todayISO())) {
      foodHeatmapMonth = new Date();
    }
    renderFoodHeatmapMonth();
  }

  function renderDonut(mk, monthExpense){
    const byCategory = {};
    data.transactions.filter(x=>x.type==='expense' && monthKey(x.date)===mk).forEach(x=>{
      byCategory[x.category] = (byCategory[x.category]||0) + x.amount;
    });
    const entries = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
    const donut = document.getElementById('donut');
    const legend = document.getElementById('legend');
    document.getElementById('donutAmt').textContent = fmtVND(monthExpense);

    if(entries.length===0){
      donut.style.background = 'var(--bg-soft)';
      legend.innerHTML = '<div class="legend-empty">Chưa có chi tiêu nào tháng này 🎀</div>';
      return;
    }
    let acc = 0;
    const stops = entries.map(([key, amt])=>{
      const cat = catByKey(key) || {color:'#ccc', name:key};
      const start = acc/monthExpense*360;
      acc += amt;
      const end = acc/monthExpense*360;
      return `${cat.color} ${start}deg ${end}deg`;
    });
    donut.style.background = `conic-gradient(${stops.join(',')})`;

    legend.innerHTML = '';
    entries.forEach(([key, amt])=>{
      const cat = catByKey(key) || {color:'#ccc', name:key, icon:'•'};
      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `<div class="dot" style="background:${cat.color}"></div>
        <div class="lname">${cat.icon} ${escapeHtml(cat.name)}</div>
        <div class="lamt">${fmtVND(amt)}</div>`;
      legend.appendChild(row);
    });
  }

  function renderRecent(){
    const list = document.getElementById('recentList');
    const sorted = [...data.transactions].sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0,8);
    if(sorted.length===0){
      list.innerHTML = '<div class="empty-state"><span class="em">🎀</span>Chưa có giao dịch nào — bấm "+ Thêm" để bắt đầu nhé!</div>';
      return;
    }
    list.innerHTML = '';
    sorted.forEach(t=>{
      const cat = catByKey(t.category) || {icon:'💫', color:'#eee', name:t.category};
      const row = document.createElement('div');
      row.className = 'tx-row';
      const sign = t.type==='income' ? '+' : (t.type==='expense' ? '−' : (t.type==='save_in' ? '→' : '←'));
      const cls = t.type==='income' ? 'pos' : (t.type==='expense' ? 'neg' : 'gold');
      row.innerHTML = `
        <div class="tx-icon" style="background:${cat.color}33;">${cat.icon}</div>
        <div class="tx-info">
          <div class="t-name">${escapeHtml(t.note) || cat.name}</div>
          <div class="t-meta">${cat.name} · ${dayLabel(t.date)}</div>
        </div>
        <div class="tx-amt ${cls}">${sign} ${fmtVND(t.amount)}</div>
      `;
      row.addEventListener('click', ()=> openTxModal(t));
      list.appendChild(row);
    });
  }

  function populateFilterOptions(){
    const monthSel = document.getElementById('filterMonth');
    const keys = Array.from(new Set(data.transactions.map(t=>monthKey(t.date)))).sort().reverse();
    const currentVal = monthSel.value || 'all';
    monthSel.innerHTML = '<option value="all">Tất cả thời gian</option>' +
      keys.map(k=>`<option value="${k}">${monthLabel(k)}</option>`).join('');
    if([...monthSel.options].some(o=>o.value===currentVal)) monthSel.value = currentVal;

    const catSel = document.getElementById('filterCategory');
    const currentCat = catSel.value || 'all';
    catSel.innerHTML = '<option value="all">Tất cả danh mục</option>' +
      allCats().map(c=>`<option value="${c.key}">${c.icon} ${c.name}</option>`).join('');
    if([...catSel.options].some(o=>o.value===currentCat)) catSel.value = currentCat;
  }

  function renderLedger(){
    populateFilterOptions();
    const fMonth = document.getElementById('filterMonth').value;
    const fType = document.getElementById('filterType').value;
    const fCat = document.getElementById('filterCategory').value;

    let list = [...data.transactions];
    if(fMonth !== 'all') list = list.filter(t=>monthKey(t.date)===fMonth);
    if(fType !== 'all') list = list.filter(t=>t.type===fType);
    if(fCat !== 'all') list = list.filter(t=>t.category===fCat);
    list.sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    const card = document.getElementById('ledgerCard');
    if(list.length===0){
      card.innerHTML = '<div class="empty-state"><span class="em">📒</span>Không có giao dịch nào khớp bộ lọc.</div>';
      return;
    }
    const groups = {};
    list.forEach(t=>{ (groups[t.date] = groups[t.date]||[]).push(t); });
    const dates = Object.keys(groups).sort().reverse();
    card.innerHTML = '';
    dates.forEach(date=>{
      const items = groups[date];
      const dayNet = items.reduce((s,t)=>{
        if(t.type==='income'||t.type==='save_out') return s+t.amount;
        return s - t.amount;
      },0);
      const dailyBudget = Number(getDailyFoodBudget() || 0);
      const foodSpent = items.filter(t => t.type === 'expense' && t.category === 'an_uong').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const foodDiff = dailyBudget - foodSpent;
      const foodSummary = `🍜 Ăn uống: ${fmtVND(foodSpent)} / ${fmtVND(dailyBudget)} — ${foodDiff >= 0 ? 'dư ' + fmtVND(foodDiff) : 'vượt ' + fmtVND(Math.abs(foodDiff))}`;
      const otherByCategory = {};
      items.filter(t => t.type === 'expense' && t.category !== 'an_uong').forEach(t => {
        otherByCategory[t.category] = (otherByCategory[t.category] || 0) + Number(t.amount || 0);
      });
      const extraLines = Object.entries(otherByCategory).map(([category, total]) => {
        const cat = catByKey(category) || { icon: '💸', name: category };
        return `<div class="day-budget-note other">🎉 ${escapeHtml(cat.name)}: ${fmtVND(total)}</div>`;
      }).join('');
      const wrap = document.createElement('div');
      wrap.className = 'day-group';
      wrap.innerHTML = `
        <div class="day-label">${dayLabel(date)}<span class="day-total">${dayNet>=0?'+':''}${fmtVND(dayNet)}</span></div>
        <div class="day-budget-summary ${foodDiff >= 0 ? 'food-ok' : 'food-over'}">${foodSummary}</div>
        ${extraLines ? `<div class="day-budget-summary other-list">${extraLines}</div>` : ''}
      `;
      const listWrap = document.createElement('div');
      listWrap.className = 'recent-list';
      items.forEach(t=>{
        const cat = catByKey(t.category) || {icon:'💫', color:'#eee', name:t.category};
        const sign = t.type==='income' ? '+' : (t.type==='expense' ? '−' : (t.type==='save_in' ? '→' : '←'));
        const cls = t.type==='income' ? 'pos' : (t.type==='expense' ? 'neg' : 'gold');
        const row = document.createElement('div');
        row.className = 'tx-row';
        row.innerHTML = `
          <div class="tx-icon" style="background:${cat.color}33;">${cat.icon}</div>
          <div class="tx-info">
            <div class="t-name">${escapeHtml(t.note) || cat.name}</div>
            <div class="t-meta">${cat.name}</div>
          </div>
          <div class="tx-amt ${cls}">${sign} ${fmtVND(t.amount)}</div>
        `;
        row.addEventListener('click', ()=> openTxModal(t));
        listWrap.appendChild(row);
      });
      wrap.appendChild(listWrap);
      card.appendChild(wrap);
    });
  }

  function renderWishlist(){
    const grid = document.getElementById('wishGrid');
    const items = [...data.wishlist].map(w => ({ ...w, price: Number(w.price || 0) })).sort((a,b)=>{
      if(a.purchased !== b.purchased) return a.purchased ? 1 : -1;
      const order = {cao:0, 'vừa':1, 'thấp':2};
      return (order[a.priority]??1) - (order[b.priority]??1);
    });
    if(items.length===0){
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="em">💫</span>Chưa có món nào trong wishlist — thêm món bạn đang để dành mua nhé!</div>';
      return;
    }
    grid.innerHTML = '';
    items.forEach(w=>{
      const price = Number(w.price || 0);
      const saved = getWishlistSavedAmount(w);
      const pct = price > 0 ? Math.min(100, (saved / price) * 100) : 0;
      const complete = saved >= price;
      const showHistory = openWishlistHistoryId === w.id;
      const showForm = openWishlistSaveFormId === w.id;
      const history = Array.isArray(w.history) ? w.history.slice().reverse() : [];
      const card = document.createElement('div');
      card.className = 'wish-card' + (complete ? ' purchased' : '');
      card.innerHTML = `
        <div class="wish-top">
          <div class="wish-name">${escapeHtml(w.name)}</div>
          <div class="priority-badge priority-${w.priority}">${w.priority==='cao'?'Ưu tiên cao':w.priority==='vừa'?'Ưu tiên vừa':'Ưu tiên thấp'}</div>
        </div>
        <div class="wish-price">${fmtVND(w.price)}</div>
        ${w.note ? `<div class="wish-note">${escapeHtml(w.note)}</div>` : '<div class="wish-note"></div>'}
        <div class="wish-progress-wrap" data-act="toggle-history">
          ${complete ? `<div class="wish-complete">✅ Đã đủ tiền 🎉</div>` : `<div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${complete ? 'linear-gradient(90deg,#8FCBB0,#5E9A78)' : 'linear-gradient(90deg,#E1607E,#C9536B)'}"></div></div>`}
          <div class="progress-label">${complete ? `Đã tiết kiệm đủ: ${fmtVND(saved)} / ${fmtVND(price)}` : `Đã tiết kiệm ${fmtVND(saved)} / ${fmtVND(price)} (${pct.toFixed(0)}%)`}</div>
        </div>
        ${showHistory && history.length ? `<div class="wish-history-list" style="margin-top:10px;display:flex;flex-direction:column;gap:6px;font-size:11px;color:var(--ink-dim);padding:8px 10px;border:1px solid var(--border-strong);border-radius:8px;background:var(--bg-soft);">${history.map(h => `<div><strong style="color:var(--ink);font-size:10.5px;">${formatShortDate(h.date)}</strong> · ${fmtVND(h.amount)}${h.note ? ` · ${escapeHtml(h.note)}` : ''}</div>`).join('')}</div>` : ''}
        ${showForm ? `
          <div class="wish-inline-form">
            <div class="row">
              <input type="number" data-field="amount" min="0" step="1000" placeholder="Số tiền thêm" />
              <button class="save" data-act="confirm-save">Lưu</button>
              <button class="cancel" data-act="cancel-save">Hủy</button>
            </div>
            <textarea data-field="note" rows="2" placeholder="Ghi chú: dư từ tiền ăn hôm nay, tiết kiệm từ tiền tiêu vặt..."></textarea>
          </div>
        ` : ''}
        <div class="wish-actions">
          ${!complete ? `<button class="buy-btn" data-act="add-save">+ Thêm</button>` : ''}
          <button data-act="edit">Sửa</button>
          <button class="del-btn" data-act="del">Xóa</button>
        </div>
      `;
      card.querySelector('[data-act="edit"]').addEventListener('click', ()=> openWishModal(w));
      const toggleHistory = card.querySelector('[data-act="toggle-history"]');
      if(toggleHistory) toggleHistory.addEventListener('click', () => { openWishlistHistoryId = openWishlistHistoryId === w.id ? null : w.id; renderWishlist(); });
      const addSaveBtn = card.querySelector('[data-act="add-save"]');
      if(addSaveBtn) addSaveBtn.addEventListener('click', ()=> { openWishlistSaveFormId = openWishlistSaveFormId === w.id ? null : w.id; renderWishlist(); });
      const cancelBtn = card.querySelector('[data-act="cancel-save"]');
      if(cancelBtn) cancelBtn.addEventListener('click', ()=> { openWishlistSaveFormId = null; renderWishlist(); });
      const confirmBtn = card.querySelector('[data-act="confirm-save"]');
      if(confirmBtn) confirmBtn.addEventListener('click', ()=> {
        const form = card.querySelector('.wish-inline-form');
        const amountInput = form?.querySelector('[data-field="amount"]');
        const noteInput = form?.querySelector('[data-field="note"]');
        const amount = Number(amountInput?.value || 0);
        const note = noteInput?.value.trim() || '';
        if(!amount || amount <= 0){ if(amountInput) amountInput.focus(); return; }
        addMoneyToWishlist(w.id, amount, note);
        openWishlistSaveFormId = null;
        persist(); renderAll();
      });
      const buyBtn = card.querySelector('[data-act="buy"]');
      if(buyBtn) buyBtn.addEventListener('click', ()=>{ w.purchased = true; persist(); renderAll(); });
      card.querySelector('[data-act="del"]').addEventListener('click', ()=>{
        data.wishlist = data.wishlist.filter(x=>x.id!==w.id);
        persist(); renderAll();
      });
      grid.appendChild(card);
    });
  }

  function renderAll(){ renderDashboard(); renderLedger(); renderWishlist(); renderReport(); renderSettings(); }

  function renderReport(){
    const overviewEl = document.getElementById('reportOverview');
    const budgetTableEl = document.getElementById('reportBudgetTable');
    const dailyEl = document.getElementById('reportDaily');
    const foodEl = document.getElementById('reportFood');
    if(!overviewEl) return;
    const mk = monthKeyOf(dashMonth);
    document.getElementById('reportMonthLabel').textContent = monthLabel(mk);

    const monthTx = data.transactions.filter(t=>monthKey(t.date)===mk);
    const income = monthTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const saveIn = monthTx.filter(t=>t.type==='save_in').reduce((s,t)=>s+t.amount,0);
    const saveOut = monthTx.filter(t=>t.type==='save_out').reduce((s,t)=>s+t.amount,0);
    const allowance = income - (saveIn - saveOut);
    const leftover = allowance - expense;

    overviewEl.innerHTML = `
      <div class="card sum-card income"><div class="icon">📥</div><div class="label">Tổng thu tháng</div><div class="amount">${fmtVND(income)}</div></div>
      <div class="card sum-card expense"><div class="icon">📤</div><div class="label">Tổng chi tháng</div><div class="amount">${fmtVND(expense)}</div></div>
      <div class="card sum-card savings"><div class="icon">🐷</div><div class="label">Tiết kiệm ròng tháng</div><div class="amount">${fmtVND(saveIn-saveOut)}</div></div>
      <div class="card sum-card balance"><div class="icon">🎯</div><div class="label">${leftover<0?'Chi vượt thu tháng này':'Còn dư sau chi tiêu'}</div><div class="amount" style="color:${leftover<0?'var(--rose)':'var(--sage)'}">${fmtVND(leftover)}</div></div>
    `;

    const rows = expenseCats().map(c=>{
      const spent = categorySpentInMonth(c.key, mk);
      const cap = Number(data.categoryBudgets[c.key])||0;
      if(spent<=0 && cap<=0) return null;
      const pct = cap>0 ? Math.min(999,(spent/cap)*100) : null;
      let statusCls='ok', statusTxt='An toàn';
      if(cap>0){
        if(spent>cap){ statusCls='over'; statusTxt='Vượt mức'; }
        else if(pct>=80){ statusCls='warn'; statusTxt='Sắp tới hạn'; }
      } else { statusCls='ok'; statusTxt='Không giới hạn'; }
      return `<div class="budget-row-item">
        <div class="budget-head">
          <span class="bname">${c.icon} ${escapeHtml(c.name)}</span>
          <span class="bstatus ${statusCls}">${statusTxt}</span>
        </div>
        <div class="budget-head" style="margin-bottom:6px;">
          <span class="bnums">${fmtVND(spent)} ${cap>0?`/ ${fmtVND(cap)}`:'(chưa đặt trần)'}</span>
          <span class="bnums">${cap>0?pct.toFixed(0)+'%':''}</span>
        </div>
        <div class="budget-track"><div class="budget-fill" style="width:${cap>0?Math.min(100,pct):(spent>0?100:0)}%;background:${statusCls==='over'?'var(--rose)':statusCls==='warn'?'var(--gold)':'var(--sage)'}"></div></div>
      </div>`;
    }).filter(Boolean);
    budgetTableEl.innerHTML = rows.length ? rows.join('') : '<div class="empty-state" style="padding:24px 0;">Chưa có chi tiêu hoặc mức trần nào trong tháng này.</div>';

    const byDay = {};
    monthTx.filter(t=>t.type==='expense').forEach(t=>{ byDay[t.date]=(byDay[t.date]||0)+t.amount; });
    const dayKeys = Object.keys(byDay).sort();
    if(dayKeys.length===0){
      dailyEl.innerHTML = '<div class="empty-state" style="padding:24px 0;">Chưa có chi tiêu nào trong tháng này.</div>';
    } else {
      const maxAmt = Math.max(...dayKeys.map(k=>byDay[k]));
      dailyEl.innerHTML = dayKeys.map(k=>{
        const d = new Date(k+'T00:00:00');
        return `<div class="day-bar-row">
          <span class="dbl">${pad(d.getDate())}/${pad(d.getMonth()+1)}</span>
          <div class="day-bar-track"><div class="day-bar-fill" style="width:${(byDay[k]/maxAmt*100).toFixed(1)}%"></div></div>
          <span class="day-bar-amt">${fmtVND(byDay[k])}</span>
        </div>`;
      }).join('');
    }

    const foodCat = catByKey('an_uong');
    const foodCap = foodCat ? (Number(data.categoryBudgets['an_uong'])||0) : 0;
    if(!foodCat || foodCap<=0){
      foodEl.innerHTML = '<div class="empty-state" style="padding:20px 0;">Chưa đặt định mức ăn uống hằng tháng (Cài đặt → Danh mục chi tiêu).</div>';
    } else {
      const spent = categorySpentInMonth('an_uong', mk);
      const [y,m] = mk.split('-').map(Number);
      const tdays = daysInMonth(y, m-1);
      const avgPerDaySpent = spent / tdays;
      foodEl.innerHTML = `
        <div class="plan-stats">
          <div class="pline"><span>Định mức tháng</span><b>${fmtVND(foodCap)}</b></div>
          <div class="pline"><span>Đã chi trong tháng</span><b>${fmtVND(spent)}</b></div>
          <div class="pline leftover ${spent>foodCap?'over':''}"><span>Còn lại</span><b>${fmtVND(foodCap-spent)}</b></div>
          <div class="pline"><span>Trung bình mỗi ngày (thực tế)</span><b>${fmtVND(avgPerDaySpent)}</b></div>
          <div class="pline"><span>Trung bình mỗi ngày (định mức)</span><b>${fmtVND(foodCap/tdays)}</b></div>
        </div>
      `;
    }
  }

  function renderSettings(){
    const expEl = document.getElementById('expenseCatList');
    const incEl = document.getElementById('incomeCatList');
    const dailyBudgetInput = document.getElementById('dailyFoodBudgetInput');
    if(dailyBudgetInput) dailyBudgetInput.value = String(getDailyFoodBudget());
    if(!expEl) return;
    expEl.innerHTML = '';
    expenseCats().forEach(c=>{
      const row = document.createElement('div');
      row.className = 'cat-row';
      row.innerHTML = `
        <input type="text" class="icon-input" value="${escapeHtml(c.icon)}" maxlength="4">
        <input type="text" value="${escapeHtml(c.name)}">
        <input type="number" min="0" step="10000" placeholder="Không giới hạn" value="${data.categoryBudgets[c.key] ? data.categoryBudgets[c.key] : ''}">
        <button class="del-x" title="Xóa danh mục">✕</button>
      `;
      const [iconInp, nameInp, budgetInp] = row.querySelectorAll('input');
      iconInp.addEventListener('change', ()=>{ c.icon = iconInp.value.trim()||'🏷️'; persist(); rebuildEverything(); });
      nameInp.addEventListener('change', ()=>{ if(nameInp.value.trim()){ c.name = nameInp.value.trim(); persist(); rebuildEverything(); } });
      budgetInp.addEventListener('change', ()=>{
        const v = Number(budgetInp.value)||0;
        if(v>0) data.categoryBudgets[c.key] = v; else delete data.categoryBudgets[c.key];
        persist(); renderDashboard(); renderReport();
      });
      row.querySelector('.del-x').addEventListener('click', ()=> deleteCategory('expense', c.key));
      expEl.appendChild(row);
    });

    incEl.innerHTML = '';
    incomeCats().forEach(c=>{
      const row = document.createElement('div');
      row.className = 'cat-row';
      row.style.gridTemplateColumns = '44px 1fr auto';
      row.innerHTML = `
        <input type="text" class="icon-input" value="${escapeHtml(c.icon)}" maxlength="4">
        <input type="text" value="${escapeHtml(c.name)}">
        <button class="del-x" title="Xóa danh mục">✕</button>
      `;
      const [iconInp, nameInp] = row.querySelectorAll('input');
      iconInp.addEventListener('change', ()=>{ c.icon = iconInp.value.trim()||'💰'; persist(); rebuildEverything(); });
      nameInp.addEventListener('change', ()=>{ if(nameInp.value.trim()){ c.name = nameInp.value.trim(); persist(); rebuildEverything(); } });
      row.querySelector('.del-x').addEventListener('click', ()=> deleteCategory('income', c.key));
      incEl.appendChild(row);
    });
  }

  function deleteCategory(type, key){
    const list = type==='expense' ? expenseCats() : incomeCats();
    const idx = list.findIndex(c=>c.key===key);
    if(idx<0) return;
    const used = data.transactions.filter(t=>t.category===key);
    const fallbackKey = type==='expense' ? 'linh_tinh' : 'thu_khac';
    const fallbackCat = list.find(c=>c.key===fallbackKey && c.key!==key);
    if(used.length>0){
      const targetCat = fallbackCat || list.find(c=>c.key!==key);
      if(!targetCat){
        alert('Không thể xóa danh mục duy nhất khi vẫn còn giao dịch dùng nó. Hãy thêm danh mục khác trước.');
        return;
      }
      if(!confirm(`Danh mục "${list[idx].name}" đang có ${used.length} giao dịch. Các giao dịch này sẽ được chuyển sang "${targetCat.name}". Tiếp tục xóa?`)) return;
      data.transactions.forEach(t=>{ if(t.category===key) t.category = targetCat.key; });
    } else {
      if(!confirm(`Xóa danh mục "${list[idx].name}"?`)) return;
    }
    list.splice(idx,1);
    delete data.categoryBudgets[key];
    persist();
    rebuildEverything();
  }

  function addCategoryFromForm(type){
    const iconInp = document.getElementById(type==='expense'?'newExpIcon':'newIncIcon');
    const nameInp = document.getElementById(type==='expense'?'newExpName':'newIncName');
    const budgetInp = type==='expense' ? document.getElementById('newExpBudget') : null;
    const name = nameInp.value.trim();
    if(!name){ nameInp.style.borderColor='var(--rose)'; nameInp.focus(); return; }
    const icon = iconInp.value.trim() || (type==='expense'?'🏷️':'💰');
    const key = makeCatKey();
    const cat = {key, name, icon, color:randColor()};
    (type==='expense' ? expenseCats() : incomeCats()).push(cat);
    if(type==='expense' && budgetInp){
      const b = Number(budgetInp.value)||0;
      if(b>0) data.categoryBudgets[key] = b;
    }
    iconInp.value=''; nameInp.value=''; nameInp.style.borderColor='var(--border-strong)'; if(budgetInp) budgetInp.value='';
    persist();
    rebuildEverything();
  }

  function rebuildEverything(){
    buildPalette();
    populateFilterOptions();
    renderAll();
  }

  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
      const addBtn = document.getElementById('addBtn');
      if(btn.dataset.tab==='report' || btn.dataset.tab==='settings'){
        addBtn.style.display = 'none';
      } else {
        addBtn.style.display = '';
        addBtn.textContent = btn.dataset.tab==='wishlist' ? '+ Thêm mong muốn' : '+ Thêm giao dịch';
        addBtn.dataset.tab = btn.dataset.tab;
      }
    });
  });
  document.getElementById('addBtn').textContent = '+ Thêm giao dịch';
  document.getElementById('addBtn').dataset.tab = 'dashboard';
  document.getElementById('addBtn').addEventListener('click', ()=>{
    if(document.getElementById('addBtn').dataset.tab === 'wishlist') openWishModal(null);
    else openTxModal(null);
  });

  function shiftMonth(delta){
    dashMonth = new Date(dashMonth.getFullYear(), dashMonth.getMonth()+delta, 1);
    renderDashboard(); renderReport();
  }
  document.getElementById('dashPrev').addEventListener('click', ()=> shiftMonth(-1));
  document.getElementById('dashNext').addEventListener('click', ()=> shiftMonth(1));
  document.getElementById('reportPrev').addEventListener('click', ()=> shiftMonth(-1));
  document.getElementById('reportNext').addEventListener('click', ()=> shiftMonth(1));

  document.getElementById('resetPlanBtn').addEventListener('click', resetPlanPeriod);
  document.getElementById('addExpCatBtn').addEventListener('click', ()=> addCategoryFromForm('expense'));
  document.getElementById('addIncCatBtn').addEventListener('click', ()=> addCategoryFromForm('income'));

  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `so-chi-tieu-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('✅ Đã xuất file sao lưu.');
  });
  document.getElementById('importFile').addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const parsed = JSON.parse(reader.result);
        if(!confirm('Nhập file này sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?')){ e.target.value=''; return; }
        data = parsed;
        ensureDataShape();
        persist();
        rebuildEverything();
        showToast('✅ Đã nhập dữ liệu thành công.');
      }catch(err){ alert('File không hợp lệ.'); }
      e.target.value='';
    };
    reader.readAsText(file);
  });
  document.getElementById('saveDailyFoodBudgetBtn').addEventListener('click', ()=>{
    const value = Number(document.getElementById('dailyFoodBudgetInput').value || 0);
    if(!Number.isFinite(value) || value <= 0){
      showToast('⚠️ Vui lòng nhập định mức ăn uống mỗi ngày hợp lệ.');
      document.getElementById('dailyFoodBudgetInput').focus();
      return;
    }
    setDailyFoodBudget(value);
    persist();
    renderDashboard();
    renderReport();
    showToast(`✅ Đã lưu định mức ăn uống: ${fmtVND(getDailyFoodBudget())}/ngày`);
  });

  document.getElementById('clearMonthTransactionsBtn').addEventListener('click', ()=>{
    const month = monthKeyOf(new Date());
    const related = data.transactions.filter(t => monthKey(t.date) === month);
    if(!related.length){ showToast('ℹ️ Tháng này chưa có giao dịch nào để xóa.'); return; }
    if(!confirm('Xóa lịch sử thu chi của tháng này? Hành động này chỉ xóa giao dịch của tháng đang xem, không sửa mức ngân sách và không chạm wishlist/tiết kiệm.')) return;
    data.transactions = data.transactions.filter(t => monthKey(t.date) !== month);
    persist();
    renderAll();
    showToast('✅ Đã xóa lịch sử thu chi của tháng này.');
  });

  document.getElementById('resetBudgetLimitBtn').addEventListener('click', ()=>{
    if(!confirm('Thao tác này sẽ xóa mức ngân sách bạn đã đặt, không ảnh hưởng đến lịch sử giao dịch. Tiếp tục?')) return;
    data.categoryBudgets = {};
    persist();
    renderAll();
    showToast('✅ Đã đặt lại mức trần ngân sách.');
  });

  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(!confirm('Xóa TOÀN BỘ dữ liệu (giao dịch, wishlist, danh mục, ngân sách)? Hành động này không thể hoàn tác — hãy xuất file sao lưu trước nếu cần.')) return;
    data = { transactions: [], wishlist: [], categoryBudgets:{}, planPeriodStart: null };
    dailyFoodBudget = DEFAULT_DAILY_FOOD_BUDGET;
    ensureDataShape();
    persist();
    rebuildEverything();
    showToast('🗑️ Đã xóa toàn bộ dữ liệu.');
  });

  ['filterMonth','filterType','filterCategory'].forEach(id=>{
    document.getElementById(id).addEventListener('change', renderLedger);
  });

  const txOverlay = document.getElementById('txOverlay');
  const typeSeg = document.getElementById('typeSeg');
  const paletteGrid = document.getElementById('paletteGrid');
  const categoryField = document.getElementById('categoryField');
  const txAmount = document.getElementById('tx-amount');
  const txDate = document.getElementById('tx-date');
  const txNote = document.getElementById('tx-note');

  function buildPalette(){
    const cats = catsForType(pendingType);
    paletteGrid.innerHTML = '';
    cats.forEach(c=>{
      const wrap = document.createElement('div');
      wrap.className = 'pan-wrap';
      const pan = document.createElement('div');
      pan.className = 'pan' + (c.key===pendingCategory ? ' active':'');
      pan.style.background = `radial-gradient(circle at 35% 30%, ${c.color}, ${c.color})`;
      pan.style.backgroundColor = c.color;
      pan.textContent = c.icon;
      pan.addEventListener('click', ()=>{ pendingCategory = c.key; buildPalette(); });
      const nm = document.createElement('div');
      nm.className = 'pan-name';
      nm.textContent = c.name;
      wrap.appendChild(pan); wrap.appendChild(nm);
      paletteGrid.appendChild(wrap);
    });
    const chosen = catByKey(pendingCategory);
    document.getElementById('categoryChosenName').textContent = chosen ? `Đã chọn: ${chosen.icon} ${chosen.name}` : '';
    categoryField.style.display = (cats.length<=1 && pendingType!=='expense' && pendingType!=='income') ? 'none' : 'block';
    if(pendingType==='save_in' || pendingType==='save_out'){ categoryField.style.display='none'; pendingCategory = SAVE_CAT.key; }
    else categoryField.style.display='block';
  }

  typeSeg.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      pendingType = btn.dataset.type;
      typeSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const cats = catsForType(pendingType);
      pendingCategory = cats[0] ? cats[0].key : null;
      buildPalette();
    });
  });

  function openTxModal(tx){
    editingTxId = tx ? tx.id : null;
    document.getElementById('txModalTitle').textContent = tx ? 'Sửa giao dịch' : 'Thêm giao dịch';
    document.getElementById('txDeleteBtn').style.display = tx ? 'block' : 'none';
    pendingType = tx ? tx.type : 'income';
    pendingCategory = tx ? tx.category : (catsForType(pendingType)[0] ? catsForType(pendingType)[0].key : null);
    typeSeg.querySelectorAll('button').forEach(b=> b.classList.toggle('active', b.dataset.type===pendingType));
    buildPalette();
    txAmount.value = tx ? tx.amount : '';
    txDate.value = tx ? tx.date : todayISO();
    txNote.value = tx ? (tx.note||'') : '';
    txAmount.style.borderColor = 'var(--border-strong)';
    txOverlay.classList.add('open');
  }
  function closeTxModal(){ txOverlay.classList.remove('open'); editingTxId=null; }
  document.getElementById('txCancelBtn').addEventListener('click', closeTxModal);
  txOverlay.addEventListener('click', e=>{ if(e.target===txOverlay) closeTxModal(); });

  document.getElementById('txSaveBtn').addEventListener('click', ()=>{
    const amount = Number(txAmount.value);
    if(!amount || amount<=0){ txAmount.style.borderColor='var(--rose)'; txAmount.focus(); return; }
    if((pendingType==='expense'||pendingType==='income') && !pendingCategory){
      alert('Bạn chưa có danh mục nào cho loại này. Hãy vào Cài đặt để thêm danh mục trước.');
      return;
    }
    const date = txDate.value || todayISO();
    const rec = {
      id: editingTxId || ('tx_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      type: pendingType,
      category: pendingCategory,
      amount, date,
      note: txNote.value.trim(),
    };
    if(editingTxId){
      const idx = data.transactions.findIndex(t=>t.id===editingTxId);
      if(idx>-1) data.transactions[idx] = rec;
    } else data.transactions.push(rec);
    persist(); closeTxModal(); renderAll();
    if(rec.type==='expense'){
      const cap = Number(data.categoryBudgets[rec.category])||0;
      if(cap>0){
        const mk = monthKey(rec.date);
        const spent = categorySpentInMonth(rec.category, mk);
        if(spent>cap){
          const cat = catByKey(rec.category);
          showToast(`⚠️ Vượt ngân sách ${cat.icon} ${cat.name}: đã chi ${fmtVND(spent)} / định mức ${fmtVND(cap)} (${monthLabel(mk)})`);
        }
      }
    }
  });
  document.getElementById('txDeleteBtn').addEventListener('click', ()=>{
    if(!editingTxId) return;
    data.transactions = data.transactions.filter(t=>t.id!==editingTxId);
    persist(); closeTxModal(); renderAll();
  });
  txAmount.addEventListener('input', ()=> txAmount.style.borderColor='var(--border-strong)');

  const wishOverlay = document.getElementById('wishOverlay');
  const wName = document.getElementById('w-name');
  const wPrice = document.getElementById('w-price');
  const wPriority = document.getElementById('w-priority');
  const wNote = document.getElementById('w-note');

  function openWishModal(item){
    editingWishId = item ? item.id : null;
    document.getElementById('wishModalTitle').textContent = item ? 'Sửa mong muốn' : 'Thêm mong muốn';
    document.getElementById('wishDeleteBtn').style.display = item ? 'block' : 'none';
    wName.value = item ? item.name : '';
    wPrice.value = item ? item.price : '';
    wPriority.value = item ? item.priority : 'vừa';
    wNote.value = item ? (item.note||'') : '';
    wName.style.borderColor='var(--border-strong)'; wPrice.style.borderColor='var(--border-strong)';
    wishOverlay.classList.add('open');
  }
  function closeWishModal(){ wishOverlay.classList.remove('open'); editingWishId=null; }
  document.getElementById('wishCancelBtn').addEventListener('click', closeWishModal);
  wishOverlay.addEventListener('click', e=>{ if(e.target===wishOverlay) closeWishModal(); });

  document.getElementById('wishSaveBtn').addEventListener('click', ()=>{
    const name = wName.value.trim();
    const price = Number(wPrice.value);
    if(!name){ wName.style.borderColor='var(--rose)'; wName.focus(); return; }
    if(!price || price<=0){ wPrice.style.borderColor='var(--rose)'; wPrice.focus(); return; }
    const rec = {
      id: editingWishId || ('w_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      name, price, priority: wPriority.value, note: wNote.value.trim(),
      purchased: editingWishId ? (data.wishlist.find(w=>w.id===editingWishId)||{}).purchased||false : false,
    };
    if(editingWishId){
      const idx = data.wishlist.findIndex(w=>w.id===editingWishId);
      if(idx>-1) data.wishlist[idx] = rec;
    } else data.wishlist.push(rec);
    persist(); closeWishModal(); renderAll();
  });
  document.getElementById('wishDeleteBtn').addEventListener('click', ()=>{
    if(!editingWishId) return;
    data.wishlist = data.wishlist.filter(w=>w.id!==editingWishId);
    persist(); closeWishModal(); renderAll();
  });
  [wName, wPrice].forEach(inp=> inp.addEventListener('input', ()=> inp.style.borderColor='var(--border-strong)'));

  loadData();
})();
