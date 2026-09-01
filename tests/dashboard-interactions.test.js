const fs = require('fs');
const vm = require('vm');

function makeContext() {
  const document = {
    body: { dataset: { page: 'home' } },
    documentElement: { setAttribute() {}, getAttribute() { return 'light'; }, classList: { add() {}, remove() {} } },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return { style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, appendChild() {}, addEventListener() {}, querySelector() { return null; }, innerHTML: '' }; },
    createTextNode() { return {}; }
  };

  const window = {
    Store: {
      storageGetRaw: async () => JSON.stringify({
        general: {
          q1: [{ id: 'task-1', text: 'Nộp báo cáo', done: false }],
          q2: [], q3: [], q4: []
        },
        byDate: {}
      }),
      storageSetRaw: async () => {}
    },
    gpxAuth: { currentUser: { displayName: 'Lan Nguyễn' } },
    DashboardData: {
      buildSnapshot: ({ todoData, goals, financeData, events, today }) => ({
        userName: 'Lan Nguyễn',
        avatarInitials: 'LN',
        dateLabel: 'Thứ 2, 31/08/2026',
        todayFocus: (todoData.general.q1 || []).filter(item => !item.done),
        progressPercent: 50,
        progressActive: 1,
        progressCompleted: 1,
        countdownLabel: 'Chưa có mục tiêu',
        finance: { monthIncome: 5000000, monthExpense: 2500000, monthBalance: 2500000 },
        calendarToday: events || [],
        goalSnapshot: { active: 1, completed: 1, nextDue: 'Chưa có mục tiêu' }
      })
    },
    location: { href: '' }
  };

  const context = { window, document, console, Date, Math, JSON, setTimeout, clearTimeout };
  context.global = context;
  vm.createContext(context);
  return context;
}

try {
  const html = fs.readFileSync('./index.html', 'utf8');
  const scriptMatch = html.match(/<script>\s*\(function\(\)\{([\s\S]*?)\}\)\(\);<\/script>/);
  if (!scriptMatch) {
    throw new Error('Dashboard interaction script was not found');
  }
  const context = makeContext();
  vm.runInContext(scriptMatch[1], context);

  if (!context.window.Dashboard || typeof context.window.Dashboard.toggleTask !== 'function') {
    throw new Error('Dashboard.toggleTask() missing');
  }
  if (!context.window.Dashboard || typeof context.window.Dashboard.getNextGoalDelta !== 'function') {
    throw new Error('Dashboard.getNextGoalDelta() missing');
  }
  if (!context.window.Dashboard || typeof context.window.Dashboard.goToModule !== 'function') {
    throw new Error('Dashboard.goToModule() missing');
  }

  console.log('Dashboard interactions contract test passed');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
