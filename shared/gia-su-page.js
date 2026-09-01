(function(){
  const PALETTE = ['#0EA69E','#7C5CFC','#F0932B','#F5566B','#3B82F6','#1FAA59','#EC4899','#A855F7','#14B8A6','#EF7C4A'];
  const APP_STATUSES = [
    {name:'Chưa liên hệ', color:'var(--gray)', bg:'var(--gray-soft)'},
    {name:'Đang chờ phản hồi', color:'var(--blue)', bg:'var(--blue-soft)'},
    {name:'Đã phản hồi - hẹn phỏng vấn', color:'var(--purple)', bg:'var(--purple-soft)'},
    {name:'Đậu - đã dạy thử', color:'var(--teach)', bg:'var(--teach-soft)'},
    {name:'Đậu - nhận lớp', color:'var(--green)', bg:'var(--green-soft)'},
    {name:'Rớt', color:'var(--red)', bg:'var(--red-soft)'},
  ];

  let db = { teach: [], cyber: [], classes: [] };
  let currentTab = 'teach';
  let expandedClassId = null;

  function storageGetRaw(key){ return window.Store.storageGetRaw(key); }
  function storageSetRaw(key, value){ return window.Store.storageSetRaw(key, value); }
  let saveTimer = null;
  function persist(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(()=>{ storageSetRaw('gia-su-data-v1', JSON.stringify(db)); }, 250);
  }

  function normalizeLegacyData(data){
    const next = { teach: Array.isArray(data?.teach) ? data.teach.map(item => ({ ...item })) : [], cyber: Array.isArray(data?.cyber) ? data.cyber.map(item => ({ ...item })) : [], classes: [] };
    const inputClasses = Array.isArray(data?.classes) ? data.classes : [];
    next.classes = inputClasses.map((cls, index) => {
      const legacyRate = Number(cls.rate ?? cls.amountPerHour ?? 0) || 0;
      const legacyDuration = Number(cls.duration ?? cls.minutesPerSession ?? 60) || 60;
      const normalized = {
        id: cls.id || uid('cls'),
        name: cls.name || `Lớp ${index + 1}`,
        subject: cls.subject || '',
        schedule: cls.schedule || '',
        manager: cls.manager || '',
        status: cls.status || 'Đang dạy',
        color: cls.color || PALETTE[index % PALETTE.length],
        students: Array.isArray(cls.students) ? cls.students.map(s => ({ id: s.id || uid('st'), name: s.name || '', phone: s.phone || '' })) : [],
        amountPerSession: Number(cls.amountPerSession ?? (legacyRate || 0)) || 0,
        minutesPerSession: Number(cls.minutesPerSession ?? (legacyDuration || 60)) || 60,
        sessions: Array.isArray(cls.sessions) ? cls.sessions.map(s => ({
          id: s.id || uid('ses'),
          date: s.date || '',
          minutes: Number(s.minutes ?? cls.minutesPerSession ?? legacyDuration ?? 60) || 60,
          present: Array.isArray(s.present) ? s.present : [],
          content: s.content || '',
          note: s.note || '',
          payment: s.payment || 'Chưa nhận'
        })) : []
      };
      if (normalized.amountPerSession === 0 && legacyRate > 0) {
        normalized.amountPerSession = legacyRate;
      }
      if (normalized.minutesPerSession === 0 || !Number.isFinite(normalized.minutesPerSession)) {
        normalized.minutesPerSession = legacyDuration || 60;
      }
      if (!('amountPerSession' in cls) && legacyRate > 0) {
        normalized.amountPerSession = legacyRate;
        normalized.minutesPerSession = legacyDuration || 60;
      }
      return normalized;
    });

    next.teach = next.teach.map(item => normalizeAppRecord(item, 'teach'));
    next.cyber = next.cyber.map(item => normalizeAppRecord(item, 'cyber'));
    return next;
  }

  function normalizeAppRecord(app, type){
    if(!app || typeof app !== 'object') return app;
    const merged = { ...app };
    if (!merged.id) merged.id = uid('app');
    if (!Object.prototype.hasOwnProperty.call(merged, 'proofImage') && Object.prototype.hasOwnProperty.call(merged, 'image')) {
      merged.proofImage = merged.image || '';
    }
    if (!Object.prototype.hasOwnProperty.call(merged, 'jobPostImage')) {
      merged.jobPostImage = '';
    }
    if (!Object.prototype.hasOwnProperty.call(merged, 'jd')) merged.jd = merged.jd || merged.note || '';
    if (!Object.prototype.hasOwnProperty.call(merged, 'requirements')) merged.requirements = '';
    if (!Object.prototype.hasOwnProperty.call(merged, 'offer')) merged.offer = '';
    if (!Object.prototype.hasOwnProperty.call(merged, 'notes')) {
      merged.notes = typeof merged.notes === 'string' ? merged.notes : (typeof merged.note === 'string' ? merged.note : '');
    }
    if (!Object.prototype.hasOwnProperty.call(merged, 'note') && merged.notes) {
      merged.note = merged.notes;
    }
    if (!merged.notes && typeof merged.note === 'string' && merged.note.trim()) {
      merged.notes = merged.note;
    }
    if (!merged.requirements && !merged.jd && !merged.offer && merged.notes) {
      merged.notes = merged.notes;
    }
    if (!merged.proofImage && !merged.jobPostImage && merged.image) {
      merged.proofImage = merged.image;
    }
    return merged;
  }

  async function loadData(){
    const raw = await storageGetRaw('gia-su-data-v1');
    if(raw){
      try{
        const parsed = JSON.parse(raw);
        db = normalizeLegacyData(parsed);
      }catch(e){
        db = seedData();
      }
    } else {
      db = seedData();
      persist();
    }
    renderAll();
  }

  function uid(prefix){ return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); }
  function seedData(){
    return {
      teach: [],
      cyber: [
        { id: uid('app'), org:'VnPro', position:'Thực Tập Sinh IT Network', date:'2026-08-20', location:'276-278 Ung Văn Khiêm, P.25, Quận Bình Thạnh', channel:'Mail', contact:'tuyendung@vnpro.org / 0853138378 (Ms. Hoa)', status:'Chưa liên hệ', link:'https://web.facebook.com/share/p/19SG6EeRfZ/', jd:'Hỗ trợ kỹ thuật phòng lab, thực hành Cisco/Firewall.', requirements:'', offer:'', notes:'', image:'' },
        { id: uid('app'), org:'SMNET', position:'IT Intern / IT Fresher', date:'2026-08-20', location:'Phòng G.01, Tòa nhà The Vital Building, 16 Đặng Tất, Tân Định', channel:'Mail', contact:'hello@smnet.vn / 028 7301 6068', status:'Đang chờ phản hồi', link:'https://web.facebook.com/share/p/1VrsFv8vPd/', jd:'Hỗ trợ Windows/Outlook/M365, LAN/Wifi, Switch/Router/Firewall.', requirements:'', offer:'', notes:'', image:'' },
        { id: uid('app'), org:'TMA Tech', position:'AI Engineer (Thực tập)', date:'2026-08-29', location:'Tòa nhà TMA, Công viên phần mềm Quang Trung, TP.HCM', channel:'Zalo', contact:'Thúy Quỳnh - 0862 246 058', status:'Đang chờ phản hồi', link:'', jd:'Thực tập Project-based, mentor trực tiếp từ SME.', requirements:'', offer:'', notes:'', image:'' },
      ],
      classes: [
        mkClass({name:'Toán 9 - Nhóm luyện thi vào 10', subject:'Toán lớp 9', schedule:'Thứ 2-4-6, 18h00-19h30', manager:'Trung tâm Tâm Tài Đức', amountPerSession:100000, minutesPerSession:120, color:PALETTE[0], students:['Khôi','An','Tú','Khanh'], sessions:[{date:'2026-08-15', present:['Khôi','An','Tú'], content:'Học chủ đề 6: BCNN, UCLN, công thức tính số ước của 1 số', note:'Khôi khóc vì cãi lại bài với gvien bài UCNN, lòng tự trọng lớn, tự ái cao', payment:'Chưa nhận'},{date:'2026-08-16', present:['Khôi','An','Tú','Khanh'], content:'Ôn lại UCLN, BCNN, học tiếp chủ đề 5', note:'An chưa biết cách sử dụng tính chất, chỉ biết tính tay. Tú chữ xấu, hay quên', payment:'Chưa nhận'}]}),
        mkClass({name:'Tiếng Anh 6 - Bé Mai', subject:'Tiếng Anh giao tiếp lớp 6', schedule:'Thứ 3-5-7, 19h00-19h50', manager:'Dạy tự do (không qua trung tâm)', amountPerSession:100000, minutesPerSession:120, color:PALETTE[1], students:['Đức','Thịnh','Huy'], sessions:[{date:'2026-08-09', present:['Thịnh','Huy'], content:'', note:'', payment:'Chưa nhận'},{date:'2026-08-15', present:['Đức','Huy'], content:'Chương 4, dạng toán tuổi, học dạng 1 và nói sơ qua dạng 2', note:'Huy áp dụng công thức khá tốt, Đức chưa quen', payment:'Chưa nhận'}]}),
        mkClass({name:'Lý - Hóa 11 - Nhóm', subject:'Lý - Hóa lớp 11', schedule:'Thứ 2-4, 19h00-21h00', manager:'Trung tâm Giáo Dục Việt Tài', amountPerSession:100000, minutesPerSession:120, color:PALETTE[2], students:['Bình Minh','Thịnh Phát','Cao Khánh'], sessions:[{date:'2026-08-09', present:['Bình Minh','Thịnh Phát'], content:'', note:'', payment:'Chưa nhận'},{date:'2026-08-15', present:['Bình Minh','Thịnh Phát','Cao Khánh'], content:'Học chương 6', note:'Minh hay quên bài đã học, Khánh và Phát ổn', payment:'Chưa nhận'}]}),
        mkClass({name:'Toán - Tiếng Việt 3 - Bé Bin', subject:'Toán - Tiếng Việt lớp 3', schedule:'Thứ 3-5, 17h00-18h00', manager:'Dạy tự do (không qua trung tâm)', amountPerSession:150000, minutesPerSession:60, color:PALETTE[3], students:['Lê Gia Bin'], sessions:[{date:'2026-08-04', present:['Lê Gia Bin'], content:'Toán: phép nhân, chia trong phạm vi 1000', note:'Bé làm chậm nhưng đúng, cần luyện phản xạ tính nhẩm', payment:'Đã nhận'},{date:'2026-08-06', present:['Lê Gia Bin'], content:'Tiếng Việt: luyện đọc hiểu, viết đoạn văn ngắn', note:'Đọc trôi chảy hơn, viết câu còn thiếu dấu câu', payment:'Chưa nhận'},{date:'2026-08-11', present:['Lê Gia Bin'], content:'Ôn tập chuẩn bị kiểm tra giữa kỳ', note:'Tự tin hơn khi làm bài', payment:'Đã nhận'}]}),
        mkClass({name:'Toán 12 - Bé Thảo (luyện thi ĐH)', subject:'Toán 12', schedule:'Thứ 3-5-CN, 20h00-21h30', manager:'Trung tâm Tâm Tài Đức', amountPerSession:160000, minutesPerSession:90, color:PALETTE[4], students:['Nguyễn Phương Thảo'], sessions:[{date:'2026-08-04', present:['Nguyễn Phương Thảo'], content:'Khảo sát hàm số, bài toán cực trị', note:'Làm bài khá tốt, cần nhanh hơn cho kỳ thi', payment:'Đã nhận'},{date:'2026-08-06', present:['Nguyễn Phương Thảo'], content:'Tích phân: phương pháp đổi biến số', note:'Còn lúng túng khi chọn biến', payment:'Đã nhận'},{date:'2026-08-09', present:['Nguyễn Phương Thảo'], content:'Luyện đề thi thử', note:'Đạt 8/10 điểm, tiến bộ rõ rệt', payment:'Chưa nhận'}]}),
        mkClass({name:'Tiếng Anh 8 - Nhóm', subject:'Tiếng Anh lớp 8', schedule:'Thứ 2-6, 18h30-19h30', manager:'Dạy tự do (không qua trung tâm)', amountPerSession:140000, minutesPerSession:60, color:PALETTE[5], students:['Đỗ Quang Huy','Phan Bảo Ngọc'], sessions:[{date:'2026-08-03', present:['Đỗ Quang Huy','Phan Bảo Ngọc'], content:'Unit 4: câu điều kiện loại 1', note:'Hiểu ngữ pháp nhưng hay quên động từ', payment:'Đã nhận'},{date:'2026-08-05', present:['Đỗ Quang Huy'], content:'Luyện nghe đề thi giữa kỳ', note:'Bảo Ngọc vắng, cần dạy bù', payment:'Đã nhận'},{date:'2026-08-07', present:['Đỗ Quang Huy','Phan Bảo Ngọc'], content:'Từ vựng chủ đề môi trường', note:'Cả 2 tiến bộ', payment:'Chưa nhận'}]}),
        mkClass({name:'Ngữ Văn 10 - Bé Ngọc', subject:'Ngữ Văn lớp 10', schedule:'Thứ 4-7, 19h00-20h30', manager:'Trung tâm Giáo Dục Việt Tài', amountPerSession:140000, minutesPerSession:90, color:PALETTE[6], students:['Vũ Thị Ngọc'], sessions:[{date:'2026-08-05', present:['Vũ Thị Ngọc'], content:"Phân tích bài thơ 'Cảnh ngày hè'", note:'Viết có cảm xúc, cần cải thiện bố cục', payment:'Đã nhận'},{date:'2026-08-08', present:['Vũ Thị Ngọc'], content:'Ôn tập biện pháp tu từ', note:'Nhận diện tốt, cần luyện phân tích tác dụng', payment:'Chưa nhận'},{date:'2026-08-12', present:['Vũ Thị Ngọc'], content:'Luyện viết nghị luận xã hội', note:'Bố cục rõ ràng hơn hẳn', payment:'Đã nhận'}]}),
        mkClass({name:'Toán Tư Duy Lớp 1 - Bé Sóc', subject:'Toán tư duy lớp 1', schedule:'Thứ 7-CN, 09h00-09h25', manager:'Dạy tự do (không qua trung tâm)', amountPerSession:200000, minutesPerSession:25, color:PALETTE[7], students:['Hoàng Bảo Sóc'], sessions:[{date:'2026-08-08', present:['Hoàng Bảo Sóc'], content:'Nhận biết số 1-20, so sánh lớn hơn - nhỏ hơn', note:'Hào hứng học, tiếp thu nhanh qua trò chơi', payment:'Đã nhận'},{date:'2026-08-09', present:['Hoàng Bảo Sóc'], content:'Làm quen phép cộng trong phạm vi 10', note:'Cần mẹ hỗ trợ tập trung', payment:'Chưa nhận'},{date:'2026-08-15', present:['Hoàng Bảo Sóc'], content:'So sánh lớn hơn - nhỏ hơn, đếm ngược', note:'Tiến bộ, tập trung hơn hẳn', payment:'Đã nhận'}]})
      ]
    };
  }
  function mkClass(cfg){
    return {
      id: uid('cls'),
      name: cfg.name, subject: cfg.subject, schedule: cfg.schedule, manager: cfg.manager,
      amountPerSession: Number(cfg.amountPerSession ?? cfg.rate ?? 0) || 0,
      minutesPerSession: Number(cfg.minutesPerSession ?? cfg.duration ?? 120) || 120,
      status: 'Đang dạy', color: cfg.color,
      students: cfg.students.map(n=>({ id: uid('st'), name:n, phone:'' })),
      sessions: cfg.sessions.map(s=>({ id: uid('ses'), date:s.date, minutes: Number(s.minutes ?? cfg.minutesPerSession ?? cfg.duration ?? 120) || 120, present:s.present, content:s.content, note:s.note, payment:s.payment })),
    };
  }

  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function fmtVND(n){
    return (Math.round(n)||0).toLocaleString('vi-VN') + ' đ';
  }
  function fmtDateVN(iso){
    if(!iso) return '—';
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  function statusInfo(name){
    return APP_STATUSES.find(s=>s.name===name) || APP_STATUSES[0];
  }
  function sessionAmount(cls, ses){
    const explicitAmount = Number(cls.amountPerSession ?? cls.rate ?? 0) || 0;
    if (Number.isFinite(explicitAmount) && explicitAmount > 0) {
      return explicitAmount;
    }
    const legacyRate = Number(cls.rate || 0) || 0;
    const mins = Number(ses.minutes || cls.minutesPerSession || cls.duration || 0) || 0;
    return Math.round(legacyRate * mins / 60);
  }
  function classTotals(cls){
    let total=0, paid=0;
    cls.sessions.forEach(s=>{
      const amt = sessionAmount(cls, s);
      total += amt;
      if(s.payment === 'Đã nhận') paid += amt;
    });
    return { total, paid, unpaid: total-paid, count: cls.sessions.length };
  }

  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b===btn));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      document.getElementById('panel-'+currentTab).classList.add('active');
    });
  });

  function renderAppStats(type, containerId){
    const list = db[type];
    const total = list.length;
    const waiting = list.filter(a=> a.status==='Đang chờ phản hồi' || a.status==='Đã phản hồi - hẹn phỏng vấn').length;
    const passed = list.filter(a=> a.status==='Đậu - đã dạy thử' || a.status==='Đậu - nhận lớp').length;
    const rate = total>0 ? Math.round(passed/total*100) : 0;
    const el = document.getElementById(containerId);
    el.innerHTML = `
      <div class="stat-card"><div class="stat-label">Tổng ứng tuyển</div><div class="stat-value">${total}</div></div>
      <div class="stat-card"><div class="stat-label">Đang chờ / phỏng vấn</div><div class="stat-value" style="color:var(--blue)">${waiting}</div></div>
      <div class="stat-card"><div class="stat-label">Đậu / nhận lớp</div><div class="stat-value" style="color:var(--green)">${passed}</div></div>
      <div class="stat-card"><div class="stat-label">Tỷ lệ thành công</div><div class="stat-value">${rate}%</div></div>
    `;
  }

  function resizeImageDataUrl(dataUrl, maxWidth=800, quality=0.7){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth && img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Không đọc được ảnh'));
      img.src = dataUrl;
    });
  }

  function toDataUrl(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = String(reader.result || '');
          resolve(dataUrl ? await resizeImageDataUrl(dataUrl, 800, 0.7) : '');
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Không đọc được ảnh'));
      reader.readAsDataURL(file);
    });
  }

  function getAppImageThumbs(app){
    const proof = app.proofImage || app.image || '';
    const job = app.jobPostImage || '';
    const thumbList = [];
    if (proof) thumbList.push({ key: 'proofImage', src: proof, alt: 'Ảnh bằng chứng hồ sơ' });
    if (job) thumbList.push({ key: 'jobPostImage', src: job, alt: 'Ảnh tin tuyển dụng gốc' });
    if (!thumbList.length) thumbList.push({ key: 'placeholder', src: '', alt: 'Chưa có ảnh', placeholder: true });
    return thumbList;
  }

  function bindImageLightbox(){
    const box = document.getElementById('imageLightbox');
    const img = document.getElementById('imageLightboxImg');
    if (!box || !img) return;
    const closeBtn = box.querySelector('.image-lightbox-close');
    const close = () => { box.classList.remove('open'); img.src = ''; };
    if (closeBtn) closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    window.openAppImageLightbox = function(src){ if(!src) return; img.src = src; box.classList.add('open'); };
  }
  bindImageLightbox();

  function renderAppList(type, containerId){
    const list = db[type];
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if(list.length===0){
      el.innerHTML = '<div class="empty-state">Chưa có ứng tuyển nào. Bấm "+ Thêm ứng tuyển" để bắt đầu ghi chú.</div>';
      return;
    }
    list.slice().sort((a,b)=> (b.date||'').localeCompare(a.date||'')).forEach(app=>{
      const st = statusInfo(app.status);
      const card = document.createElement('div');
      card.className = 'app-card';
      card.style.setProperty('--st-color', st.color);
      const thumbs = getAppImageThumbs(app);
      const imageMarkup = thumbs.length && !thumbs[0].placeholder ? `
        <div class="app-thumb-grid">
          ${thumbs.map(item => item.placeholder ? '<div class="app-thumb placeholder">🖼️</div>' : `<div class="app-thumb" data-lightbox="${escapeHtml(item.src)}"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}"></div>`).join('')}
        </div>
      ` : '<div class="app-thumb placeholder">🖼️</div>';
      const noteText = [app.jd, app.requirements, app.offer, app.notes].filter(Boolean).join('\n\n');
      card.innerHTML = `
        <div class="app-card-head">
          <div>
            <div class="app-org">${escapeHtml(app.org)}</div>
            <div class="app-position">${escapeHtml(app.position)}</div>
          </div>
          <div class="badge" style="--st-color:${st.color};--st-bg:${st.bg}">${escapeHtml(app.status)}</div>
        </div>
        ${imageMarkup}
        <div class="app-meta">📅 ${fmtDateVN(app.date)} &nbsp;·&nbsp; 📍 ${escapeHtml(app.location||'—')}<br>☎ ${escapeHtml(app.channel||'')} ${app.contact? '· '+escapeHtml(app.contact):''}</div>
        ${noteText ? `<div class="app-note">${escapeHtml(noteText)}</div>` : ''}
        <div class="app-actions">
          <button class="btn btn-sm" data-edit="${app.id}">✎ Sửa</button>
          ${app.link ? `<a class="btn btn-sm" href="${escapeHtml(app.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 Link</a>` : ''}
        </div>
      `;
      card.querySelectorAll('[data-lightbox]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const src = el.getAttribute('data-lightbox');
          if (src) openAppImageLightbox(src);
        });
      });
      card.querySelector('[data-edit]').addEventListener('click', (e)=>{ e.stopPropagation(); openAppModal(type, app.id); });
      card.addEventListener('click', ()=> openAppModal(type, app.id));
      el.appendChild(card);
    });
  }

  const appOverlay = document.getElementById('appOverlay');
  let appEditing = null;
  const afStatusSelect = document.getElementById('af-status');
  afStatusSelect.innerHTML = APP_STATUSES.map(s=>`<option>${s.name}</option>`).join('');

  function updateAppImagePreview(elId, wrapId, src){
    const wrap = document.getElementById(wrapId);
    const preview = document.getElementById(elId);
    if (!src) {
      wrap.style.display = 'none';
      preview.src = '';
      return;
    }
    wrap.style.display = 'block';
    preview.src = src;
  }

  window.openAppModal = function(type, id){
    appEditing = { type, id: id||null };
    const app = id ? db[type].find(a=>a.id===id) : null;
    document.getElementById('appModalTitle').textContent = app ? 'Sửa ứng tuyển' : 'Thêm ứng tuyển';
    document.getElementById('appDeleteBtn').style.display = app ? 'block' : 'none';
    document.getElementById('appSaveBtn').style.background = type==='teach' ? 'var(--teach)' : 'var(--cyber)';
    document.getElementById('af-org').value = app ? app.org : '';
    document.getElementById('af-position').value = app ? app.position : '';
    document.getElementById('af-date').value = app ? app.date : new Date().toISOString().slice(0,10);
    document.getElementById('af-location').value = app ? app.location : '';
    document.getElementById('af-channel').value = app ? app.channel : 'Mail';
    document.getElementById('af-contact').value = app ? app.contact : '';
    document.getElementById('af-status').value = app ? app.status : 'Chưa liên hệ';
    document.getElementById('af-link').value = app ? app.link : '';
    document.getElementById('af-jd').value = app ? (app.jd || '') : '';
    document.getElementById('af-requirements').value = app ? (app.requirements || '') : '';
    document.getElementById('af-offer').value = app ? (app.offer || '') : '';
    document.getElementById('af-notes').value = app ? (app.notes || '') : '';
    updateAppImagePreview('appProofPreview', 'appProofPreviewWrap', app ? (app.proofImage || app.image || '') : '');
    updateAppImagePreview('appJobPostPreview', 'appJobPostPreviewWrap', app ? (app.jobPostImage || '') : '');
    document.getElementById('af-proof-image').value = '';
    document.getElementById('af-jobpost-image').value = '';
    appOverlay.classList.add('open');
  };
  window.closeAppModal = function(){ appOverlay.classList.remove('open'); appEditing = null; document.getElementById('af-proof-image').value = ''; document.getElementById('af-jobpost-image').value = ''; };
  appOverlay.addEventListener('click', (e)=>{ if(e.target===appOverlay) closeAppModal(); });

  document.getElementById('af-proof-image').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await toDataUrl(file);
      updateAppImagePreview('appProofPreview', 'appProofPreviewWrap', dataUrl);
    } catch (err) {
      console.error(err);
      alert('Không thể đọc ảnh được. Vui lòng thử ảnh khác.');
    }
  });
  document.getElementById('af-jobpost-image').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await toDataUrl(file);
      updateAppImagePreview('appJobPostPreview', 'appJobPostPreviewWrap', dataUrl);
    } catch (err) {
      console.error(err);
      alert('Không thể đọc ảnh được. Vui lòng thử ảnh khác.');
    }
  });

  document.getElementById('appSaveBtn').addEventListener('click', async ()=>{
    const org = document.getElementById('af-org').value.trim();
    if(!org){ document.getElementById('af-org').focus(); return; }
    const proofFile = document.getElementById('af-proof-image').files && document.getElementById('af-proof-image').files[0];
    const jobFile = document.getElementById('af-jobpost-image').files && document.getElementById('af-jobpost-image').files[0];
    const existing = appEditing && appEditing.id ? db[appEditing.type].find(a=>a.id===appEditing.id) : null;
    const proofData = proofFile ? await toDataUrl(proofFile) : (existing ? (existing.proofImage || existing.image || '') : '');
    const jobData = jobFile ? await toDataUrl(jobFile) : (existing ? (existing.jobPostImage || '') : '');
    const payload = {
      org, position: document.getElementById('af-position').value.trim(),
      date: document.getElementById('af-date').value,
      location: document.getElementById('af-location').value.trim(),
      channel: document.getElementById('af-channel').value,
      contact: document.getElementById('af-contact').value.trim(),
      status: document.getElementById('af-status').value,
      link: document.getElementById('af-link').value.trim(),
      jd: document.getElementById('af-jd').value.trim(),
      requirements: document.getElementById('af-requirements').value.trim(),
      offer: document.getElementById('af-offer').value.trim(),
      notes: document.getElementById('af-notes').value.trim(),
      proofImage: proofData,
      jobPostImage: jobData,
      image: proofData || '',
      note: document.getElementById('af-jd').value.trim(),
    };
    const { type, id } = appEditing;
    if(id){
      const idx = db[type].findIndex(a=>a.id===id);
      db[type][idx] = Object.assign({id}, payload);
    } else {
      db[type].push(Object.assign({id: uid('app')}, payload));
    }
    persist(); closeAppModal(); renderAll();
  });
  document.getElementById('appDeleteBtn').addEventListener('click', ()=>{
    const { type, id } = appEditing;
    db[type] = db[type].filter(a=>a.id!==id);
    persist(); closeAppModal(); renderAll();
  });

  function renderClassStats(){
    const total = db.classes.length;
    let students = 0, totalPay=0, paid=0;
    db.classes.forEach(c=>{
      students += c.students.length;
      const t = classTotals(c);
      totalPay += t.total; paid += t.paid;
    });
    document.getElementById('statsClasses').innerHTML = `
      <div class="stat-card"><div class="stat-label">Số lớp đang dạy</div><div class="stat-value">${total}</div></div>
      <div class="stat-card"><div class="stat-label">Tổng học sinh</div><div class="stat-value">${students}</div></div>
      <div class="stat-card"><div class="stat-label">Tổng lương (tất cả lớp)</div><div class="stat-value" style="color:var(--class)">${fmtVND(totalPay)}</div></div>
      <div class="stat-card"><div class="stat-label">Đã nhận</div><div class="stat-value" style="color:var(--green)">${fmtVND(paid)}</div></div>
    `;
  }

  function renderSummaryOverview(){
    const totalClasses = db.classes.length;
    let totalRevenue = 0, totalPaid = 0, totalPending = 0;
    db.classes.forEach(cls => {
      const totals = classTotals(cls);
      totalRevenue += totals.total;
      totalPaid += totals.paid;
      totalPending += totals.unpaid;
    });
    const el = document.getElementById('summaryOverview');
    el.innerHTML = `
      <div class="summary-card primary">
        <div class="label">Tổng thu nhập</div>
        <div class="value">${fmtVND(totalRevenue)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Đã nhận</div>
        <div class="value" style="color:var(--green)">${fmtVND(totalPaid)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Chưa nhận</div>
        <div class="value" style="color:var(--red)">${fmtVND(totalPending)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Số lớp</div>
        <div class="value">${totalClasses}</div>
      </div>
    `;
  }

  function renderClassList(){
    const el = document.getElementById('listClasses');
    el.innerHTML = '';
    if(db.classes.length===0){
      el.innerHTML = '<div class="empty-state">Chưa có lớp nào. Bấm "+ Thêm lớp" để bắt đầu.</div>';
      return;
    }
    db.classes.forEach(cls=>{
      const t = classTotals(cls);
      const pct = t.total>0 ? Math.round(t.paid/t.total*100) : 0;
      const card = document.createElement('div');
      card.className = 'class-card';
      card.innerHTML = `
        <div class="class-top" style="background:${cls.color}"></div>
        <div class="class-head">
          <div class="class-name">${escapeHtml(cls.name)}</div>
          <div class="class-meta">${escapeHtml(cls.subject)}<br>🕒 ${escapeHtml(cls.schedule)}<br>🏢 ${escapeHtml(cls.manager)}</div>
          <div class="class-status" style="background:${cls.status==='Đang dạy'?'var(--green-soft)':cls.status==='Tạm nghỉ'?'var(--blue-soft)':'var(--gray-soft)'};color:${cls.status==='Đang dạy'?'var(--green)':cls.status==='Tạm nghỉ'?'var(--blue)':'var(--gray)'}">${cls.status}</div>
        </div>
        <div class="class-stats">
          <div class="cell"><div class="lbl">Sĩ số</div><div class="val">${cls.students.length}</div></div>
          <div class="cell"><div class="lbl">Tiền/buổi</div><div class="val">${(Number(cls.amountPerSession || 0)/1000).toFixed(0)}k</div></div>
          <div class="cell"><div class="lbl">Phút/buổi</div><div class="val">${Number(cls.minutesPerSession || cls.duration || 0)}</div></div>
          <div class="cell"><div class="lbl">Số buổi</div><div class="val">${t.count}</div></div>
        </div>
        <div class="pay-bar-wrap">
          <div class="pay-bar-track"><div class="pay-bar-fill" style="width:${pct}%"></div></div>
          <div class="pay-bar-label"><span>Đã nhận ${fmtVND(t.paid)}</span><span>Tổng ${fmtVND(t.total)}</span></div>
        </div>
        <div class="class-actions">
          <button class="btn btn-sm" data-toggle="${cls.id}" style="border-color:${cls.color};color:${cls.color}">${expandedClassId===cls.id?'▲ Ẩn buổi dạy':'▾ Xem buổi dạy'}</button>
          <button class="btn btn-sm" data-edit="${cls.id}">✎ Sửa lớp</button>
          <button class="btn btn-sm" data-addsession="${cls.id}" style="background:${cls.color};color:#fff;border:none;">+ Buổi dạy</button>
        </div>
        <div class="class-detail ${expandedClassId===cls.id?'open':''}" id="detail-${cls.id}"></div>
      `;
      card.querySelector('[data-toggle]').addEventListener('click', ()=>{
        expandedClassId = expandedClassId===cls.id ? null : cls.id;
        renderClassList();
      });
      card.querySelector('[data-edit]').addEventListener('click', ()=> openClassModal(cls.id));
      card.querySelector('[data-addsession]').addEventListener('click', ()=> openSessionModal(cls.id));
      el.appendChild(card);
      if(expandedClassId===cls.id){
        renderClassDetail(cls);
      }
    });
  }

  function renderClassDetail(cls){
    const wrap = document.getElementById('detail-'+cls.id);
    if(!wrap) return;
    let html = '<div class="student-chips">';
    cls.students.forEach(s=>{
      html += `<div class="student-chip" title="${escapeHtml(s.phone||'')}"><span class="dot" style="background:${cls.color}"></span>${escapeHtml(s.name)}</div>`;
    });
    html += '</div><div class="session-list">';
    if(cls.sessions.length===0){
      html += '<div class="empty-state">Chưa có buổi dạy nào.</div>';
    } else {
      cls.sessions.slice().sort((a,b)=> (b.date||'').localeCompare(a.date||'')).forEach(ses=>{
        const amt = sessionAmount(cls, ses);
        const isPaid = ses.payment === 'Đã nhận';
        html += `
          <div class="session-row" data-open="${ses.id}">
            <div class="session-row-top">
              <div class="session-date">📅 ${fmtDateVN(ses.date)}</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <button class="pay-pill ${isPaid?'paid':'unpaid'}" data-toggle-pay="${ses.id}">${ses.payment}</button>
                <span class="session-del" data-del="${ses.id}">✕</span>
              </div>
            </div>
            <div class="session-mid">
              <span>⏱ ${ses.minutes||cls.duration} phút</span>
              <span>👥 ${ses.present.length}/${cls.students.length} có mặt</span>
              <span style="color:${cls.color};font-weight:700;">💰 ${fmtVND(amt)}</span>
            </div>
            ${ses.content ? `<div class="session-content">${escapeHtml(ses.content)}</div>` : ''}
            ${ses.note ? `<div class="session-note">💬 ${escapeHtml(ses.note)}</div>` : ''}
          </div>
        `;
      });
    }
    html += '</div>';
    wrap.innerHTML = html;
    wrap.querySelectorAll('[data-open]').forEach(row=>{
      row.addEventListener('click', (e)=>{
        if(e.target.closest('[data-toggle-pay]') || e.target.closest('[data-del]')) return;
        openSessionModal(cls.id, row.dataset.open);
      });
    });
    wrap.querySelectorAll('[data-toggle-pay]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const ses = cls.sessions.find(s=>s.id===btn.dataset.togglePay);
        ses.payment = ses.payment==='Đã nhận' ? 'Chưa nhận' : 'Đã nhận';
        persist(); renderAll();
      });
    });
    wrap.querySelectorAll('[data-del]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        cls.sessions = cls.sessions.filter(s=>s.id!==btn.dataset.del);
        persist(); renderAll();
      });
    });
  }

  const classOverlay = document.getElementById('classOverlay');
  let classEditingId = null;
  let classColor = PALETTE[0];
  let studentRows = [];

  function buildClassSwatches(){
    const wrap = document.getElementById('cf-swatches');
    wrap.innerHTML = '';
    PALETTE.forEach(c=>{
      const sw = document.createElement('div');
      sw.className = 'swatch' + (c===classColor?' active':'');
      sw.style.background = c;
      sw.addEventListener('click', ()=>{ classColor = c; buildClassSwatches(); });
      wrap.appendChild(sw);
    });
  }
  window.addStudentRow = function(name, phone){
    const row = { id: uid('st'), name: name||'', phone: phone||'' };
    studentRows.push(row);
    renderStudentRows();
  };
  function renderStudentRows(){
    const wrap = document.getElementById('cf-students');
    wrap.innerHTML = '';
    studentRows.forEach((row, idx)=>{
      const div = document.createElement('div');
      div.className = 'student-edit-row';
      div.innerHTML = `
        <input type="text" placeholder="Tên học sinh" value="${escapeHtml(row.name)}" data-idx="${idx}" data-field="name">
        <input type="text" placeholder="SĐT/Zalo phụ huynh (tuỳ chọn)" value="${escapeHtml(row.phone)}" data-idx="${idx}" data-field="phone" style="max-width:170px;">
        <span class="rm" data-rm="${idx}">✕</span>
      `;
      wrap.appendChild(div);
    });
    wrap.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input', ()=>{
        studentRows[inp.dataset.idx][inp.dataset.field] = inp.value;
      });
    });
    wrap.querySelectorAll('[data-rm]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        studentRows.splice(Number(btn.dataset.rm), 1);
        renderStudentRows();
      });
    });
  }

  window.openClassModal = function(id){
    classEditingId = id || null;
    const cls = id ? db.classes.find(c=>c.id===id) : null;
    document.getElementById('classModalTitle').textContent = cls ? 'Sửa lớp' : 'Thêm lớp';
    document.getElementById('classDeleteBtn').style.display = cls ? 'block' : 'none';
    document.getElementById('cf-name').value = cls ? cls.name : '';
    document.getElementById('cf-subject').value = cls ? cls.subject : '';
    document.getElementById('cf-manager').value = cls ? cls.manager : '';
    document.getElementById('cf-schedule').value = cls ? cls.schedule : '';
    document.getElementById('cf-amount').value = cls ? (cls.amountPerSession ?? 100000) : 100000;
    document.getElementById('cf-minutes').value = cls ? (cls.minutesPerSession ?? 120) : 120;
    document.getElementById('cf-status').value = cls ? cls.status : 'Đang dạy';
    classColor = cls ? cls.color : PALETTE[db.classes.length % PALETTE.length];
    buildClassSwatches();
    studentRows = cls ? cls.students.map(s=>({id:s.id, name:s.name, phone:s.phone})) : [];
    renderStudentRows();
    classOverlay.classList.add('open');
  };
  window.closeClassModal = function(){ classOverlay.classList.remove('open'); classEditingId = null; };
  classOverlay.addEventListener('click', (e)=>{ if(e.target===classOverlay) closeClassModal(); });

  document.getElementById('classSaveBtn').addEventListener('click', ()=>{
    const name = document.getElementById('cf-name').value.trim();
    if(!name){ document.getElementById('cf-name').focus(); return; }
    const validStudents = studentRows.filter(s=>s.name.trim());
    const amountPerSession = Number(document.getElementById('cf-amount').value) || 0;
    const minutesPerSession = Number(document.getElementById('cf-minutes').value) || 60;
    const payload = {
      name, subject: document.getElementById('cf-subject').value.trim(),
      manager: document.getElementById('cf-manager').value.trim(),
      schedule: document.getElementById('cf-schedule').value.trim(),
      amountPerSession,
      minutesPerSession,
      status: document.getElementById('cf-status').value,
      color: classColor,
      students: validStudents.map(s=>({id:s.id, name:s.name.trim(), phone:s.phone.trim()})),
    };
    if(classEditingId){
      const idx = db.classes.findIndex(c=>c.id===classEditingId);
      db.classes[idx] = Object.assign({}, db.classes[idx], payload);
    } else {
      db.classes.push(Object.assign({id: uid('cls'), sessions:[]}, payload));
    }
    persist(); closeClassModal(); renderAll();
  });
  document.getElementById('classDeleteBtn').addEventListener('click', ()=>{
    db.classes = db.classes.filter(c=>c.id!==classEditingId);
    if(expandedClassId===classEditingId) expandedClassId=null;
    persist(); closeClassModal(); renderAll();
  });

  const sessionOverlay = document.getElementById('sessionOverlay');
  let sessionEditing = null;

  function updateSessionAmount(){
    const cls = db.classes.find(c=>c.id===sessionEditing.classId);
    const mins = Number(document.getElementById('sf-minutes').value)||0;
    const amount = Number(cls?.amountPerSession || cls?.rate || 0) || 0;
    document.getElementById('sf-amount').textContent = fmtVND(amount || Math.round((cls?.rate||0)*mins/60));
  }

  window.openSessionModal = function(classId, sessionId){
    sessionEditing = { classId, id: sessionId||null };
    const cls = db.classes.find(c=>c.id===classId);
    const ses = sessionId ? cls.sessions.find(s=>s.id===sessionId) : null;
    document.getElementById('sessionModalTitle').textContent = ses ? 'Sửa buổi dạy' : 'Thêm buổi dạy — ' + cls.name;
    document.getElementById('sessionDeleteBtn').style.display = ses ? 'block' : 'none';
    document.getElementById('sessionSaveBtn').style.background = cls.color;
    document.getElementById('sf-date').value = ses ? ses.date : new Date().toISOString().slice(0,10);
    document.getElementById('sf-minutes').value = ses ? (ses.minutes || cls.minutesPerSession || cls.duration) : (cls.minutesPerSession || cls.duration || 120);
    document.getElementById('sf-content').value = ses ? ses.content : '';
    document.getElementById('sf-note').value = ses ? ses.note : '';
    document.getElementById('sf-payment').value = ses ? ses.payment : 'Chưa nhận';

    const wrap = document.getElementById('sf-students');
    wrap.innerHTML = '';
    const presentSet = new Set(ses ? ses.present : cls.students.map(s=>s.name));
    cls.students.forEach(s=>{
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${escapeHtml(s.name)}" ${presentSet.has(s.name)?'checked':''}> ${escapeHtml(s.name)}`;
      wrap.appendChild(label);
    });
    if(cls.students.length===0){
      wrap.innerHTML = '<div class="hint">Lớp chưa có học sinh nào — thêm học sinh trong phần "Sửa lớp".</div>';
    }
    updateSessionAmount();
    sessionOverlay.classList.add('open');
  };
  window.closeSessionModal = function(){ sessionOverlay.classList.remove('open'); sessionEditing = null; };
  sessionOverlay.addEventListener('click', (e)=>{ if(e.target===sessionOverlay) closeSessionModal(); });
  document.getElementById('sf-minutes').addEventListener('input', ()=>{ if(sessionEditing) updateSessionAmount(); });

  document.getElementById('sessionSaveBtn').addEventListener('click', ()=>{
    const cls = db.classes.find(c=>c.id===sessionEditing.classId);
    const present = Array.from(document.querySelectorAll('#sf-students input:checked')).map(i=>i.value);
    const payload = {
      date: document.getElementById('sf-date').value || new Date().toISOString().slice(0,10),
      minutes: Number(document.getElementById('sf-minutes').value) || (cls.minutesPerSession || cls.duration || 120),
      present,
      content: document.getElementById('sf-content').value.trim(),
      note: document.getElementById('sf-note').value.trim(),
      payment: document.getElementById('sf-payment').value,
    };
    if(sessionEditing.id){
      const idx = cls.sessions.findIndex(s=>s.id===sessionEditing.id);
      cls.sessions[idx] = Object.assign({id: sessionEditing.id}, payload);
    } else {
      cls.sessions.push(Object.assign({id: uid('ses')}, payload));
    }
    expandedClassId = cls.id;
    persist(); closeSessionModal(); renderAll();
  });
  document.getElementById('sessionDeleteBtn').addEventListener('click', ()=>{
    const cls = db.classes.find(c=>c.id===sessionEditing.classId);
    cls.sessions = cls.sessions.filter(s=>s.id!==sessionEditing.id);
    persist(); closeSessionModal(); renderAll();
  });

  function renderSummary(){
    renderSummaryOverview();
    const body = document.getElementById('summaryBody');
    body.innerHTML = '';
    let sumCount=0, sumTotal=0, sumPaid=0, sumUnpaid=0;
    db.classes.forEach(cls=>{
      const t = classTotals(cls);
      sumCount+=t.count; sumTotal+=t.total; sumPaid+=t.paid; sumUnpaid+=t.unpaid;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="name-cell"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${cls.color};margin-right:7px;"></span>${escapeHtml(cls.name)}</td>
        <td>${t.count}</td>
        <td>${fmtVND(t.total)}</td>
        <td style="color:var(--green)">${fmtVND(t.paid)}</td>
        <td style="color:var(--red)">${fmtVND(t.unpaid)}</td>
      `;
      body.appendChild(tr);
    });
    if(db.classes.length===0){
      body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--ink-faint);padding:30px;">Chưa có lớp nào.</td></tr>';
    } else {
      const totalTr = document.createElement('tr');
      totalTr.className = 'total-row';
      totalTr.innerHTML = `<td>TỔNG CỘNG</td><td>${sumCount}</td><td>${fmtVND(sumTotal)}</td><td style="color:var(--green)">${fmtVND(sumPaid)}</td><td style="color:var(--red)">${fmtVND(sumUnpaid)}</td>`;
      body.appendChild(totalTr);
    }

    const chart = document.getElementById('chartBody');
    chart.innerHTML = '';
    const maxTotal = Math.max(1, ...db.classes.map(c=>classTotals(c).total));
    db.classes.slice().sort((a,b)=> classTotals(b).total - classTotals(a).total).forEach(cls=>{
      const t = classTotals(cls);
      const pct = Math.max(4, Math.round(t.total/maxTotal*100));
      const row = document.createElement('div');
      row.className = 'chart-row';
      row.innerHTML = `
        <div class="chart-label" title="${escapeHtml(cls.name)}">${escapeHtml(cls.name)}</div>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%;background:${cls.color}"><span>${fmtVND(t.total)}</span></div></div>
      `;
      chart.appendChild(row);
    });
  }

  function renderAll(){
    renderAppStats('teach','statsTeach');
    renderAppList('teach','listTeach');
    renderAppStats('cyber','statsCyber');
    renderAppList('cyber','listCyber');
    renderClassStats();
    renderClassList();
    renderSummary();
  }

  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(db, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'du-lieu-gia-su.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(confirm('Xoá toàn bộ dữ liệu đã lưu và khôi phục dữ liệu mẫu ban đầu?')){
      db = seedData();
      expandedClassId = null;
      persist();
      renderAll();
    }
  });

  loadData();
})();
