# CURRENT STATE AUDIT

Date: 2026-08-31

This audit reflects the code as it exists in the current workspace only. No code was changed, refactored, or implemented during this review.

---

## 1. CURRENT FEATURES

Legend:
- 🟢 WORKING = implemented and appears functional
- 🟡 PARTIAL = some code/UI exists but incomplete or only partially connected
- 🔴 NOT IMPLEMENTED = feature does not exist
- ⚠️ BROKEN = feature exists but currently has a bug/error

| Area | Feature | Status | Actually works? | Where implemented | Notes |
|---|---|---:|---|---|---|
| Authentication | Login | 🟢 WORKING | Yes | `shared/app-shell.js` | Email/password login via Firebase Auth; gate is shown before access. |
| Authentication | Logout | 🟢 WORKING | Yes | `shared/app-shell.js` | Sign-out button calls `window.gpxAuth.signOut()`. |
| Authentication | User session persistence | 🟢 WORKING | Yes | `shared/app-shell.js`, `shared/store.js` | Auth state listener keeps session state and reinitializes Store on login. |
| Authentication | User UID | 🟢 WORKING | Yes | `shared/app-shell.js`, `shared/store.js` | Store stores `uid` and uses it to namespace all private data. |
| Authentication | User data isolation | 🟢 WORKING | Yes | `shared/store.js` | `scopedKey()` and Firestore path use `users/{uid}/kv`. |
| Dashboard | Greeting | 🟢 WORKING | Yes | `index.html` | Reads `window.gpxAuth.currentUser` and renders name. |
| Dashboard | Avatar | 🟢 WORKING | Yes | `index.html` | Uses initials from user name. |
| Dashboard | Quote | 🟡 PARTIAL | Partially | `index.html` | Static quote card exists but is hardcoded text, not dynamic data. |
| Dashboard | Today's date | 🟢 WORKING | Yes | `index.html` | Uses `todayDate()` and `toLocaleDateString('vi-VN')`. |
| Dashboard | Today's tasks | 🟢 WORKING | Yes | `index.html`, `shared/dashboard-data.js` | Reads `todo-matrix-v1` and displays tasks list. |
| Dashboard | Daily progress | 🟢 WORKING | Yes | `index.html`, `shared/dashboard-data.js` | Goal progress meter rendered from `goalSnapshot` and progress. |
| Dashboard | Streak | 🔴 NOT IMPLEMENTED | No | None | No streak logic found in code. |
| Dashboard | Countdown | 🟢 WORKING | Yes | `index.html` | `getNextGoalDelta()` and `updateCountdownUI()` compute nearest due date. |
| Dashboard | Weather | 🔴 NOT IMPLEMENTED | No | `index.html` | Weather card is static placeholder markup, no real API or data. |
| Dashboard | Smart summary | 🟡 PARTIAL | Partially | `index.html`, `shared/dashboard-data.js` | Summary cards are aggregated, but not a true AI or smart summary engine. |
| Dashboard | Goal snapshot | 🟢 WORKING | Yes | `index.html`, `shared/dashboard-data.js` | `goalSnapshot` derived from goals data. |
| Dashboard | Finance snapshot | 🟢 WORKING | Yes | `index.html`, `shared/dashboard-data.js` | Reads finance transactions and renders month totals. |
| Dashboard | Quick Add | 🔴 NOT IMPLEMENTED | No | None | No dashboard quick-add flow for tasks/goals/finance exists. |
| Calendar / Tasks | Calendar | 🟢 WORKING | Yes | `lich-tuan.html` | Weekly grid with event blocks and date navigation. |
| Calendar / Tasks | Weekly planner | 🟢 WORKING | Yes | `lich-tuan.html` | Weekly planner with current week, mini calendar, event rendering. |
| Calendar / Tasks | Tasks | 🟢 WORKING | Yes | `lich-tuan.html` | Eisenhower-style `todo-matrix-v1` with q1-q4 buckets. |
| Calendar / Tasks | Task completion | 🟢 WORKING | Yes | `lich-tuan.html` | Checkbox toggles item status and persists. |
| Calendar / Tasks | Recurring tasks | 🔴 NOT IMPLEMENTED | No | None | No recurring task feature; recurring support exists only for events. |
| Calendar / Tasks | Events | 🟢 WORKING | Yes | `lich-tuan.html` | Create/edit/delete events and recurring weekly events. |
| Calendar / Tasks | Any existing functionality | 🟢 WORKING | Yes | `lich-tuan.html` | Includes calendar, event modal, today list, mini calendar, week navigation. |
| Finance | Add income | 🟢 WORKING | Yes | `chi-tieu.html` | Transaction modal supports `income` type. |
| Finance | Add expense | 🟢 WORKING | Yes | `chi-tieu.html` | Transaction modal supports `expense` type. |
| Finance | Edit transaction | 🟢 WORKING | Yes | `chi-tieu.html` | `openTxModal()` fills form and saves update. |
| Finance | Delete transaction | 🟢 WORKING | Yes | `chi-tieu.html` | Delete button in modal. |
| Finance | Categories | 🟢 WORKING | Yes | `chi-tieu.html` | Default categories plus add/remove category support. |
| Finance | Budget | 🟢 WORKING | Yes | `chi-tieu.html` | Category budget settings with threshold alerts. |
| Finance | Daily limit | 🟡 PARTIAL | Partially | `chi-tieu.html` | There is a daily food budget suggestion, not a general daily-limit system. |
| Finance | Reports | 🟢 WORKING | Yes | `chi-tieu.html` | Report tab with month overview, budget tables, daily breakdowns. |
| Finance | Charts | 🟢 WORKING | Yes | `chi-tieu.html` | Donut chart for expense distribution. |
| Finance | Wishlist | 🟢 WORKING | Yes | `chi-tieu.html` | Wishlist tab and modal for add/edit/remove. |
| Finance | Savings functionality | 🟢 WORKING | Yes | `chi-tieu.html` | Save in/out flows and savings total are implemented. |
| Goals | Create goal | 🟢 WORKING | Yes | `muc-tieu.html` | Goal modal and save button. |
| Goals | Edit goal | 🟢 WORKING | Yes | `muc-tieu.html` | Edit flow with modal prefill. |
| Goals | Delete goal | 🟢 WORKING | Yes | `muc-tieu.html` | Delete confirmation. |
| Goals | Progress | 🟢 WORKING | Yes | `muc-tieu.html` | Progress bars computed from sessions and hours. |
| Goals | Milestones | 🟢 WORKING | Yes | `muc-tieu.html` | Add/toggle/delete milestone rows. |
| Goals | Target date | 🟢 WORKING | Yes | `muc-tieu.html` | Goal target date is required and used for countdown logic. |
| Goals | Focus/session integration | 🟢 WORKING | Yes | `muc-tieu.html` | Goal session logging and session history exists. |
| Goals | Dashboard integration | 🟢 WORKING | Yes | `index.html`, `shared/dashboard-data.js`, `muc-tieu.html` | Dashboard reads goals for countdown + progress. |
| Lists | Movies | 🟢 WORKING | Yes | `danh-sach.html` | Tab and item type `movie`. |
| Lists | Movie status | 🟢 WORKING | Yes | `danh-sach.html` | Status values include planned, watched, favorite, dropped. |
| Lists | Current episode | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | `current` field is persisted and rendered. |
| Lists | Total episodes | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | `total` field is persisted and clamped. |
| Lists | Percentage progress | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | Progress is computed from current/total. |
| Lists | +1 episode | 🟢 WORKING | Yes | `danh-sach.html`, `shared/store.js` | `incrementProgress(itemId, 1)` updates value immediately. |
| Lists | Places | 🟢 WORKING | Yes | `danh-sach.html` | Place item type exists. |
| Lists | Restaurants/cafes | 🟢 WORKING | Yes | `danh-sach.html` | Restaurant item type exists. |
| Lists | Links | 🟢 WORKING | Yes | `danh-sach.html` | Link field and external link button. |
| Lists | Visited status | 🟢 WORKING | Yes | `danh-sach.html` | Status options include visited/tried/favorite. |
| Lists | Add to finance | 🔴 NOT IMPLEMENTED | No | None | No list item automatically creates a finance transaction. |
| Lists | Any other list functionality | 🟢 WORKING | Yes | `danh-sach.html` | Notes, category, edit/delete, status badges, metadata. |
| Focus | Timer | 🔴 NOT IMPLEMENTED | No | None | No actual timer app or countdown-focused session module exists. |
| Focus | Focus session | 🟡 PARTIAL | Partially | `muc-tieu.html` | Goal session logging is implemented, but it is not a general-purpose focus timer. |
| Focus | Goal integration | 🟢 WORKING | Yes | `muc-tieu.html` | Goal sessions update goal progress. |
| Focus | History | 🟢 WORKING | Yes | `muc-tieu.html` | Session list/history is rendered per goal. |
| Tutoring | Classes | 🟢 WORKING | Yes | `gia-su.html` | Class cards and class detail tabs. |
| Tutoring | Schedule | 🟢 WORKING | Yes | `gia-su.html` | Session rows and dates show schedule details. |
| Tutoring | Income | 🟢 WORKING | Yes | `gia-su.html` | Summary includes income and unpaid sessions. |
| Tutoring | Deposit | 🟡 PARTIAL | Partially | `gia-su.html` | Payment status exists, but no dedicated deposit workflow or account ledger is implemented in this module. |
| Tutoring | Any existing functionality | 🟢 WORKING | Yes | `gia-su.html` | Applications, classes, sessions, summary views, status controls. |
| Settings | Profile | 🔴 NOT IMPLEMENTED | No | None | No editable profile page or profile data model exists. |
| Settings | Avatar | 🟡 PARTIAL | Partially | `index.html`, `shared/app-shell.js` | User avatar initials are displayed; no user-editable avatar upload/profile image feature. |
| Settings | Preferences | 🟡 PARTIAL | Partially | `shared/app-shell.js`, `index.html` | Theme preference is persisted; no broad settings/preferences panel exists. |
| Settings | Theme | 🟢 WORKING | Yes | `shared/app-shell.js` | Theme saved to `localStorage['gpx-theme']`. |
| Settings | Any existing settings | 🟢 WORKING | Yes | `chi-tieu.html` | Finance settings for budgets/categories and backup/reset exist. |

---

## 2. IMPORTANT: DISTINGUISH THESE STATES

### 🟡 PARTIAL NOTES

- Quote: static hardcoded quote only; no dynamic quote source or personalization.
- Smart summary: aggregated metrics exist, but this is not a real intelligence layer.
- Daily limit: only a food-budget recommendation exists for the current month; no generic per-day limit enforcement engine.
- Focus session: there is goal-based session logging, but no real focus timer/work session product.
- Avatar: initials only; no custom avatar management.
- Preferences: theme is persisted, but there is no general preference/settings screen outside finance budgets and a theme toggle.
- Deposit: tutoring has payment status, not a deposit system.

### ⚠️ BROKEN NOTES

No confirmed feature in the current code was found to be clearly broken by code-level logic alone. The code generally appears to function as designed, but several features are placeholder-only or only partially connected rather than "broken."

### 🔴 NOT IMPLEMENTED NOTES

- Streak
- Weather
- Quick Add
- Recurring tasks
- Add to finance from Lists
- Focus timer
- Profile settings page
- Sign-up / create account flow

---

## 3. DATA / FIREBASE AUDIT

### What data is stored in Firestore?

From `shared/store.js`, Firestore is used for a single scalable pattern:

- `users/{uid}/kv/{key}`

The code specifically reads/writes keys such as:

- `lists-v1`
- `calendar-events-v1`
- `todo-matrix-v1`
- `finance-data-v2`
- `gia-su-data-v1`
- `muc_tieu_hoc_tap_goals_v1`

These are stored under each authenticated user's UID path, not globally.

### What data is stored in localStorage/cache?

The system also uses localStorage as the immediate cache/fallback layer:

- `gpx-theme` for UI theme
- namespaced keys of the form `gpx:{uid}:{key}`
- legacy fallback keys without UID when needed

Example logic from `shared/store.js`:

- `readLocalValue(key)`
- `writeLocalValue(key, value)`
- `storageGetRaw(key)`
- `storageSetRaw(key, value)`

This means the app supports fast local reads and then Firestore sync in the background.

### What data is only UI state?

These are not persisted as app-wide data models:

- modal open/close state
- selected color for event swatches
- `pendingType` in finance and goals
- `currentTab` in goals
- `expandedMilestones` and `expandedSessions`
- static dashboard quote text
- static weather card values
- `miniMonth`, `currentWeekStart` display state
- local DOM-only toggles such as active tab classes

### Which collections/subcollections exist?

From current code, the Firestore model is:

- `users`
  - subcollection `kv`
    - document per storage key

No other Firestore collections/subcollections were found in the current codebase.

### How are documents associated with a user?

Association is done by authenticated Firebase UID:

- `window.gpxAuth.onAuthStateChanged(user => { ... })`
- `window.Store.init(window.gpxDb, user.uid)`
- Firestore path becomes `db.collection('users').doc(uid).collection('kv').doc(key)`
- localStorage keys also become namespaced under `gpx:{uid}:{key}`

### Does every private document use Firebase Auth UID?

For real data stored via Store: yes, all private data keys are tied to the UID path and to namespaced localStorage keys.

Important caveat:

- some app state is still page-local and not namespaced per user
- static UI placeholders are not user data at all
- legacy localStorage keys may exist without UID until migrated

### Which parts still directly access Firebase from UI?

Direct UI code does not directly call Firestore in the page scripts.

The true pattern is:

- `shared/firebase-config.js` initializes global `window.gpxAuth` and `window.gpxDb`
- `shared/app-shell.js` listens to auth state
- `shared/store.js` centralizes Firestore reads/writes and local cache fallback

So the UI pages mainly call `window.Store.*` instead of hitting Firestore own code.

### Which parts use Store/services?

Confirmed service-backed flows:

- Dashboard: `window.Store.storageGetRaw()`
- Calendar: `storageGetRaw('calendar-events-v1')`; `storageSetRaw()`
- Tasks: `storageGetRaw('todo-matrix-v1')`; `storageSetRaw()`
- Goals: `storageGet('muc_tieu_hoc_tap_goals_v1')`
- Finance: `window.Store.storageGetRaw(STORAGE_KEY)`
- Lists: `window.Store.getListItems()`, `addListItem()`, `updateListItem()`, `deleteListItem()`
- Tutoring: uses the same Store-backed pattern with `storageGetRaw()/storageSetRaw()`

So the core data layer is service-based and centralized through Store.

---

## 4. CROSS-MODULE CONNECTIONS

### Existing actual connections

```text
App Shell
↓ initializes / watches
Firebase Auth + Store

Store
↓ reads/writes
calendar-events-v1
todo-matrix-v1
lists-v1
finance-data-v2
gia-su-data-v1
muc_tieu_hoc_tap_goals_v1

Dashboard
↓ reads
Tasks
Goals
Finance
Calendar

Goals
↓ logs session history
Goal progress / milestones

Lists
↓ uses
Store list CRUD + incrementProgress

Finance
↓ stores
Transactions, wishlist, budgets, category settings

Calendar
↓ stores
Events, recurring event definitions
```

### Connections that do not actually exist

- Dashboard → no real weather API
- Dashboard → no streak engine
- Lists → no automatic finance sync
- Focus timer → no actual timer module
- Goals → no direct link to a separate focus module
- Finance → no direct live link to Lists or Goals beyond separate stored data

---

## 5. USER FLOW

### Brand-new user flow: what works

1. Login
   - The app shows the auth gate before access.
   - User enters email/password.
   - Firebase Auth runs and then `window.gpxAuth.onAuthStateChanged` fires.
   - The app unlocks once the user is authenticated.

2. Dashboard
   - After auth, dashboard loads data from local cache / Firestore.
   - Greeting, avatar, date, tasks, goal progress, finance snapshot, and event summary render.

3. Add data
   - Finance: add income/expense/wishlist entries from the finance page.
   - Calendar: create/edit/delete events.
   - Goals: create/edit/delete goals and sessions.
   - Lists: add/edit/delete movies, places, restaurants/cafes.
   - Tasks: add/complete task items in the weekly planner page.

4. Navigate
   - App shell injects top and bottom nav.
   - Links move between pages and route to the module HTML pages.

5. Refresh page
   - If user is still logged in, auth state restores the session and Store rehydrates.
   - LocalStorage fallback allows data to load even before Firestore is available.

6. Logout
   - Sign-out button calls Firebase Auth sign-out.
   - Store resets on auth-state false.

7. Login again
   - After sign-out, the auth gate returns.
   - User can log in again with the same account.

### Where the flow breaks

- No sign-up flow exists.
- No account recovery flow exists.
- If Firebase config is missing or invalid, app shell fails silently or partially.
- If user is not signed in, the app blocks access and the page is gated.
- Some static dashboard widgets do not correspond to real live data (quote, weather, streak).
- The app is not a single SPA; page transitions are full-page navigations, so the UX is classic static-app navigation rather than dynamic route transitions.

---

## 6. MOBILE / RESPONSIVE

### Responsive layout

- 🟢 WORKING
- Several pages include media queries and grid layouts.
- Finance, goals, tutoring, lists, and app shell all have responsive CSS rules.

### Mobile navigation

- 🟢 WORKING
- `shared/app-shell.js` creates a bottom nav and mobile controls set.

### Bottom navigation

- 🟢 WORKING
- There is a bottom nav injected for mobile layouts.

### Touch-friendly controls

- 🟢 WORKING
- Buttons, cards, and modal controls are sized for tap targets and use large clickable areas.

### Mobile-specific layout

- 🟢 WORKING
- Multiple pages adjust grid layout for small screens via CSS media rules.

---

## 7. BIGGEST CURRENT PROBLEMS

1. Data contracts are fragmented across modules rather than one canonical model.
2. The app has several storage keys but no strict schema validation layer.
3. Firestore uses a single generic `users/{uid}/kv` bucket, which is flexible but not strongly typed or domain-aware.
4. Some dashboard widgets are static placeholders rather than real features (quote, weather, streak).
5. There is no account creation or recovery flow.
6. No true focus-timer product exists despite the dashboard naming and focus concept.
7. There is no universal profile/settings model beyond theme and finance budgets.
8. No real cross-module automation exists between Lists and Finance or Goals and Focus.
9. The app depends strongly on Firebase config and correct Auth state; if it is misconfigured, data access breaks.
10. The app is still a static multi-page architecture, which is workable but less coherent than a single app shell with structured state management.

---

## 8. WHAT SHOULD WE DO NEXT?

Based only on the current codebase, the next three tasks should be:

1. Stabilize data contracts and storage integrity
   - Audit each key and ensure the expected JSON schema is consistent.
   - Define a real canonical data shape per module before adding more features.

2. Fix and harden the authenticated data lifecycle
   - Validate Firestore rules and local fallback behavior.
   - Confirm the exact user-scoped data pattern works in logout/login refresh scenarios.

3. Clean up the product surface and remove placeholder features
   - Distinguish real implemented modules from mock/static UI.
   - Decide which features are truly in scope before building more cross-module capability.

These recommendations prioritize stability, data integrity, and product confidence before new feature work.

---

## Final verdict

The app is a real personal-life OS with working authentication, user-scoped storage, dashboard aggregation, finance, goals, calendar, lists, and tutoring modules. It is strongest where the data flow is tied to Store and UID-based persistence.

The main weakness is not "missing feature ideas" but the fact that some UI is still static or only partially connected, and the architecture is a set of loosely related pages rather than a unified product schema.

The current implementation is usable as a personal dashboard and management tool, but it is not yet a fully coherent product architecture for broader feature growth.
