const fs = require('fs');
const vm = require('vm');

function makeFakeElement(id = '') {
  return {
    id,
    value: '',
    dataset: {},
    style: {},
    className: '',
    innerHTML: '',
    textContent: '',
    disabled: false,
    checked: false,
    options: [],
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    appendChild() {},
    querySelector(selector) {
      if (selector === '.del-x') return makeFakeElement('del-x');
      if (selector === 'button') return makeFakeElement('button');
      if (selector === 'input') return makeFakeElement('input');
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'input') return [makeFakeElement('input-1'), makeFakeElement('input-2'), makeFakeElement('input-3')];
      if (selector === 'button') return [makeFakeElement('btn-1')];
      return [];
    },
    addEventListener() {},
    focus() {},
    click() {},
    getContext() { return null; },
    closest() { return null; }
  };
}

const ids = [
  'budgetAlert','budgetAlertText','sumBalance','sumIncome','sumExpense','sumSavings','dashMonthLabel','sumIncomeFoot','sumExpenseFoot',
  'planPeriodLabel','planIncome','planSavedAmt','planActualSaved','planSavedProgress','planAllowance','planSpent','planLeftover','planLeftoverLine','planBar','planHint','resetPlanBtn','addSavingsDepositBtn','addSavingsDepositForm','savingsAmountInput','savingsNoteInput','saveSavingsDepositBtn','cancelSavingsDepositBtn',
  'foodCard','foodCardBody','donut','legend','donutAmt','recentList','reportOverview','reportBudgetTable','reportDaily','reportFood',
  'reportMonthLabel','filterMonth','filterType','filterCategory','ledgerCard','wishGrid','expenseCatList','incomeCatList',
  'dailyFoodBudgetInput','saveDailyFoodBudgetBtn','monthlySavingsTargetInput','monthlySavingsTargetMonth','saveMonthlySavingsTargetBtn',
  'clearMonthTransactionsBtn','resetBudgetLimitBtn','resetBtn','exportBtn','importFile','addBtn','txOverlay','txModalTitle','txDeleteBtn',
  'txCancelBtn','txSaveBtn','tx-amount','tx-date','tx-title','tx-note','typeSeg','paletteGrid','categoryField','categoryChosenName',
  'wishOverlay','wishModalTitle','wishDeleteBtn','wishCancelBtn','wishSaveBtn','w-name','w-price','w-priority','w-note','toastWrap',
  'planSavedProgressFill','planSavedProgressLabel','sumSavings','sumIncomeFoot','sumExpenseFoot'
];
const documentMap = new Map(ids.map(id => [id, makeFakeElement(id)]));
const listeners = {};
const documentStub = {
  body: { appendChild() {} },
  addEventListener(event, handler) { listeners[event] = handler; },
  getElementById(id) {
    if (!documentMap.has(id)) documentMap.set(id, makeFakeElement(id));
    return documentMap.get(id);
  },
  querySelectorAll(selector) {
    if (selector === '.tab-btn') return [];
    if (selector === '.tab-panel') return [];
    if (selector === '.shared-date-input') return [];
    return [];
  },
  createElement(tag) { return makeFakeElement(tag); },
  querySelector() { return null; }
};
const storageData = {
  'finance-data-v2': JSON.stringify({
    transactions: [
      { id: 't1', type: 'income', category: 'luong_lam', amount: 4000000, date: '2026-09-01', title: 'Lương', note: '' },
      { id: 't2', type: 'expense', category: 'an_uong', amount: 1800000, date: '2026-09-05', title: 'Ăn uống', note: '' },
      { id: 't3', type: 'expense', category: 'giai_tri', amount: 1200000, date: '2026-09-10', title: 'Cafe', note: '' }
    ],
    wishlist: [],
    categoryBudgets: { an_uong: 1000000 },
    planPeriodStart: null,
    monthlySavingsTarget: { '2026-09': 2000000 }
  }),
  'finance-daily-food-budget-v1': '80000',
  'finance-transactions-v1': JSON.stringify([]),
  'finance-budget-limit-v1': JSON.stringify({})
};

const context = {
  console,
  Date,
  Math,
  JSON,
  window: {
    Store: {
      async storageGetRaw(key) { return storageData[key] ?? null; },
      async storageSetRaw() {}
    },
    DateInput: { attach() {}, setValue() {}, getValue() { return null; } },
    gpxAuth: { currentUser: { uid: 'u1' } }
  },
  document: documentStub,
  navigator: { userAgent: 'node' },
  setTimeout,
  clearTimeout,
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
  FileReader: function FileReader() { this.readAsText = () => {}; this.onload = null; }
};
context.window.document = documentStub;
context.global = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('./shared/chi-tieu-page.js', 'utf8'), context);

if (typeof listeners.DOMContentLoaded === 'function') {
  listeners.DOMContentLoaded();
}
setTimeout(() => {
  console.log('planIncome:', documentMap.get('planIncome').textContent);
  console.log('planSavedAmt:', documentMap.get('planSavedAmt').textContent);
  console.log('planAllowance:', documentMap.get('planAllowance').textContent);
  console.log('planLeftover:', documentMap.get('planLeftover').textContent);
  console.log('planHint:', documentMap.get('planHint').textContent);
  console.log('monthlySavingsTargetInput:', documentMap.get('monthlySavingsTargetInput').value);
}, 50);
setTimeout(() => process.exit(0), 150);
