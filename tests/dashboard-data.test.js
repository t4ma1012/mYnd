const fs = require('fs');
const vm = require('vm');

function makeAuthUser(email, displayName) {
  return { email, displayName, uid: 'user-123' };
}

function runTest() {
  const source = fs.readFileSync('./shared/dashboard-data.js', 'utf8');
  const context = {
    window: {},
    console,
    Date,
    Math,
    JSON
  };
  vm.createContext(context);
  vm.runInContext(source, context);

  const user = makeAuthUser('lan.nguyen@gmail.com', '');
  const todoData = {
    general: {
      q1: [{ id: 'a', text: 'Nộp báo cáo', done: false }, { id: 'b', text: 'Đã xong', done: true }],
      q2: [{ id: 'c', text: 'Học tiếng Anh', done: false }],
      q3: [],
      q4: []
    },
    byDate: {}
  };

  const goals = [
    { completed: false, hoursTotal: 10, sessions: [{ hours: 5 }], targetDate: '2026-09-10', startDate: '2026-08-01' },
    { completed: false, hoursTotal: 20, sessions: [{ hours: 10 }], targetDate: '2026-09-15', startDate: '2026-08-05' }
  ];

  const finance = {
    transactions: [
      { type: 'income', amount: 2000000, date: '2026-08-15' },
      { type: 'expense', amount: 500000, date: '2026-08-15' },
      { type: 'expense', amount: 250000, date: '2026-08-20' }
    ]
  };

  const events = [
    { title: 'Học IELTS', start: '08:00', end: '09:00', date: '2026-08-31', recurring: false, color: '#3B82F6' },
    { title: 'Họp nhóm', start: '14:00', end: '15:00', date: '2026-09-01', recurring: false, color: '#0EA69E' }
  ];

  const snapshot = context.window.DashboardData.buildSnapshot({
    authUser: user,
    todoData,
    goals,
    financeData: finance,
    events,
    today: '2026-08-31'
  });

  if (snapshot.userName !== 'Lan') {
    throw new Error('Expected user name to be derived from the email local part');
  }

  if (!snapshot.todayFocus || snapshot.todayFocus.length < 2) {
    throw new Error('Expected at least 2 tasks in today focus');
  }

  if (snapshot.progressPercent !== 50) {
    throw new Error(`Expected 50% goal progress, got ${snapshot.progressPercent}`);
  }

  if (snapshot.finance.monthIncome !== 2000000 || snapshot.finance.monthExpense !== 750000) {
    throw new Error('Expected finance snapshot totals to match the provided transactions');
  }

  if (!snapshot.calendarToday || snapshot.calendarToday[0].title !== 'Học IELTS') {
    throw new Error('Expected today calendar event to be returned first');
  }

  console.log('DashboardData aggregation test passed');
}

try {
  runTest();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
