const fs = require('fs');
const vm = require('vm');

function makeFakeElement(id = '') {
  const el = {
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
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'input') {
        return [makeFakeElement('input-1'), makeFakeElement('input-2'), makeFakeElement('input-3')];
      }
      return [];
    },
    addEventListener() {},
    focus() {},
    click() {},
    getContext() { return null; },
    closest() { return null; }
  };
  return el;
}

const ids = [
  'budgetAlert','budgetAlertText','sumBalance','sumIncome','sumExpense','sumSavings','dashMonthLabel','sumIncomeFoot','sumExpenseFoot',
  'planPeriodLabel','planIncome','planSavedAmt','planActualSaved','planSavedProgress','planAllowance','planSpent','planLeftover','planLeftoverLine','planBar','planHint','resetPlanBtn','addSavingsDepositBtn','addSavingsDepositForm','savingsAmountInput','savingsNoteInput','saveSavingsDepositBtn','cancelSavingsDepositBtn',
  'foodCard','foodCardBody','donut','legend','donutAmt','recentList','reportOverview','reportBudgetTable','reportDaily','reportFood',
  'reportMonthLabel','filterMonth','filterType','filterCategory','ledgerCard','wishGrid','expenseCatList','incomeCatList',
  'dailyFoodBudgetInput','saveDailyFoodBudgetBtn','monthlySavingsTargetInput','monthlySavingsTargetMonth','saveMonthlySavingsTargetBtn',
  'clearMonthTransactionsBtn','resetBudgetLimitBtn','resetBtn','exportBtn','importFile','addBtn','txOverlay','txModalTitle','txDeleteBtn',
  'txCancelBtn','txSaveBtn','tx-amount','tx-date','tx-title','tx-note','typeSeg','paletteGrid','categoryField','categoryChosenName',
  'wishOverlay','wishModalTitle','wishDeleteBtn','wishCancelBtn','wishSaveBtn','w-name','w-price','w-priority','w-note','toastWrap'
];

const idMap = Object.fromEntries(ids.map(id => [id, makeFakeElement(id)]));
const tabButtons = ['dashboard', 'ledger', 'report', 'wishlist', 'settings'].map((tab) => {
  const el = makeFakeElement();
  el.dataset = { tab };
  el.classList = { add() {}, remove() {}, toggle() {} };
  return el;
});
const tabPanels = ['dashboard', 'ledger', 'report', 'wishlist', 'settings'].map((tab) => {
  const el = makeFakeElement(`tab-${tab}`);
  el.classList = { add() {}, remove() {}, toggle() {} };
  return el;
});

const documentMap = new Map();
function getElementById(id) {
  if (!documentMap.has(id)) {
    documentMap.set(id, makeFakeElement(id));
  }
  return documentMap.get(id);
}

for (const [id, el] of Object.entries(idMap)) {
  documentMap.set(id, el);
}

const listeners = {};
const documentStub = {
  body: { appendChild() {} },
  addEventListener(event, handler) {
    listeners[event] = handler;
  },
  getElementById(id) {
    const el = getElementById(id);
    if (id === 'filterMonth' || id === 'filterCategory') {
      el.options = [];
    }
    return el;
  },
  querySelectorAll(selector) {
    if (selector === '.tab-btn') return tabButtons;
    if (selector === '.tab-panel') return tabPanels;
    if (selector === '.shared-date-input') return [];
    return [makeFakeElement('query-item')];
  },
  createElement(tag) {
    return makeFakeElement(tag);
  },
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
      async storageGetRaw(key) {
        return storageData[key] ?? null;
      },
      async storageSetRaw() {}
    },
    DateInput: {
      attach() {},
      setValue() {},
      getValue() { return null; }
    },
    gpxAuth: { currentUser: { uid: 'u1' } }
  },
  document: documentStub,
  navigator: { userAgent: 'node' },
  setTimeout,
  clearTimeout,
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
  FileReader: function FileReader() {
    this.readAsText = () => {};
    this.onload = null;
  }
};

context.window.document = documentStub;
context.global = context;

vm.createContext(context);
vm.runInContext(fs.readFileSync('./shared/chi-tieu-page.js', 'utf8'), context);

(async () => {
  const ready = listeners.DOMContentLoaded;
  if (typeof ready === 'function') {
    ready();
  }
  await new Promise((resolve) => setTimeout(resolve, 25));

  const monthTarget = documentMap.get('monthlySavingsTargetInput')?.value || '';
  const monthLabel = documentMap.get('monthlySavingsTargetMonth')?.textContent || '';
  const planIncome = documentMap.get('planIncome')?.textContent || '';
  const planSaved = documentMap.get('planSavedAmt')?.textContent || '';
  const planAllowance = documentMap.get('planAllowance')?.textContent || '';
  const planLeftover = documentMap.get('planLeftover')?.textContent || '';
  const planHint = documentMap.get('planHint')?.textContent || '';

  if (monthTarget !== '2000000') {
    throw new Error(`Expected monthly target input to default to 2000000, got ${monthTarget}`);
  }
  if (!planIncome.includes('4.000.000')) {
    throw new Error(`Expected income total to show 4.000.000 đ, got ${planIncome}`);
  }
  if (!planSaved.includes('2.000.000')) {
    throw new Error(`Expected target saving to display 2.000.000 đ, got ${planSaved}`);
  }
  if (!planAllowance.includes('4.000.000')) {
    throw new Error(`Expected allowed spend to show 4.000.000 đ with actual savings at 0, got ${planAllowance}`);
  }
  if (!planLeftover.includes('1.000.000')) {
    throw new Error(`Expected leftover to show 1.000.000 đ after spending 3.000.000, got ${planLeftover}`);
  }
  if (!planHint.includes('đạt mục tiêu')) {
    throw new Error(`Expected success hint for planned saving, got ${planHint}`);
  }
  if (!monthLabel.includes('Tháng')) {
    throw new Error(`Expected month label to render, got ${monthLabel}`);
  }

  console.log('Monthly target summary regression test passed');
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
