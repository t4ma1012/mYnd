/* =========================================================================
   STORE — lớp lưu trữ dùng chung cho mọi trang.
   API giống hệt window.storage cũ (get/set theo key) để các trang cũ chỉ cần
   đổi vài dòng gọi hàm là chạy được, nhưng bên dưới giờ lưu vào Firestore
   (đồng bộ thật giữa điện thoại / laptop / iPad) thay vì chỉ localStorage.

   Cách hoạt động:
   - Luôn ghi localStorage NGAY LẬP TỨC trước (để không bao giờ mất dữ liệu
     kể cả khi mất mạng), sau đó mới đẩy lên Firestore trong nền.
   - Khi trang mở lên và đã đăng nhập, sẽ tải bản mới nhất từ Firestore về
     (nếu có) để đồng bộ dữ liệu từ thiết bị khác.
   ========================================================================= */
window.Store = (function(){
  let db = null;
  let uid = null;
  let readyResolve;
  const readyPromise = new Promise(res=>{ readyResolve = res; });

  function scopedKey(key){
    return uid ? `gpx:${uid}:${key}` : key;
  }

  function init(firestoreDb, userId){
    db = firestoreDb || null;
    uid = userId || null;
    if (typeof readyResolve === 'function') {
      readyResolve();
    }
  }

  function reset(){
    db = null;
    uid = null;
  }

  function docRef(key){
    if(!db || !uid){ return null; }
    return db.collection('users').doc(uid).collection('kv').doc(key);
  }

  function showToast(msg){
    let el = document.getElementById('gpx-sync-toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(()=> el.classList.remove('show'), 1600);
  }

  function readLocalValue(key){
    try{
      const namespaced = scopedKey(key);
      const value = localStorage.getItem(namespaced);
      if(value !== null) return value;

      const legacy = localStorage.getItem(key);
      if(legacy !== null && uid){
        localStorage.setItem(namespaced, legacy);
        localStorage.removeItem(key);
      }
      return legacy;
    }catch(e){
      return null;
    }
  }

  function writeLocalValue(key, value){
    try{
      const namespaced = scopedKey(key);
      localStorage.setItem(namespaced, value);
      if(uid){
        localStorage.removeItem(key);
      }
    }catch(e){}
  }

  // Lấy dữ liệu: thử Firestore với timeout 2.5s, nếu hết thời gian fallback localStorage ngay.
  async function storageGetRaw(key){
    try{ await readyPromise; }catch(e){}
    if(db && uid){
      try{
        const ref = docRef(key);
        if(!ref) return readLocalValue(key);
        
        // Tạo promise với timeout: nếu quá 2500ms sẽ reject
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout firestore get after 2500ms')), 2500);
        });
        
        // Race between Firestore get và timeout
        try {
          const snap = await Promise.race([ref.get(), timeoutPromise]);
          if(snap.exists && snap.data().value!=null){
            const val = snap.data().value;
            writeLocalValue(key, val);
            return val;
          }
        } catch(timeoutErr) {
          // Nếu timeout thì không log error, chỉ dùng localStorage ngay
          if(timeoutErr.message.includes('Timeout')) {
            return readLocalValue(key);
          }
          throw timeoutErr;
        }
      }catch(e){ console.warn('[Store] Không tải được từ Firestore, dùng dữ liệu máy này:', e.message); }
    }
    return readLocalValue(key);
  }

  // Lưu dữ liệu: ghi localStorage theo UID ngay, rồi đẩy Firestore trong nền.
  let pendingWrites = 0;
  async function storageSetRaw(key, value){
    writeLocalValue(key, value);
    try{ await readyPromise; }catch(e){}
    if(db && uid){
      const ref = docRef(key);
      if(!ref) return;
      pendingWrites++;
      try{
        await ref.set({ value, updatedAt: Date.now() });
        showToast('☁ Đã đồng bộ');
      }catch(e){
        console.warn('[Store] Chưa đồng bộ được lên Firestore, dữ liệu vẫn an toàn ở máy này:', e.message);
        showToast('⚠ Chưa đồng bộ (offline)');
      }finally{
        pendingWrites--;
      }
    }
  }

  function makeId(prefix){
    const random = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    return prefix ? `${prefix}-${random}` : random;
  }

  function coerceNumber(value, fallback){
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeListItem(item){
    if(!item || typeof item !== 'object') return null;

    const type = String(item.type || 'general').trim() || 'general';
    const name = String(item.name || item.title || '').trim();
    const id = item.id || makeId(type);
    const status = item.status || 'planned';
    const notes = item.notes || '';
    const link = item.link || '';
    const createdAt = item.createdAt || Date.now();
    const updatedAt = item.updatedAt || createdAt;
    const normalized = {
      id,
      type,
      name,
      status,
      notes,
      link,
      createdAt,
      updatedAt
    };

    if (typeof item.progress === 'number') normalized.progress = item.progress;
    else if (item.progress != null) normalized.progress = Number(item.progress) || 0;
    else normalized.progress = 0;

    if (item.current != null || item.total != null) {
      normalized.current = Number(item.current || 0);
      normalized.total = Number(item.total || 0);
    }
    if (item.progressMode) normalized.progressMode = item.progressMode;
    if (item.location) normalized.location = item.location;
    if (item.category) normalized.category = item.category;
    if (item.meta && typeof item.meta === 'object') normalized.meta = item.meta;

    return normalized;
  }

  function parseListItems(raw){
    if(!raw) return [];
    try{
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed)) return [];
      return parsed.map(normalizeListItem).filter(Boolean);
    }catch(e){
      console.warn('[Store] Lỗi parse listItems:', e.message);
      return [];
    }
  }

  async function getListItems(type){
    const raw = await storageGetRaw('lists-v1');
    const items = parseListItems(raw);
    if(!type) return items;
    return items.filter(item => item.type === type);
  }

  async function getListItem(id){
    const items = await getListItems();
    return items.find(item => item.id === id) || null;
  }

  async function addListItem(input){
    const item = normalizeListItem({
      ...input,
      createdAt: input && input.createdAt ? input.createdAt : Date.now(),
      updatedAt: input && input.updatedAt ? input.updatedAt : Date.now()
    });
    if(!item) throw new Error('[Store] Dữ liệu list item không hợp lệ');
    const items = await getListItems();
    items.push(item);
    await storageSetRaw('lists-v1', JSON.stringify(items));
    return item;
  }

  async function updateListItem(id, updates){
    const items = await getListItems();
    const index = items.findIndex(item => item.id === id);
    if(index === -1) return null;
    const next = normalizeListItem({
      ...items[index],
      ...updates,
      id: items[index].id,
      type: updates && updates.type ? updates.type : items[index].type,
      updatedAt: Date.now()
    });
    if(!next) return null;
    items[index] = next;
    await storageSetRaw('lists-v1', JSON.stringify(items));
    return next;
  }

  async function deleteListItem(id){
    const items = await getListItems();
    const index = items.findIndex(item => item.id === id);
    if(index === -1) return false;
    items.splice(index, 1);
    await storageSetRaw('lists-v1', JSON.stringify(items));
    return true;
  }

  async function incrementProgress(itemId, delta){
    const item = await getListItem(itemId);
    if(!item || item.type !== 'movie') return null;

    const step = coerceNumber(delta, 1);
    const total = Math.max(1, coerceNumber(item.total, item.current || 1));
    const nextCurrent = Math.min(Math.max(0, coerceNumber(item.current, 0) + step), total);
    const nextStatus = nextCurrent >= total ? 'watched' : (item.status === 'watched' ? 'planned' : item.status || 'planned');

    const updated = await updateListItem(itemId, {
      current: nextCurrent,
      total,
      status: nextStatus,
      progress: Math.round((nextCurrent / total) * 100),
      progressMode: item.progressMode || 'episode',
      updatedAt: Date.now()
    });

    if (!updated) return null;
    return {
      ...updated,
      current: nextCurrent,
      total,
      percent: Math.round((nextCurrent / total) * 100)
    };
  }

  const Lists = {
    async incrementProgress(itemId, delta){
      return incrementProgress(itemId, delta);
    }
  };

  window.Lists = Lists;

  return {
    init,
    reset,
    storageGetRaw,
    storageSetRaw,
    getCurrentUserId(){ return uid; },
    get isReady(){ return !!(db && uid); },
    getListItems,
    getListItem,
    addListItem,
    updateListItem,
    deleteListItem,
    incrementProgress
  };
})();
