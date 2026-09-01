(function () {
  'use strict';

  const LIST_CONFIG = {
    movie: {
      label: 'Phim / Nội dung',
      icon: '🎬',
      defaultStatus: 'planned',
      statuses: [
        { value: 'planned', label: 'Mới lên kế hoạch' },
        { value: 'watched', label: 'Đã xem' },
        { value: 'favorite', label: 'Yêu thích' },
        { value: 'dropped', label: 'Bỏ qua' }
      ]
    },
    place: {
      label: 'Nơi đi chơi',
      icon: '📍',
      defaultStatus: 'wish',
      statuses: [
        { value: 'wish', label: 'Muốn đi' },
        { value: 'visited', label: 'Đã đi' },
        { value: 'favorite', label: 'Yêu thích' }
      ]
    }
  };

  const state = {
    activeType: 'movie',
    editingId: null,
    items: []
  };

  function initStatusOptions(type) {
    const config = LIST_CONFIG[type] || LIST_CONFIG.movie;
    const select = document.getElementById('listStatus');
    select.innerHTML = config.statuses.map(item =>
      `<option value="${item.value}">${item.label}</option>`
    ).join('');
    select.value = config.defaultStatus;
  }

  function statusLabel(type, status) {
    const config = LIST_CONFIG[type] || LIST_CONFIG.movie;
    const option = (config.statuses || []).find(item => item.value === status) || config.statuses[0];
    return option ? option.label : 'Chưa xác định';
  }

  function buildCard(item) {
    const meta = [];
    if (item.category) meta.push(item.category);
    if (item.link) meta.push('Link');

    const movieProgress = item.type === 'movie';
    const seasonLabel = Number(item.season || 1);
    const currentEpisode = Number(item.current || 0);
    const totalEpisodes = Number(item.total || 1);
    const safeTotal = Math.max(1, totalEpisodes);
    const clampedCurrent = Math.min(Math.max(currentEpisode, 0), safeTotal);
    const percent = Math.round((clampedCurrent / safeTotal) * 100);
    const movieProgressMarkup = movieProgress ? `
      <div style="margin-top:4px;">
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--list-dim); margin-bottom:6px; font-weight:700;">
          <span>Mùa ${seasonLabel} · ${clampedCurrent}/${safeTotal} tập</span>
          <span>${percent}%</span>
        </div>
        <div style="height:8px; border-radius:999px; background:var(--list-soft); overflow:hidden; border:1px solid var(--list-border);">
          <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, var(--list-accent), var(--list-accent-strong)); border-radius:inherit;"></div>
        </div>
      </div>
    ` : '';

    const movieActionMarkup = movieProgress ? `
      <button class="icon-btn" type="button" data-action="increment-progress" data-id="${item.id}" title="+1 tập">+1</button>
    ` : '';

    return `
      <article class="list-card" data-id="${item.id}">
        <div class="card-top">
          <span class="item-badge">${LIST_CONFIG[item.type]?.icon || '✨'} ${LIST_CONFIG[item.type]?.label || 'Danh sách'}</span>
          <span class="status-pill status-${item.status || 'planned'}">${statusLabel(item.type, item.status)}</span>
        </div>
        <div>
          <h3 class="item-name">${escapeHtml(item.name || 'Không tên')}</h3>
          ${item.notes ? `<div class="muted">${escapeHtml(item.notes)}</div>` : ''}
        </div>
        ${movieProgressMarkup}
        <div class="item-meta">
          ${meta.map(tag => `<span class="mini-tag">${escapeHtml(tag)}</span>`).join('') || '<span class="mini-tag">Mới</span>'}
        </div>
        <div class="card-actions">
          ${item.link ? `<a class="icon-btn" href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer" title="Mở link">↗</a>` : '<span class="icon-btn" aria-hidden="true">•</span>'}
          ${movieActionMarkup}
          <button class="icon-btn" type="button" data-action="edit" data-id="${item.id}" title="Sửa">✎</button>
          <button class="icon-btn" type="button" data-action="delete" data-id="${item.id}" title="Xóa">🗑</button>
        </div>
      </article>
    `;
  }

  function escapeHtml(text) {
    const value = String(text ?? '');
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderList() {
    const items = state.items.filter(item => item.type === state.activeType);
    const grid = document.getElementById('listGrid');
    const emptyState = document.getElementById('emptyState');

    if (!items.length) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = items.map(buildCard).join('');
  }

  function syncMovieProgressFields() {
    const isMovie = document.getElementById('listType').value === 'movie';
    const wrapper = document.getElementById('movieProgressFields');
    wrapper.style.display = isMovie ? 'block' : 'none';
  }

  function resetForm() {
    state.editingId = null;
    document.getElementById('listId').value = '';
    document.getElementById('listName').value = '';
    document.getElementById('listCategory').value = '';
    document.getElementById('listNotes').value = '';
    document.getElementById('listLink').value = '';
    document.getElementById('movieSeason').value = '';
    document.getElementById('movieCurrentEpisode').value = '';
    document.getElementById('movieTotalEpisodes').value = '';
    document.getElementById('listType').value = state.activeType;
    syncMovieProgressFields();
    initStatusOptions(state.activeType);
    document.getElementById('formTitle').textContent = `Thêm ${LIST_CONFIG[state.activeType].label.toLowerCase()}`;
  }

  async function loadItems() {
    if (!window.Store || typeof window.Store.getListItems !== 'function') return;
    const items = await window.Store.getListItems();
    state.items = items || [];
    renderList();
  }

  async function saveItem(event) {
    event.preventDefault();
    if (!window.Store || typeof window.Store.addListItem !== 'function' || typeof window.Store.updateListItem !== 'function') return;

    const itemType = document.getElementById('listType').value;
    const payload = {
      type: itemType,
      name: document.getElementById('listName').value.trim(),
      status: document.getElementById('listStatus').value,
      category: document.getElementById('listCategory').value.trim(),
      notes: document.getElementById('listNotes').value.trim(),
      link: document.getElementById('listLink').value.trim() || ''
    };

    if (itemType === 'movie') {
      const season = Number(document.getElementById('movieSeason').value || 1);
      const current = Number(document.getElementById('movieCurrentEpisode').value || 0);
      const total = Number(document.getElementById('movieTotalEpisodes').value || 1);
      const safeTotal = Math.max(1, total);
      payload.season = Math.max(1, season);
      payload.current = Math.min(Math.max(current, 0), safeTotal);
      payload.total = safeTotal;
      payload.progressMode = 'episode';
      payload.progress = Math.round((payload.current / safeTotal) * 100);
      if (payload.current >= safeTotal) payload.status = 'watched';
    }

    if (!payload.name) {
      document.getElementById('listName').focus();
      return;
    }

    if (state.editingId) {
      await window.Store.updateListItem(state.editingId, payload);
    } else {
      await window.Store.addListItem(payload);
    }

    await loadItems();
    state.activeType = payload.type;
    syncTabs();
    resetForm();
  }

  async function deleteItem(itemId) {
    if (!itemId || !window.Store || typeof window.Store.deleteListItem !== 'function') return;
    if (!confirm('Xóa mục này khỏi danh sách?')) return;
    await window.Store.deleteListItem(itemId);
    await loadItems();
  }

  function fillEditor(itemId) {
    const item = state.items.find(entry => entry.id === itemId);
    if (!item) return;

    state.editingId = item.id;
    state.activeType = item.type;
    syncTabs();
    document.getElementById('listType').value = item.type;
    syncMovieProgressFields();
    initStatusOptions(item.type);
    document.getElementById('listStatus').value = item.status || LIST_CONFIG[item.type].defaultStatus;
    document.getElementById('listId').value = item.id;
    document.getElementById('listName').value = item.name || '';
    document.getElementById('listCategory').value = item.category || '';
    document.getElementById('listNotes').value = item.notes || '';
    document.getElementById('listLink').value = item.link || '';
    if (item.type === 'movie') {
      document.getElementById('movieSeason').value = Number(item.season || 1);
      document.getElementById('movieCurrentEpisode').value = Number(item.current || 0);
      document.getElementById('movieTotalEpisodes').value = Number(item.total || 1);
    }
    document.getElementById('formTitle').textContent = `Sửa ${LIST_CONFIG[item.type].label.toLowerCase()}`;
  }

  function syncTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      const active = btn.dataset.type === state.activeType;
      btn.classList.toggle('active', active);
    });
    const typeSelect = document.getElementById('listType');
    if (typeSelect) typeSelect.value = state.activeType;
    syncMovieProgressFields();
    initStatusOptions(state.activeType);
    document.getElementById('formTitle').textContent = `Thêm ${LIST_CONFIG[state.activeType].label.toLowerCase()}`;
    renderList();
  }

  function bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        state.activeType = button.dataset.type;
        state.editingId = null;
        syncTabs();
        resetForm();
      });
    });

    document.getElementById('openAddForm').addEventListener('click', () => {
      state.editingId = null;
      resetForm();
      document.getElementById('listName').focus();
    });

    document.getElementById('cancelForm').addEventListener('click', resetForm);
    document.getElementById('listForm').addEventListener('submit', saveItem);
    document.getElementById('listType').addEventListener('change', (event) => {
      state.activeType = event.target.value;
      state.editingId = null;
      syncMovieProgressFields();
      initStatusOptions(state.activeType);
      syncTabs();
    });

    document.getElementById('listGrid').addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const id = button.dataset.id;
      const action = button.dataset.action;
      if (action === 'edit') fillEditor(id);
      if (action === 'delete') await deleteItem(id);
      if (action === 'increment-progress') {
        if (!window.Lists || typeof window.Lists.incrementProgress !== 'function') return;
        const updated = await window.Lists.incrementProgress(id, 1);
        if (!updated) return;
        const itemIndex = state.items.findIndex(item => item.id === id);
        if (itemIndex >= 0) {
          state.items[itemIndex] = { ...state.items[itemIndex], ...updated, current: updated.current, total: updated.total, progress: updated.percent, status: updated.status || state.items[itemIndex].status };
          renderList();
        }
      }
    });
  }

  function initializeLists() {
    bindEvents();
    syncMovieProgressFields();
    initStatusOptions(state.activeType);
    resetForm();
    loadItems();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.gpxAuth && window.gpxAuth.currentUser) {
      initializeLists();
      return;
    }
    document.addEventListener('gpx-ready', initializeLists, { once: true });
  });
})();
