(function () {
  "use strict";

  function parseDateInput(value) {
    if (!value || typeof value !== 'string') return null;
    const pieces = value.split('-').map(Number);
    if (pieces.length !== 3 || pieces.some(Number.isNaN)) return null;
    return new Date(pieces[0], pieces[1] - 1, pieces[2]);
  }

  function formatDateLabel(date) {
    if (window.DateUtils && typeof window.DateUtils.formatDateLabel === 'function') {
      return window.DateUtils.formatDateLabel(date);
    }
    const d = new Date(date);
    const dow = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
    const pad = value => String(value).padStart(2, '0');
    return `${dow}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  function monthKeyFromDate(dateLike) {
    const d = new Date(dateLike);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function getUserDisplayName(authUser) {
    if (!authUser) return 'bạn';
    const raw = authUser.displayName && authUser.displayName.trim();
    if (raw) return raw;
    const email = authUser.email && authUser.email.trim();
    if (email) {
      const localPart = email.split('@')[0] || 'bạn';
      const firstName = localPart.split(/[._-]+/).filter(Boolean)[0] || localPart;
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }
    return 'bạn';
  }

  function getAvatarInitials(authUser) {
    const name = getUserDisplayName(authUser);
    const words = name.split(/\s+/).filter(Boolean);
    if (!words.length) return 'B';
    return words.slice(0, 2).map(part => part[0].toUpperCase()).join('').slice(0, 2) || 'B';
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function getGeneralTaskItems(todoData) {
    const data = todoData && typeof todoData === 'object' ? todoData : {};
    const general = data.general && typeof data.general === 'object' ? data.general : {};
    const qKeys = ['q1', 'q2', 'q3', 'q4'];
    const items = [];
    qKeys.forEach(key => {
      const bucket = safeArray(general[key]);
      bucket.forEach(item => {
        if (!item || item.done) return;
        items.push({
          id: item.id || Math.random().toString(36).slice(2),
          text: item.text || 'Công việc mới',
          priority: key
        });
      });
    });
    return items;
  }

  function getDailyTaskItems(todoData, todayIso) {
    const data = todoData && typeof todoData === 'object' ? todoData : {};
    const byDate = data.byDate && typeof data.byDate === 'object' ? data.byDate : {};
    const dayBucket = byDate[todayIso] && typeof byDate[todayIso] === 'object' ? byDate[todayIso] : null;
    if (!dayBucket) return [];
    const qKeys = ['q1', 'q2', 'q3', 'q4'];
    const items = [];
    qKeys.forEach(key => {
      const bucket = safeArray(dayBucket[key]);
      bucket.forEach(item => {
        if (!item || item.done) return;
        items.push({
          id: item.id || Math.random().toString(36).slice(2),
          text: item.text || 'Công việc mới',
          priority: key
        });
      });
    });
    return items;
  }

  function getTodayFocus(todoData, todayIso) {
    const fromDaily = getDailyTaskItems(todoData, todayIso);
    if (fromDaily.length) return fromDaily.slice(0, 3);
    return getGeneralTaskItems(todoData).slice(0, 3);
  }

  function getGoalsProgress(goals) {
    const list = safeArray(goals);
    if (!list.length) {
      return { percent: 0, completed: 0, active: 0, nextDue: null };
    }

    const activeGoals = list.filter(goal => !goal.completed);
    const completedGoals = list.filter(goal => goal.completed);
    if (!activeGoals.length && !completedGoals.length) {
      return { percent: 0, completed: 0, active: 0, nextDue: null };
    }

    const progressValues = list.map(goal => {
      if (goal.completed) return 1;
      const sessions = safeArray(goal.sessions);
      const totalHours = Number(goal.hoursTotal || 0);
      if (totalHours > 0) {
        const hoursLogged = sessions.reduce((sum, item) => sum + Number(item && item.hours ? item.hours : 0), 0);
        return Math.min(1, hoursLogged / totalHours);
      }
      const milestones = safeArray(goal.milestones);
      if (milestones.length) {
        const doneCount = milestones.filter(item => item && item.done).length;
        return doneCount / milestones.length;
      }
      return 0;
    });

    const totalProgress = progressValues.reduce((sum, value) => sum + value, 0);
    const percent = Math.round((totalProgress / Math.max(1, list.length)) * 100);

    let nextDue = null;
    activeGoals.forEach(goal => {
      const targetDate = goal.targetDate ? parseDateInput(goal.targetDate) : null;
      if (!targetDate) return;
      if (!nextDue || targetDate < nextDue) nextDue = targetDate;
    });

    return {
      percent,
      completed: completedGoals.length,
      active: activeGoals.length,
      nextDue
    };
  }

  function getFinanceSnapshot(financeData) {
    const transactions = safeArray(financeData && financeData.transactions);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthIncome = transactions
      .filter(item => item && item.type === 'income' && item.date && item.date.startsWith(monthKey))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const monthExpense = transactions
      .filter(item => item && item.type === 'expense' && item.date && item.date.startsWith(monthKey))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const balance = monthIncome - monthExpense;
    return {
      monthIncome,
      monthExpense,
      monthBalance: balance,
      monthKey
    };
  }

  function getCalendarSnapshot(events, todayIso) {
    const list = safeArray(events);
    const today = parseDateInput(todayIso) || new Date();
    const todayDay = today.getDay();
    const items = list.filter(item => {
      if (!item) return false;
      if (item.recurring) {
        const dow = item.dow != null ? Number(item.dow) : null;
        if (dow == null || Number(dow) !== todayDay) return false;
        const recurStart = item.recurStart ? parseDateInput(item.recurStart) : null;
        const recurEnd = item.recurEnd ? parseDateInput(item.recurEnd) : null;
        if (recurStart && today < recurStart) return false;
        if (recurEnd && today > recurEnd) return false;
        return true;
      }
      return item.date === todayIso;
    }).sort((a, b) => (a.start || '').localeCompare(b.start || ''));

    return items;
  }

  function buildSnapshot({ authUser, todoData, goals, financeData, events, today }) {
    const todayDate = today ? new Date(today) : new Date();
    const todayIso = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    const userName = getUserDisplayName(authUser);
    const avatarInitials = getAvatarInitials(authUser);
    const tasks = getTodayFocus(todoData, todayIso);
    const progress = getGoalsProgress(goals);
    const finance = getFinanceSnapshot(financeData);
    const calendarToday = getCalendarSnapshot(events, todayIso);
    const nextDue = progress.nextDue ? formatDateLabel(progress.nextDue) : 'Chưa có mục tiêu';

    return {
      userName,
      avatarInitials,
      greeting: `Chào ${userName} 👋`,
      dateLabel: formatDateLabel(todayDate),
      todayFocus: tasks,
      progressPercent: progress.percent,
      progressActive: progress.active,
      progressCompleted: progress.completed,
      countdownLabel: nextDue,
      finance,
      calendarToday,
      goalSnapshot: {
        active: progress.active,
        completed: progress.completed,
        nextDue
      }
    };
  }

  window.DashboardData = {
    buildSnapshot,
    getCurrentUserProfile: function () {
      if (window.gpxAuth && window.gpxAuth.currentUser) {
        return window.gpxAuth.currentUser;
      }
      return null;
    }
  };
})();
