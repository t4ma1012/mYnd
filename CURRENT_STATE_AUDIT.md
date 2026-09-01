# CURRENT STATE AUDIT

Date: 2026-08-31
Project root: D:\HK3\NOTIOn\khong-gian-cua-toi\khong-gian-cua-toi

This audit is based only on the current workspace contents and runtime code paths in the repository. It is an analysis-only document and does not modify application code or implement new behavior.

---

## Scope and method

This project is a static multi-page web application with shared JavaScript modules. The app is not a framework app; it is a set of HTML pages that load shared scripts and use Firebase Auth + Firestore for user-scoped persistence, with localStorage as an immediate cache and fallback store.

Core files reviewed:
- index.html
- lich-tuan.html
- chi-tieu.html
- gia-su.html
- muc-tieu.html
- danh-sach.html
- shared/app-shell.js
- shared/store.js
- shared/firebase-config.js
- shared/dashboard-data.js
- README.md
- tests/lists-foundation.test.js
- tests/store.user-isolation.test.js

---

## 1. CURRENT FEATURES

| Area | Feature | Status | Actually works? | Where implemented | Notes |
|---|---|---|---|---|---|
| Authentication | Login | 🟢 WORKING | Yes | `shared/app-shell.js` | Calls `window.gpxAuth.signInWithEmailAndPassword(email, pass)` when user clicks login. |
| Authentication | Logout | 🟢 WORKING | Yes | `shared/app-shell.js` | Sign out button triggers `window.gpxAuth.signOut()` after confirmation. |
| Authentication | Sign-up | 🔴 NOT IMPLEMENTED | No | `shared/app-shell.js` | No sign-up form or `createUserWithEmailAndPassword` call exists. |
| Authentication | Password reset / account recovery | 🔴 NOT IMPLEMENTED | No | `shared/app-shell.js` | No reset form or `sendPasswordResetEmail` call exists. |
| Authentication | Session persistence | 🟢 WORKING | Yes | `shared/app-shell.js`, `shared/store.js` | `onAuthStateChanged` keeps UI state synced to Firebase Auth. |
| Authentication | User UID | 🟢 WORKING | Yes | `shared/app-shell.js`, `shared/store.js` | `user.uid` is passed into `Store.init(window.gpxDb, user.uid)`. |
| Authentication | User data isolation | 🟢 WORKING | Yes | `shared/store.js` | `scopedKey` produces `gpx:{uid}:{key}`; Firestore uses `users/{uid}/kv/{key}`. |
| Dashboard | Greeting | 🟢 WORKING | Yes | `index.html` | Reads `window.gpxAuth.currentUser` and sets header text. |
| Dashboard | Avatar | 🟢 WORKING | Yes | `index.html` | `getUserInitials()` derives initials from display name. |
| Dashboard | Quote | 🔴 NOT IMPLEMENTED | No | `index.html` | No quote data model or rendering found. |
| Dashboard | Date | 🟢 WORKING | Yes | `index.html` | Uses `todayDate()` and locale formatting. |
| Dashboard | Today's tasks | 🟢 WORKING | Yes | `index.html`, `lich-tuan.html` | Reads `todo-matrix-v1` and renders focus list. |
| Dashboard | Daily progress | 🟢 WORKING | Yes | `index.html`, `shared/dashboard-data.js` | Uses `buildSnapshot()` and `progressPercent` values. |
| Dashboard | Streak | 🔴 NOT IMPLEMENTED | No | None found | No streak model or calculation exists. |
| Dashboard | Countdown | 🟢 WORKING | Yes | `index.html` | `getNextGoalDelta()` computes next due goal and countdown. |
| Dashboard | Weather | 🔴 NOT IMPLEMENTED | No | None found | No weather API or data model found. |
| Dashboard | Smart summary | 🟡 PARTIAL | Partially | `index.html`, `shared/dashboard-data.js` | Aggregates some snapshots but not a true AI/summary engine. |
| Dashboard | Goal snapshot | 🟢 WORKING | Yes | `index.html`, `shared/dashboard-data.js` | Uses goal data to render summary values. |
| Dashboard | Finance snapshot | 🟢 WORKING | Yes | `index.html`, `chi-tieu.html` | Reads finance data and shows monthly balances. |
| Dashboard | Calendar/event snapshot | 🟢 WORKING | Yes | `index.html` | `renderCalendarSummary()` reads event list and renders today events. |
| Dashboard | Quick Add | 🔴 NOT IMPLEMENTED | No | None found | No global quick-add modal or data entry flow exists. |
| Calendar | Calendar view | 🟢 WORKING | Yes | `lich-tuan.html` | Weekly planner with day columns and event grid exists. |
| Calendar | Weekly planner | 🟢 WORKING | Yes | `lich-tuan.html` | Renders week grid and mini month. |
| Calendar | Tasks | 🟢 WORKING | Yes | `lich-tuan.html` | `todo-matrix-v1` and `renderTodoPanel()` exist. |
| Calendar | Task creation | 🟢 WORKING | Yes | `lich-tuan.html` | `addTodo()` pushes new task into quadrant bucket. |
| Calendar | Task editing | 🟡 PARTIAL | Partially | `lich-tuan.html` | Existing tasks can be toggled or deleted, but there is no dedicated edit modal. |
| Calendar | Task deletion | 🟢 WORKING | Yes | `lich-tuan.html` | `deleteTodo()` removes from bucket. |
| Calendar | Task completion | 🟢 WORKING | Yes | `lich-tuan.html`, `index.html` | Checkbox toggles `done` state. |
| Calendar | Recurring tasks | 🔴 NOT IMPLEMENTED | No | `lich-tuan.html` | No recurring-task model exists; only recurring events exist. |
| Calendar | Events | 🟢 WORKING | Yes | `lich-tuan.html` | Event creation and editing functions exist. |
| Calendar | Recurring events | 🟢 WORKING | Yes | `lich-tuan.html` | `recurring`, `dow`, `recurStart`, `recurEnd` logic exists. |
| Calendar | Date navigation | 🟢 WORKING | Yes | `lich-tuan.html` | Month/week button controls exist. |
| Finance | Income | 🟢 WORKING | Yes | `chi-tieu.html` | Adds transaction entries with `type: 'income'`. |
| Finance | Expense | 🟢 WORKING | Yes | `chi-tieu.html` | Adds transaction entries with `type: 'expense'`. |
| Finance | Edit transaction | 🟢 WORKING | Yes | `chi-tieu.html` | `openTxModal(tx)` and save path update an existing record. |
| Finance | Delete transaction | 🟢 WORKING | Yes | `chi-tieu.html` | `txDeleteBtn` removes by `id`. |
| Finance | Categories | 🟢 WORKING | Yes | `chi-tieu.html` | Default categories and custom category creation exist. |
| Finance | Budgets | 🟢 WORKING | Yes | `chi-tieu.html` | `categoryBudgets` and budget tracking exist. |
| Finance | Daily limit | 🟡 PARTIAL | Partially | `chi-tieu.html` | Food budget helper exists, but no generic daily-limit abstraction. |
| Finance | Reports | 🟢 WORKING | Yes | `chi-tieu.html` | Dashboard/report tabs compute monthly summaries. |
| Finance | Charts | 🟡 PARTIAL | Partially | `chi-tieu.html` | Donut chart and bars exist, but not a general chart framework. |
| Finance | Wishlist | 🟢 WORKING | Yes | `chi-tieu.html` | Add/edit/delete and purchase tracking exist. |
| Finance | Savings | 🟢 WORKING | Yes | `chi-tieu.html` | `save_in` and `save_out` transaction types and plan logic exist. |
| Goals | Create | 🟢 WORKING | Yes | `muc-tieu.html` | Goal modal supports create. |
| Goals | Edit | 🟢 WORKING | Yes | `muc-tieu.html` | `openGoalModalEdit()` and update branch exist. |
| Goals | Delete | 🟢 WORKING | Yes | `muc-tieu.html` | Confirmation prompt removes goal record. |
| Goals | Progress | 🟢 WORKING | Yes | `muc-tieu.html` | `computeStats()` calculates progress percent and status. |
| Goals | Milestones | 🟢 WORKING | Yes | `muc-tieu.html` | Add/update/toggle/delete milestone rows exist. |
| Goals | Target date | 🟢 WORKING | Yes | `muc-tieu.html` | `targetDate` is required and used for due/pace calculations. |
| Goals | Focus/session integration | 🔴 NOT IMPLEMENTED | No | None found | There is no explicit focus timer integration tying goals to session tracking beyond manual log session. |
| Goals | Session history | 🟢 WORKING | Yes | `muc-tieu.html` | `sessions` array with date and hours exists. |
| Goals | Dashboard integration | 🟢 WORKING | Yes | `index.html`, `muc-tieu.html` | Dashboard reads `muc_tieu_hoc_tap_goals_v1` and countdown/goal snapshot. |
| Lists | Movies | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | Movie list items and statuses exist. |
| Lists | Movie status | 🟢 WORKING | Yes | `danh-sach.html` | `status` values like planned/watched/favorite/dropped exist. |
| Lists | Current episode | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | `current` field is stored and rendered in movie progress UI. |
| Lists | Total episodes | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | `total` field is stored and rendered. |
| Lists | Percentage progress | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | `progress` is derived and rendered. |
| Lists | +1 episode | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | `incrementProgress(itemId, 1)` updates the item. |
| Lists | Places | 🟢 WORKING | Yes | `danh-sach.html` | List type includes `place` entries. |
| Lists | Restaurants/cafes | 🟢 WORKING | Yes | `danh-sach.html` | List type includes `restaurant` entries. |
| Lists | Links | 🟢 WORKING | Yes | `danh-sach.html` | `link` field is supported. |
| Lists | Visited status | 🟢 WORKING | Yes | `danh-sach.html` | Status values include visited/tried etc. |
| Lists | Add to finance | 🔴 NOT IMPLEMENTED | No | None found | No actual item-to-finance linking exists. |
| Focus | Timer | 🔴 NOT IMPLEMENTED | No | None found | No focus timer page or implementation exists. |
| Focus | Focus session | 🔴 NOT IMPLEMENTED | No | None found | No dedicated session tracker exists beyond goals session logs. |
| Focus | Goal integration | 🔴 NOT IMPLEMENTED | No | None found | Goal “sessions” are manual logs, not focus-timer integration. |
| Focus | Session history | 🟡 PARTIAL | Partially | `muc-tieu.html` | Goal `sessions` history exists but not a separate focus system. |
| Tutoring | Classes | 🟢 WORKING | Yes | `gia-su.html` | Classes can be created and edited. |
| Tutoring | Students | 🟢 WORKING | Yes | `gia-su.html` | Student rows and student chips exist. |
| Tutoring | Schedule | 🟢 WORKING | Yes | `gia-su.html` | `schedule` field exists and displays in UI. |
| Tutoring | Sessions | 🟢 WORKING | Yes | `gia-su.html` | Session modal and class session list exist. |
| Tutoring | Income | 🟢 WORKING | Yes | `gia-su.html` | `classTotals()` computes revenue and payment status. |
| Tutoring | Payment | 🟢 WORKING | Yes | `gia-su.html` | Payment toggle exists. |
| Tutoring | Deposit | 🔴 NOT IMPLEMENTED | No | None found | No deposit/wallet concept exists. |
| Tutoring | Applications | 🟢 WORKING | Yes | `gia-su.html` | Teach and cyber application tracking exists. |
| Settings | Profile | 🔴 NOT IMPLEMENTED | No | None found | No dedicated profile page or profile document exists. |
| Settings | Avatar | 🔴 NOT IMPLEMENTED | No | None found | No avatar upload or avatar record exists. |
| Settings | Preferences | 🟡 PARTIAL | Partially | `shared/app-shell.js` | Theme preference exists, but not a general preferences store. |
| Settings | Theme | 🟢 WORKING | Yes | `shared/app-shell.js` | Theme toggles and saves `gpx-theme` to localStorage. |
| Settings | Account settings | 🔴 NOT IMPLEMENTED | No | None found | No account settings screen or profile metadata store. |
| Settings | Backup/export | 🟢 WORKING | Yes | `chi-tieu.html` | Export JSON backup exists. |
| Settings | Reset | 🟢 WORKING | Yes | `chi-tieu.html` | Full reset option exists for finance data. |

---

## 2. PARTIAL / BROKEN / MISSING FEATURES

### PARTIAL FEATURES

#### Dashboard smart summary
- What exists: `index.html` renders a few summary blocks: goal, finance, calendar, tutoring, and daily focus.
- What is missing: There is no centralized, domain-driven smart summary engine or abstraction. Logic is split across page functions and summary helpers.
- Files: `index.html`, `shared/dashboard-data.js`
- Required for completion: a shared summary service, a derived snapshot model, and a single dashboard composition layer.

#### Calendar task editing
- What exists: `renderTodoPanel()` includes item rendering, checkbox toggling, and delete actions.
- What is missing: No explicit edit flow for task text or quadrant updates after creation.
- Files: `lich-tuan.html`
- Required for completion: a modal or inline editor plus update/save handler.

#### Finance daily limit logic
- What exists: A food budget helper exists in `chi-tieu.html` (`renderFoodCard()`) with monthly budget projection logic.
- What is missing: This is not a general daily-limit system; it is hard-coded to the `an_uong` category.
- Files: `chi-tieu.html`
- Required for completion: a general daily-limit model or category-level rule abstraction.

#### Finance charts
- What exists: A donut chart and simple bars exist in `chi-tieu.html`.
- What is missing: There is no reusable chart data layer or chart schema; each render function calculates and draws directly in the page script.
- Files: `chi-tieu.html`
- Required for completion: a shared chart data service and broader chart design.

#### Settings preferences
- What exists: Theme persistence exists in `shared/app-shell.js`.
- What is missing: No general preferences store or user settings UI for profile preferences, notifications, or other app controls.
- Files: `shared/app-shell.js`
- Required for completion: a user settings document and settings UI.

#### Focus session history
- What exists: Goal session history exists in `muc-tieu.html`.
- What is missing: There is no separate focus timer/session subsystem with a formal model for start/end/wall-clock time.
- Files: `muc-tieu.html`
- Required for completion: a dedicated focus session entity with start/end timestamps and session aggregation logic.

### BROKEN FEATURES

No feature was clearly broken by runtime errors in the reviewed source, but there are multiple places where the implementation is incomplete or inconsistent rather than outright crashing.

#### 1. Unclear or inconsistent UI feature status versus actual data model
- Exact problem: Some features appear in UI but are not backed by a robust model or service layer. Examples: dashboard summaries, theme preferences, goal pace computations, and list progress.
- Likely cause: Logic was implemented page-by-page in direct DOM scripts instead of a shared service model.
- Relevant file/function: `index.html`, `chi-tieu.html`, `muc-tieu.html`, `danh-sach.html`, `shared/dashboard-data.js`
- Affects data integrity: Partially; mostly affects consistency and maintainability rather than raw data corruption.

#### 2. Incomplete “workable but not fully normalized” status handling
- Exact problem: Status-like values are free text in several modules rather than centralized enums.
- Likely cause: This app stores domain statuses as UI strings and derives behavior from them.
- Relevant file/function: `gia-su.html`, `muc-tieu.html`, `danh-sach.html`, `chi-tieu.html`
- Affects data integrity: Yes, in the sense that filtering and normalization are fragile and may drift over time.

#### 3. Local-first write and Firestore sync race conditions
- Exact problem: `storageSetRaw` writes immediately to localStorage and then writes to Firestore asynchronously with `await ref.set(...)`. If Firestore is slow or fails, the app may locally be ahead of server state.
- Likely cause: no revision compare or conflict-resolution model.
- Relevant file/function: `shared/store.js`, `storageSetRaw`
- Affects data integrity: Yes, possible stale or conflicting writes between devices.

### NOT IMPLEMENTED

- Sign-up flow
- Password reset / account recovery
- Quote on dashboard
- Streak system
- Weather integration
- Quick Add
- Focus timer
- Dedicated focus session records beyond goal log sessions
- Profile page and settings management beyond theme
- Account settings
- Avatar/profile image support
- Generic notifications system
- Lists → Finance linkage
- Goals → Focus linkage
- Calendar recurring task model
- Deposit model for tutoring
- Goal-to-calendar automation
- Cross-user admin features
- Team or multi-user role system
- Structural validation library or schema enforcement

---

## 3. DATA / FIREBASE AUDIT

### Storage keys

The project uses several persisted keys. These are the actual keys found in code:

| Key | Purpose | Data structure | Read location | Write location |
|---|---|---|---|---|
| calendar-events-v1 | Weekly calendar events and recurring events | Array of event objects | `lich-tuan.html` `loadEvents()` | `lich-tuan.html` `persist()` |
| todo-matrix-v1 | Eisenhower task matrix data | `{ general: {...}, byDate: {...} }` | `lich-tuan.html` `loadTodos()` | `lich-tuan.html` `persistTodos()` |
| finance-data-v2 | Finance ledger and category config | `{ transactions, wishlist, categories, categoryBudgets, planPeriodStart }` | `chi-tieu.html` `loadData()` | `chi-tieu.html` `persist()` |
| muc_tieu_hoc_tap_goals_v1 | Goals, milestones, session logs | Array of goal objects | `muc-tieu.html` `loadGoals()` | `muc-tieu.html` `persist()` |
| gia-su-data-v1 | Tutoring apps + class records | `{ teach, cyber, classes }` | `gia-su.html` `loadData()` | `gia-su.html` `persist()` |
| lists-v1 | List items for movies/places/restaurants | Array of list item objects | `shared/store.js` `getListItems()` | `shared/store.js` `addListItem()`, `updateListItem()`, `deleteListItem()` |
| gpx-theme | Theme preference | String (`light` or `dark`) | `shared/app-shell.js` `savedTheme` | `shared/app-shell.js` `toggleTheme()` |

### Firestore structure

The Firestore hierarchy is explicitly implemented in `shared/store.js`:

```text
users/{uid}/kv/{key}
```

The relevant code is:

```js
return db.collection('users').doc(uid).collection('kv').doc(key);
```

This means data is scoped to the authenticated user's UID; there is no shared global collection for app data. The central write/read layer is `Store.storageGetRaw()` and `Store.storageSetRaw()`.

### Authentication → data relationship

The actual flow is:

1. `shared/firebase-config.js` initializes Firebase and assigns globals:
   - `window.gpxAuth = firebase.auth()`
   - `window.gpxDb = firebase.firestore()`
2. `shared/app-shell.js` calls `wireFirebase()` on DOM ready.
3. `window.gpxAuth.onAuthStateChanged(user => { ... })` runs.
4. If a user exists:
   - `window.Store.init(window.gpxDb, user.uid)` is called
   - the auth gate is hidden
   - the page emits `gpx-ready`
5. If no user exists:
   - `window.Store.reset()` is called
   - the auth gate is shown
6. Each read/write path through `Store` uses `uid` and `scopedKey()`.

This means the app identifies the user via Firebase Auth user UID, not through a custom app user model.

### LocalStorage

Relevant localStorage behavior from `shared/store.js`:

- `scopedKey(key)` returns `uid ? 'gpx:${uid}:${key}' : key`
- `readLocalValue` checks `localStorage.getItem(namespaced)` first
- if not found and a legacy unscoped key exists and `uid` is set, it moves that value into the namespaced key and removes the legacy key
- `writeLocalValue` writes to namespaced storage and removes legacy key if UID exists

This is a local-first sync model with UID-aware cache isolation.

### Sync architecture

This is the actual architecture:

- Local-first write: `storageSetRaw` writes to localStorage immediately.
- Async Firestore sync: It then calls `ref.set({ value, updatedAt: Date.now() })` in the background.
- Read precedence: `storageGetRaw` tries Firestore first when `db && uid` are available, then falls back to localStorage.
- Offline behavior: If Firestore write fails, the app logs a warning and shows a toast, but the local cache remains intact.
- Error handling: `storageGetRaw` catches Firestore read problems and falls back to localStorage.

Possible race conditions and data-loss scenarios:
- If two devices edit the same key at the same time, last-write-wins behavior is possible because there is no optimistic versioning or conflict merge.
- If a user logs out and another user logs in on the same browser, the local cache is still namespaced by UID, which helps isolation, but stale old values remain in localStorage under the old UID namespace.
- If localStorage is cleared while Firestore is stale or unavailable, data can be lost unless user has a backup.
- No rollback or revision history exists.

---

## 4. ACTUAL JSON / DATA SCHEMAS

### 4.1 calendar-events-v1

Actual structure: `Array<Event>`

```json
[
  {
    "id": "ev_...",
    "title": "Event title",
    "date": "2026-09-01",
    "start": "09:00",
    "end": "10:00",
    "location": "Optional location",
    "color": "#3B82F6",
    "recurring": false,
    "dow": 1,
    "recurStart": "2026-09-01",
    "recurEnd": "2026-12-31"
  }
]
```

Observed fields:
- `id`: string, required by app logic
- `title`: string
- `date`: string in `YYYY-MM-DD`
- `start`: string `HH:mm`
- `end`: string `HH:mm`
- `location`: string (optional)
- `color`: string (hex)
- `recurring`: boolean (optional; default treated as false)
- `dow`: number 0..6 (optional, used for recurring events)
- `recurStart`: string `YYYY-MM-DD` (optional)
- `recurEnd`: string `YYYY-MM-DD` (optional)

### 4.2 todo-matrix-v1

Actual structure:

```json
{
  "general": {
    "q1": [ { "id": "td_...", "text": "...", "done": false } ],
    "q2": [],
    "q3": [],
    "q4": []
  },
  "byDate": {
    "2026-09-01": {
      "q1": [],
      "q2": [],
      "q3": [],
      "q4": []
    }
  }
}
```

Observed fields:
- `general`: object keyed by q1..q4
- `byDate`: object keyed by date string
- each task item: `id`, `text`, `done`
- no explicit `priority` field; the quadrant acts as the priority descriptor

### 4.3 finance-data-v2

Actual structure:

```json
{
  "transactions": [
    {
      "id": "tx_...",
      "type": "income",
      "category": "luong_lam",
      "amount": 15000000,
      "date": "2026-09-01",
      "note": "salary"
    }
  ],
  "wishlist": [
    {
      "id": "w_...",
      "name": "Item",
      "price": 1500000,
      "priority": "vừa",
      "note": "Optional",
      "purchased": false
    }
  ],
  "categories": {
    "expense": [ { "key": "an_uong", "name": "Ăn uống", "icon": "🍜", "color": "#E8B94B" } ],
    "income": [ { "key": "luong_lam", "name": "Lương đi làm", "icon": "💼", "color": "#5E9A78" } ]
  },
  "categoryBudgets": {
    "an_uong": 5000000
  },
  "planPeriodStart": "2026-09-01"
}
```

Observed fields:
- `transactions[]` with `id`, `type`, `category`, `amount`, `date`, `note`
- `wishlist[]` with `id`, `name`, `price`, `priority`, `note`, `purchased`
- `categories.expense[]` and `categories.income[]` with `key`, `name`, `icon`, `color`
- `categoryBudgets`: object keyed by category key
- `planPeriodStart`: ISO date or null

Important difference: category keys are used as plain strings, not IDs with a consistent global namespace.

### 4.4 muc_tieu_hoc_tap_goals_v1

Actual structure: `Array<Goal>`

```json
[
  {
    "id": "g_...",
    "type": "certificate",
    "name": "IELTS 7.0",
    "startDate": "2026-08-01",
    "targetDate": "2026-12-31",
    "hoursTotal": 80,
    "hoursPerSession": 1.5,
    "note": "Improve speaking",
    "completed": false,
    "milestones": [
      { "id": "m_...", "title": "Finish speaking module", "due": "2026-10-15", "done": false }
    ],
    "sessions": [
      { "id": "s_...", "date": "2026-09-03", "hours": 1.5, "note": "Speaking practice" }
    ],
    "createdAt": 1725123456789
  }
]
```

Observed fields:
- `id`, `type`, `name`, `startDate`, `targetDate`, `hoursTotal`, `hoursPerSession`, `note`, `completed`, `milestones`, `sessions`, `createdAt`
- `milestones` are embedded objects rather than separate records
- `sessions` are embedded objects rather than database references

### 4.5 gia-su-data-v1

Actual structure:

```json
{
  "teach": [
    {
      "id": "app_...",
      "org": "ABC Center",
      "position": "Math Tutor",
      "date": "2026-08-20",
      "location": "District 1",
      "channel": "Email",
      "contact": "hr@abc.vn",
      "status": "Đang chờ phản hồi",
      "link": "https://...",
      "note": "Potential lead"
    }
  ],
  "cyber": [],
  "classes": [
    {
      "id": "cls_...",
      "name": "Math 9 - Exam prep",
      "subject": "Math",
      "schedule": "Tue-Thu-Sat 18:00-19:30",
      "manager": "Independent",
      "rate": 120000,
      "duration": 90,
      "status": "Đang dạy",
      "color": "#0EA69E",
      "students": [
        { "id": "st_...", "name": "Mai", "phone": "0901234567" }
      ],
      "sessions": [
        {
          "id": "ses_...",
          "date": "2026-09-03",
          "minutes": 90,
          "present": ["Mai"],
          "content": "Algebra revision",
          "note": "Good progress",
          "payment": "Chưa nhận"
        }
      ]
    }
  ]
}
```

Observed fields:
- `teach`, `cyber` arrays of applications
- `classes` array of class objects
- `students` are embedded objects; `sessions` are embedded; no separate relational tables

### 4.6 lists-v1

Actual structure: `Array<ListItem>`

```json
[
  {
    "id": "list_...",
    "type": "movie",
    "name": "Dune: Part Two",
    "status": "planned",
    "category": "sci-fi",
    "notes": "Continue after finishing part one",
    "link": "https://...",
    "current": 3,
    "total": 12,
    "progress": 25,
    "progressMode": "episode",
    "createdAt": 1725123456789,
    "updatedAt": 1725123456789
  }
]
```

Observed fields:
- `id`, `type`, `name`, `status`, `category`, `notes`, `link`, `current`, `total`, `progress`, `progressMode`, `createdAt`, `updatedAt`
- The app uses a mixed pattern of raw progress fields and stored progress percentage.
- This is a real place where canonical consistency is not strict.

### Differences between modules

Some modules embed related child objects; others use flat arrays. Examples:
- goals embed `milestones` and `sessions` directly
- tutoring classes embed `students` and `sessions` directly
- finance categories are separate arrays inside the finance blob
- list items are self-contained and independent

This is a key sign of schema drift and non-uniform model design.

---

## 5. ENUMS / STATUS VALUES

The project uses free-text and domain-specific status values. These are values actually used in code.

### Finance
- transaction `type` values:
  - `income`
  - `expense`
  - `save_in`
  - `save_out`
- used in: `chi-tieu.html`, `shared/store.js`

### Goals
- derived status values, not directly stored as canonical strings:
  - `ahead`
  - `ontrack`
  - `behind`
  - `overdue`
  - `done`
- used in: `muc-tieu.html` `computeStats()` and `statusLabel()`

### Tasks
- quadrant values:
  - `q1`
  - `q2`
  - `q3`
  - `q4`
- used in: `lich-tuan.html`

### Lists
- movie status values:
  - `planned`
  - `watched`
  - `favorite`
  - `dropped`
- place status values:
  - `wish`
  - `visited`
  - `favorite`
- restaurant status values:
  - `want`
  - `tried`
  - `favorite`
- used in: `danh-sach.html`

### Tutoring
- application status values (Vietnamese strings):
  - `Chưa liên hệ`
  - `Đang chờ phản hồi`
  - `Đã phản hồi - hẹn phỏng vấn`
  - `Đậu - đã dạy thử`
  - `Đậu - nhận lớp`
  - `Rớt`
- class status values:
  - `Đang dạy`
  - `Tạm nghỉ`
  - `Đã kết thúc`
- payment status values:
  - `Chưa nhận`
  - `Đã nhận`
- used in: `gia-su.html`

### Calendar
- recurring event logic uses `dow` integer 0..6
- not stored as a textual enum; it is numeric

### Important note
The app currently mixes UI labels and internal values. It is not a normalized enum system and does not separate internal values from display labels.

---

## 6. ID / DATE / TIMESTAMP CONVENTIONS

### IDs

How IDs are generated from code:

- `shared/store.js`:
  - `makeId(prefix)` uses `Date.now().toString(36) + Math.random().toString(36).slice(2, 10)`
  - returns `${prefix}-${random}` when prefix is passed
- `gia-su.html`: `uid(prefix)` uses `prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,7)`
- `muc-tieu.html`: IDs are created like `g_` + timestamp + random suffix
- `lich-tuan.html`: event IDs are generated as a mix of prefix and random suffix; task IDs are `td_...`
- `chi-tieu.html`: transaction IDs and wishlist IDs use `tx_...`, `w_...` patterns

Observed pattern:
- IDs are usually prefixed with a domain code: `tx`, `w`, `g`, `s`, `cls`, `st`, `ev`, `td`, `app`, `list`
- The strategy is client-generated uniqueness, not server-generated IDs.
- These are not globally unique across all users, but the UID scoping prevents collisions for stored keys.

### Dates

Date format in persisted data: `YYYY-MM-DD`

Examples:
- `const iso = `${y}-${m}-${d}``
- `parseDateInput(str)` in `muc-tieu.html` expects `YYYY-MM-DD`
- `todayISO()` generates `YYYY-MM-DD`

Timezone assumptions:
- Dates are generally parsed using local Date objects with local timezone semantics.
- There is no explicit UTC normalization for persisted date strings.

Recurring event logic in `lich-tuan.html`:
- event `dow` is compared against `Date.getDay()`
- `recurStart` and `recurEnd` compare against ISO date strings and local date objects

### Timestamps

Used in paths like:
- `createdAt: Date.now()`
- `updatedAt: Date.now()`
- `updatedAt` stored in Firestore doc payload as `Date.now()`
- `shared/store.js` uses `updatedAt: Date.now()` in document writes

This is client timestamp usage, not server timestamp usage.

---

## 7. CROSS-MODULE CONNECTIONS

### EXISTING REAL CONNECTIONS

#### Dashboard ↔ Tasks
- `index.html` loads `todo-matrix-v1` and renders a focus list in `renderFocusFromTasks()`.
- `toggleTask()` reads the same `todo-matrix-v1` data, flips `done`, and writes it back.
- This is an actual connection.

#### Dashboard ↔ Goals
- `index.html` loads `muc_tieu_hoc_tap_goals_v1` and uses `DashboardData.buildSnapshot()` to create goal summary values.
- Countdown and goal snapshot are displayed from the loaded goal list.
- This is an actual connection.

#### Dashboard ↔ Finance
- `index.html` loads `finance-data-v2` and renders month income/expense values.
- `renderExpenseSummary()` reads the same finance blob and summarizes the current month.
- This is an actual connection.

#### Dashboard ↔ Calendar
- `index.html` loads `calendar-events-v1` and calls `renderCalendarSummary()`.
- This is an actual connection.

#### Goals ↔ Sessions
- `muc-tieu.html` stores `sessions` as an embedded array within each goal.
- `computeStats()` counts and aggregates those sessions for progress and weekly pace.
- This is an actual connection.

#### Lists ↔ Finance
- No strict implementation exists in the current code.
- `danh-sach.html` has no financial linkage to `finance-data-v2`.
- There is no persisted reference from a list item to a finance record.

#### Goals ↔ Focus
- No dedicated focus timer or focus-session records exist.
- Goal session logs look similar to focus logs, but they are not a separate feature or shared model.

#### Calendar ↔ Tasks
- The same page (`lich-tuan.html`) contains both event logic and task logic, but they are stored in separate keys: `calendar-events-v1` and `todo-matrix-v1`.
- There is no shared relation object tying events and tasks together.

#### Tutoring ↔ Finance
- The app computes payment totals and outstanding amount inside `gia-su.html`, but it does not write those values into the `finance-data-v2` data model.
- This is a local calculation, not a relational connection.

### CONNECTIONS THAT DO NOT EXIST

- Lists → Finance
- Goals → Focus
- Goals → Calendar (other than UI display)
- Dashboard → real centralized shared domain service
- Finance categories → global registry across modules
- Cross-page references via stable IDs beyond in-memory local data
- Notification system tied to real event triggers

---

## 8. USER FLOW

### 1. First visit
- A page loads.
- `shared/app-shell.js` injects auth gate and nav.
- Theme is loaded from `localStorage.getItem('gpx-theme')` and applied before rendering.

### 2. Authentication
- The auth gate displays email + password inputs.
- User enters credentials and calls `window.gpxAuth.signInWithEmailAndPassword()`.
- If sign-in fails, an error text is displayed.

### 3. Login
- On successful auth, `onAuthStateChanged` triggers.
- `Store.init(window.gpxDb, user.uid)` executes.
- The gate hides, the page emits `gpx-ready`, and the module scripts load data.

### 4. Dashboard loading
- `index.html` loads several data blobs asynchronously via `loadJson()`.
- Each blob is retrieved from `Store.storageGetRaw(key)`.
- Summary functions render dashboard widgets.

### 5. Creating data
- Each page has a local create flow in its page script.
- Data writes are usually `storageSetRaw(key, JSON.stringify(data))` or `Store.addListItem()`.
- Writes are immediate local writes and then asynchronous Firestore sync.

### 6. Editing data
- Each page supports editing within the same form or modal pattern.
- For finance and goals, editing is done in the page script by updating the relevant object and re-rendering.

### 7. Deleting data
- Delete flows exist in most modules, often via a confirmation prompt and direct array filtering.
- The deletion is local and then written back through `storageSetRaw()`.

### 8. Navigation
- Shared app shell injects navigation links and a theme toggle.
- Pages are static HTML pages, not a SPA router.

### 9. Refresh
- On refresh, the page is reloaded and fetches data again from `Store.storageGetRaw()`.
- Firestore is read first when available; localStorage is used as fallback.
- If the auth session is valid, app state is restored.

### 10. Offline / Firestore failure
- `storageSetRaw` writes to localStorage and then attempts Firestore.
- If Firestore fails, code logs warnings and shows a toast.
- App remains usable from local cache.

### 11. Logout
- The app shell shows sign-out confirmation and calls `window.gpxAuth.signOut()`.
- `onAuthStateChanged` receives a null user and resets the Store.
- Auth gate is re-shown.

### 12. Login again
- Auth state rehydrates data from Firestore if available.
- Page re-renders and continues.

### Notable inconsistency
- UI provides login but no sign-up and no reset flow.
- The app assumes the developer or user already created the Firebase user manually outside the app.

---

## 9. MULTI-USER ARCHITECTURE

### Does the current architecture safely support multiple users?

#### User A data isolation
- Yes, based on `gpx:{uid}:{key}` and `users/{uid}/kv/{key}`.
- This is the main strong point of the current implementation.

#### User B data isolation
- Yes, the same architecture prevents cross-UID reads as long as security rules are enforced.

#### Login as A → logout → login as B
- The code does support re-binding the Store to a new user via `Store.init(window.gpxDb, user.uid)`.
- UI is reset on auth change.
- Local storage remains namespaced by UID, which is a good isolation pattern.

#### Multiple browser tabs
- Each tab shares the same browser localStorage, but the app does not implement a cross-tab synchronization notice or conflict resolution.
- This means multiple tabs may race on the same localStorage document and last-write-wins may occur.

#### Multiple devices
- Firestore sync is designed to support it, provided the user signs into the same Firebase project and Firestore rules allow the user access.
- This is the intended architecture.

#### Concurrent edits
- Not safely solved; no revision counters or optimistic locking exist.

#### Cache isolation
- Good by UID namespacing.

#### Stale localStorage
- Possible if a user has old plain keys or stale values in another context.
- `readLocalValue` attempts a one-time migration from legacy plain keys.

#### Cross-user data leakage risks
- Minimal if Firestore rules are strict and users only access their own UID.
- The project README explicitly requires a Firestore rule:
  - `match /users/{uid}/kv/{docId} { allow read, write: if request.auth != null && request.auth.uid == uid; }`
- This rule is a strong design signal, but it is only enforced server-side; client-side code is not a security barrier.

---

## 10. MOBILE / RESPONSIVE

### Observed implementation
- `shared/app-shell.js` injects a top nav and a bottom nav.
- The app includes mobile and desktop navigation patterns.
- Theme button and sign-out button are duplicated for mobile/desktop.

### Actual issues observed
- The project is a static HTML/CSS app and the mobile experience is basic rather than fully responsive per component.
- Some pages appear to render layout-heavy card grids and forms with fixed widths or tightly coupled CSS.
- Calendar and finance pages are complex and may become dense on small screens, but no direct mobile-specific structure is enforced beyond CSS.
- Modals are likely workable but not formally validated as mobile-first or touch-optimized.
- Complex tables and large forms may not scale well on small devices.

### What can be said with evidence
- Responsive navigation exists.
- Mobile bottom nav exists.
- No explicit mobile testing artifacts are present in the workspace.
- No mobile-specific data-layer issues were found beyond general responsive usability concerns.

---

## 11. ARCHITECTURE AUDIT

### Project structure
- HTML pages are top-level modules:
  - `index.html`
  - `lich-tuan.html`
  - `chi-tieu.html`
  - `gia-su.html`
  - `muc-tieu.html`
  - `danh-sach.html`
- Shared assets:
  - `shared/app-shell.js`
  - `shared/store.js`
  - `shared/firebase-config.js`
  - `shared/dashboard-data.js`
  - `shared/style.css`

### Architectural strengths
- Clear separation of shared auth and persistence concerns.
- A shared Store abstraction centralizes Firestore + localStorage logic.
- User scoping by UID is implemented in the data layer.
- Local-first write pattern is resilient and pragmatic for a personal app.
- App shell injection reduces duplication of nav and theme logic.

### Architectural weaknesses
- The app is a collection of independent page scripts, not a unified application architecture.
- Business logic is embedded directly in page-specific HTML/JS code.
- There are multiple duplicated patterns for load/save logic across files.
- There is no single domain model or validation layer.
- Direct DOM manipulation is heavy and page-specific.
- Global variables are used (`window.gpxAuth`, `window.gpxDb`, `window.Store`, `window.Lists`)
- There is no component or module system beyond raw scripts.
- There are multiple local data contracts using different shapes for similar concepts.

### Dependency structure
- Firebase Auth and Firestore are global dependencies.
- Every page includes the Firebase scripts and `shared/firebase-config.js`.
- Shared persistence is centralized in `shared/store.js`.
- Data utilities are partly embedded into page JS rather than fully shared.

---

## 12. DATA MODEL RISKS

The risks below are supported by actual code and not speculative product assumptions.

1. Schema drift across modules
   - Different modules store similar concepts with different field names and nesting patterns.
   - Example: goals embed sessions; classes embed students/sessions; list items are separate arrays.

2. Status string drift
   - Many statuses are free-text Vietnamese values rather than normalized internal values.
   - This raises filtering, validation, and internationalization risk.

3. Missing validation layer
   - There is no consistent validation or sanitization layer before writing to localStorage or Firestore.

4. Local-first + async sync race conditions
   - `storageSetRaw` writes to localStorage immediately and then Firestore asynchronously.
   - There is no conflict resolution or version check.

5. Derived-data duplication
   - Some values like `progress` in list items are both persisted and derived.
   - This creates drift risk.

6. User-scoped but not globally versioned
   - Keys are namespaced, but the format is not uniformly versioned beyond a few key names.

7. Incomplete cross-module relationship strategy
   - Modules are independent; there is no canonical relationship model.

8. Potential stale cache on device changes
   - localStorage is namespaced by UID, but stale or recycled values could persist if a user changes account or clears data.

9. UI code is acting as storage logic
   - Not all storage behavior is centralized; some page scripts are still mixing data and display concerns.

10. No server-side rejection path for invalid writes
   - Firestore rules protect access, but there is no validation before the app writes a bad object.

---

## 13. PERFORMANCE / UX AUDIT

### Observed behaviors from the code

- Multiple pages call `storageGetRaw` and `storageSetRaw` repeatedly per interaction, but these are small JSON blobs and likely acceptable for a personal app.
- `renderAll()`-style re-renders occur on many page actions; this is acceptable for small datasets but can become expensive if data grows.
- `shared/store.js` reads the whole key JSON before mutation and then writes the whole JSON back; this is not scalable for large arrays but is acceptable for small personal data.
- Some pages rebuild DOM elements from scratch after updates, which is typical for static JS apps but creates more reflow work.
- Event listeners are attached per row/item in several places; this is not necessarily wrong but may become noisy as data grows.
- The project has no loading skeletons or optimistic UI patterns, though it is still lightweight.

### Notable concerns
- Repeated UI rendering on each change can become slower as arrays grow.
- There is no pagination or lazy loading in the larger datasets.
- Large `transactions` arrays and class/session arrays could be expensive to re-render frequently.
- Some pages store large nested objects in a single document-like blob, which is easy for a small project but harder to evolve.

---

## 14. SECURITY AUDIT

### Basic findings

#### Firebase Auth
- Firebase Auth is used for user identity.
- Auth is handled in the client using `window.gpxAuth`.
- This is a normal browser-auth flow for Firebase.

#### Firestore access control
- The project README explicitly recommends Firestore rules:
  - `allow read, write: if request.auth != null && request.auth.uid == uid;`
- This is the essential security control.
- There is no separate server-side business logic layer; this is entirely client plus Firestore rules.

#### UID scoping
- The UID is used in both localStorage and Firestore paths.
- This is a good baseline for private data segregation.

#### Client-side trust assumptions
- The code assumes that the browser is the right place to trust the bound user identity.
- This is common for front-end Firebase apps, but it means security depends on Firestore rules.

#### Dangerous HTML injection
- Several functions use `innerHTML` heavily and insert values from user data.
- This is a real risk if malicious strings are stored and later rendered unsafely.
- Examples include dynamic HTML generation in `chi-tieu.html`, `muc-tieu.html`, `gia-su.html`, and `danh-sach.html`.
- There is some `escapeHtml()` usage, but it is not consistently applied everywhere.

#### Exposed configuration
- Firebase config is exposed in the browser as part of the Firebase web SDK pattern.
- This is normal for web Firebase apps, but the real protection is Firestore rules.

#### Sensitive data storage
- Data is stored in browser localStorage and Firestore; this includes personal finance and tutoring records.
- localStorage is not encrypted and should be treated as having device-local exposure.

#### Severity summary
- Moderate: client-side HTML injection risk from user-supplied data rendered with `innerHTML`
- Moderate: data exposure risk from localStorage and browser-side data persistence
- High if Firestore rules are misconfigured, because the app uses private data with UID scoping

---

## 15. FINAL ARCHITECTURAL VERDICT

### Current Architecture

The app is a user-scoped personal life dashboard built as a set of static HTML pages, each with page-local JavaScript and shared Firebase + localStorage persistence. The app is not a framework-based SPA. It uses:

- Firebase Auth for authentication
- Firestore for user-scoped sync
- localStorage as fast cache and offline fallback
- page-specific state management and direct DOM rendering
- multiple independent JSON blobs per module

### What Is Already Good

- Strong UID scoping by Firebase user
- Shared Store abstraction for persistence
- Local-first caching avoids losing data on offline writes
- The app already supports multi-device sync for the same authenticated user
- No global destructive data model or single monolithic state object exists
- The app is straightforward to reason about for a small personal system

### Biggest Problems

1. No canonical domain model across all modules
2. Heavy schema drift across similar concepts
3. Status values stored as free-text strings instead of internal enums
4. No centralized validation before persistence
5. Async Firestore sync without revision or conflict handling
6. High coupling between UI and data logic
7. Page-local scripts instead of shared service layer
8. Derived data is partly persisted and partly computed, creating inconsistency
9. No sign-up or password-recovery flow
10. No robust focus timer or cross-module reference model

### What Should NOT Be Rebuilt

- The existing Firebase Auth + Firestore + localStorage architecture should be preserved.
- The user-scoped Store pattern is a strong foundation.
- The app shell’s auth-gate and nav injection are useful and should remain.
- The local-first cache design is valuable and should stay.
- Module-specific data blobs should not be discarded outright; they should be normalized progressively.

### What Should Be Stabilized First

1. Standardize the canonical root contract for each persisted blob.
2. Introduce light validation and schema normalization at Store boundaries.
3. Define internal enum values and separate them from UI labels.
4. Add explicit versioning for each storage key.
5. Stabilize read/write compatibility with legacy values.
6. Add robust conflict handling for multi-device edits.
7. Move duplicated business logic from pages into shared services.
8. Establish a simple cross-module reference strategy.
9. Add sign-up and recovery flows only after the persistence contract is stabilized.
10. Then add new features like focus timer, weather, notifications, and profile.

### Future Scalability

The current architecture can scale modestly if:
- each module remains user-scoped
- keys are versioned and normalized
- business logic is moved into shared services
- validation is added
- cross-module references stay lightweight and ID-based

The parts that would eventually need to evolve are:
- direct page-based data logic
- free-text status handling
- conflict-unsafe multi-device writes
- large nested blobs managed per page
- UI-driven derived calculations

Incremental evolution is possible without a full rewrite. The real need is standardization, not a total rebuild.

---

## Final verdict

This is a working personal-life productivity app with a good user-scoping model and a pragmatic local-first sync layer, but it is not yet a robust canonical data architecture. The app should be stabilized incrementally rather than rebuilt from scratch. The core persistence model is sound for a small multi-user system, but it needs explicit versioning, validation, enum normalization, and a clearer service boundary before major new features are added.

---

## Verification statement

This audit was produced from the current workspace code and not from product assumptions. Where the workspace did not provide enough evidence, the report states that the feature could not be verified from the current workspace.
