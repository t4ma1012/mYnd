(function(){
  'use strict';

  function pad2(value){ return String(value).padStart(2, '0'); }

  function parseISODate(value){
    if (!value || typeof value !== 'string') return null;
    const text = value.trim();
    if (!text) return null;
    const iso = text.match(/^\d{4}-\d{2}-\d{2}$/);
    if (iso) {
      const [y, m, d] = text.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
        return date;
      }
      return null;
    }
    const parts = text.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if ([d, m, y].some(v => !Number.isFinite(v))) return null;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
      return date;
    }
    return null;
  }

  function formatAsDmy(value){
    const date = parseISODate(value);
    if (!date) return '';
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function digitsToDisplay(value){
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  function isoFromDmy(value){
    const text = String(value || '').trim();
    if (!text) return '';
    const isoMatch = text.match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoMatch) return text;
    const parts = text.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    if (!d || !m || !y) return '';
    const day = Number(d), month = Number(m), year = Number(y);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return '';
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  function monthLabel(date){
    return date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
  }

  function renderCalendar(input){
    const popup = input._dateInputPopup;
    if (!popup) return;
    const monthDate = input._calendarMonth || new Date();
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const startOffset = (monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1);
    const totalDays = monthEnd.getDate();
    const cells = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ empty: true });
    }
    for (let day = 1; day <= totalDays; day++) {
      cells.push({ empty: false, day, value: new Date(monthDate.getFullYear(), monthDate.getMonth(), day) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ empty: true });
    }

    const currentIso = isoFromDmy(input.value);
    const selectedDate = currentIso ? parseISODate(currentIso) : null;

    popup.innerHTML = `
      <div class="date-input-header">
        <button type="button" class="date-input-nav" data-nav="prev" aria-label="Tháng trước">‹</button>
        <div class="date-input-month">${monthLabel(monthStart)}</div>
        <button type="button" class="date-input-nav" data-nav="next" aria-label="Tháng sau">›</button>
      </div>
      <div class="date-input-weekdays">
        <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
      </div>
      <div class="date-input-grid">
        ${cells.map(cell => {
          if (cell.empty) return '<div class="date-input-empty"></div>';
          const isSelected = selectedDate && cell.value.getFullYear() === selectedDate.getFullYear() && cell.value.getMonth() === selectedDate.getMonth() && cell.value.getDate() === selectedDate.getDate();
          const isToday = cell.value.toDateString() === new Date().toDateString();
          return `<button type="button" class="date-input-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}" data-day="${cell.value.getDate()}">${cell.value.getDate()}</button>`;
        }).join('')}
      </div>
    `;

    popup.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + (btn.dataset.nav === 'next' ? 1 : -1), 1);
        input._calendarMonth = nextMonth;
        renderCalendar(input);
      });
    });

    popup.querySelectorAll('.date-input-day').forEach(dayButton => {
      dayButton.addEventListener('click', (event) => {
        event.preventDefault();
        const day = Number(event.currentTarget.dataset.day);
        const chosen = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const iso = `${chosen.getFullYear()}-${pad2(chosen.getMonth() + 1)}-${pad2(chosen.getDate())}`;
        setValue(input, iso);
        popup.classList.remove('open');
      });
    });
  }

  function openCalendar(input){
    if (!input || !input._dateInputPopup) return;
    const currentIso = isoFromDmy(input.value);
    input._calendarMonth = currentIso ? parseISODate(currentIso) : new Date();
    renderCalendar(input);
    input._dateInputPopup.classList.add('open');
  }

  function closeCalendar(input){
    if (!input || !input._dateInputPopup) return;
    input._dateInputPopup.classList.remove('open');
  }

  function attach(input){
    if (!input || input.dataset.dateInputAttached === 'true') return;

    input.dataset.dateInputAttached = 'true';
    input.type = 'text';
    if (typeof input.setAttribute === 'function') {
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('autocomplete', 'off');
    }
    if (input.classList && typeof input.classList.add === 'function') {
      input.classList.add('shared-date-input');
    }
    if (!input.placeholder) input.placeholder = 'dd/mm/yyyy';

    const shell = document.createElement('div');
    shell.className = 'date-input-shell';
    shell.style.position = 'relative';

    const parent = input.parentNode;
    if (parent) {
      parent.insertBefore(shell, input);
      shell.appendChild(input);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-input-btn';
    button.setAttribute('aria-label', 'Chọn ngày');
    button.textContent = '📅';
    shell.appendChild(button);

    const popup = document.createElement('div');
    popup.className = 'date-input-popup';
    shell.appendChild(popup);
    input._dateInputPopup = popup;
    input._calendarMonth = new Date();

    input.addEventListener('input', function(){
      const nextValue = digitsToDisplay(this.value);
      this.value = nextValue;
    });

    input.addEventListener('blur', function(){
      const iso = isoFromDmy(this.value);
      if (this.value && !iso) {
        this.value = '';
      } else if (this.value) {
        this.value = formatAsDmy(iso);
      }
      closeCalendar(this);
    });

    button.addEventListener('click', function(event){
      event.preventDefault();
      event.stopPropagation();
      if (popup.classList.contains('open')) {
        closeCalendar(input);
      } else {
        openCalendar(input);
      }
    });

    document.addEventListener('click', function(event){
      if (!shell.contains(event.target)) {
        closeCalendar(input);
      }
    });
  }

  function getValue(input){
    if (!input) return '';
    const text = String(input.value || '').trim();
    if (!text) return '';
    const iso = isoFromDmy(text);
    if (iso) return iso;
    const asIso = parseISODate(text);
    return asIso ? `${asIso.getFullYear()}-${pad2(asIso.getMonth() + 1)}-${pad2(asIso.getDate())}` : '';
  }

  function setValue(input, isoString){
    if (!input) return;
    const normalized = String(isoString || '').trim();
    const iso = parseISODate(normalized) ? `${parseISODate(normalized).getFullYear()}-${pad2(parseISODate(normalized).getMonth() + 1)}-${pad2(parseISODate(normalized).getDate())}` : isoFromDmy(normalized);
    const date = parseISODate(iso);
    input.value = date ? formatAsDmy(iso) : (normalized.includes('/') ? normalized : '');
    if (date) {
      input._calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }
  }

  window.DateInput = {
    attach,
    getValue,
    setValue,
    formatAsDmy,
    isoFromDmy
  };
})();
