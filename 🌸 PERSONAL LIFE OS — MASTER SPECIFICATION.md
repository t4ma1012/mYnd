# 🌸 PERSONAL LIFE OS — MASTER SPECIFICATION
## Product Vision · UX · Architecture · Data Model · Development Rules · Roadmap

---

# 0. PRODUCT VISION

Đây là một **Personal Life OS** — một web app cá nhân giúp người dùng quản lý cuộc sống hằng ngày trong một nơi duy nhất.

Mục tiêu KHÔNG phải tạo một app productivity phức tạp.

Mục tiêu chính:

> **Mở web → biết hôm nay cần làm gì → thao tác thật nhanh → thấy bản thân đang tiến bộ → có lý do để quay lại ngày mai.**

App phải có cảm giác:

- đơn giản
- nhẹ
- mượt
- đẹp
- dễ hiểu
- không cần học cách sử dụng
- thao tác nhanh
- dữ liệu đồng bộ
- mobile-friendly
- có thể phát triển từ vài users lên nhiều users

---

# 1. CORE UX PRINCIPLES

## 1.1. Simple First

Không được thêm chức năng chỉ vì "có thể thêm".

Mỗi tính năng phải trả lời được:

> Người dùng có thực sự cần nó thường xuyên không?

Nếu không → đưa vào phase sau.

---

## 1.2. Dashboard phải trả lời một câu hỏi

Khi mở app:

> **"Hôm nay tôi cần làm gì?"**

Không biến Dashboard thành một bảng thống kê khổng lồ.

Dashboard ưu tiên:

1. Today
2. Tasks
3. Progress
4. Upcoming
5. Goals
6. Finance today
7. Quick actions

---

## 1.3. One Action → One Result

Ví dụ:

`+1 Tập`

187 → 188

Không mở modal.

Không reload page.

Không bắt người dùng xác nhận nhiều bước.

---

## 1.4. UI phản hồi ngay lập tức

Ưu tiên **Optimistic UI**.

Ví dụ:

User bấm:

`+1 tập`

UI phải đổi ngay:

`187 → 188`

Firebase sync ở phía sau.

Nếu sync thất bại:

- rollback dữ liệu
- hiện toast lỗi
- không làm app crash

---

## 1.5. Không để thông tin phụ làm chậm app

Weather, quote, statistics, smart summary... đều là dữ liệu phụ.

Nếu API chậm hoặc lỗi:

Dashboard vẫn phải mở bình thường.

Không được:

> Weather API loading → toàn Dashboard loading.

---

# 2. APP STRUCTURE

Các module chính:

```text
🏠 Tổng quan
📅 Lịch
💰 Tiền
🎯 Mục tiêu
📚 Công việc / Gia sư
✨ Danh sách
⚙️ Cài đặt
```

Dashboard là trung tâm.

Các module khác cung cấp dữ liệu cho Dashboard.

---

# 3. DASHBOARD 2.0 — "TODAY"

Dashboard mới nên được thiết kế theo thứ tự:

---

## 3.1. Greeting

Ví dụ:

### Sáng 05:00–11:59

> ☀️ Chào buổi sáng, Khuê!
> Chúc bạn một ngày mới năng lượng.

### Chiều 12:00–17:59

> 🌤️ Chào buổi chiều!
> Cố gắng hoàn thành các công việc hôm nay nhé.

### Tối 18:00–04:59

> 🌙 Một ngày làm việc chăm chỉ!
> Đừng quên cập nhật sổ thu chi nhé.

Greeting phải tự động theo giờ địa phương của user.

---

## 3.2. Date

Hiển thị:

```text
Thứ Hai, 31 tháng 8
```

---

## 3.3. Avatar

Avatar cá nhân:

- cố định
- có thể click để đổi
- nếu chưa có avatar → fallback bằng chữ cái tên user
- không bắt buộc phải upload avatar

---

## 3.4. Daily Quote

Mỗi ngày hiển thị một quote.

Quote thay đổi theo ngày.

Không random mỗi lần refresh.

Ví dụ:

```text
Ngày 31/08
→ quote index = day-of-year % totalQuotes
```

Như vậy refresh nhiều lần trong ngày vẫn giữ nguyên quote.

---

# 4. TODAY'S FOCUS

Đây là phần quan trọng nhất của Dashboard.

Ví dụ:

```text
🎯 HÔM NAY

☑ Dạy bé An              18:00
☐ Học DSA                45 phút
☐ Ghi chi tiêu hôm nay
☐ Học chứng chỉ          30 phút

+ Thêm việc
```

Cho phép:

- tick task trực tiếp
- tạo task nhanh
- xem deadline
- xem thời gian
- hoàn thành task ngay trên Dashboard

Dashboard KHÔNG tạo một hệ thống task mới.

Nó phải đọc task từ hệ thống Calendar / Todo hiện có.

---

# 5. DAILY PROGRESS

Hiển thị:

```text
🌱 TIẾN ĐỘ HÔM NAY

3 / 5

██████████████░░░░░░ 60%

✓ 2 việc
✓ 45m học
✓ Cập nhật chi tiêu
```

Mục đích:

> Cho user cảm giác hôm nay mình đã tiến bộ.

Không cần gamification phức tạp.

---

# 6. DAILY STREAK

Ví dụ:

```text
🔥 12 ngày

Bạn đang duy trì rất tốt.
```

Streak KHÔNG yêu cầu hoàn thành 100% task.

Chỉ cần user có ít nhất một hoạt động có ích trong ngày.

Ví dụ:

- hoàn thành task
- học Focus Session
- cập nhật transaction
- cập nhật mục tiêu
- cập nhật progress

→ tính là một active day.

Không được thiết kế streak quá khắt khe khiến user mất streak sau một ngày bận.

---

# 7. COUNTDOWN

Dashboard có Countdown Widget.

Ví dụ:

```text
⏳ SẮP TỚI

🎓 IELTS
32 ngày

💻 Deadline đồ án
7 ngày

✈️ Đà Lạt
46 ngày
```

Chỉ hiển thị 3–5 countdown nổi bật.

Các countdown khác nằm trong màn hình quản lý.

Có thể tạo:

- kỳ thi
- deadline
- sinh nhật
- chuyến đi
- sự kiện
- ngày quan trọng

---

# 8. WEATHER

Weather chỉ là widget nhỏ.

Ví dụ:

```text
☀️ 29°C
Hà Nội · Trời nắng
```

hoặc:

```text
🌧️ 28°C
Mưa chiều · Nhớ mang ô
```

Weather không được làm chậm Dashboard.

Nếu API lỗi:

- hiển thị fallback
- hoặc ẩn widget

Không được làm Dashboard crash.

---

# 9. SMART DAILY SUMMARY

Dashboard có thể tự động tạo một summary ngắn.

Ví dụ:

```text
👀 Hôm nay khá nhẹ nhàng.
Bạn có 3 việc, 1 lớp dạy và chưa có deadline gấp.
```

Hoặc:

```text
⚠️ Hôm nay hơi bận.
Bạn có 7 việc và 2 deadline trong 3 ngày tới.
```

Hoặc:

```text
🌱 Bạn đang đi rất tốt.
Các mục tiêu hiện tại đều đang đúng tiến độ.
```

Đây là lớp aggregation/read-only.

Không tạo database riêng cho Smart Summary.

---

# 10. GOAL SNAPSHOT

Dashboard hiển thị một vài mục tiêu đang quan trọng nhất.

Ví dụ:

```text
🎯 MỤC TIÊU

AWS Solutions Architect        72%
████████████░░░

Hôm nay:
45 phút học

Việc tiếp theo:
→ Làm Practice Test 3
```

Goal page hiện tại đã có logic:

- target date
- milestone
- progress
- status
- hours this week
- overdue
- upcoming

Không viết lại hệ thống goal.

Dashboard chỉ đọc và tổng hợp.

---

# 11. "NEXT ACTION"

Mỗi goal nên có:

```text
Next Action
```

Ví dụ:

```text
🎯 AWS

72%

Việc tiếp theo:
Đọc Chapter 5

[Bắt đầu →]
```

Mục đích là luôn trả lời:

> "Bây giờ tôi nên làm gì?"

Không bắt user tự phân tích hàng loạt statistics.

---

# 12. FINANCE SNAPSHOT

Dashboard chỉ cần hiển thị:

```text
💰 HÔM NAY

Đã chi:       82.000đ
Hạn mức:     120.000đ
Còn lại:      38.000đ

Xem sổ →
```

Có thể thêm:

```text
Hôm nay bạn chi ít hơn 20% so với mức trung bình.
```

Không cần thêm quá nhiều biểu đồ vào Dashboard.

---

# 13. QUICK ADD

Có một nút `＋` dùng chung toàn app.

Click:

```text
Bạn muốn thêm gì?

✓ Việc cần làm
💰 Khoản chi
📅 Sự kiện
🎬 Phim
📍 Địa điểm
🎯 Mục tiêu
```

Form phải cực ngắn.

Ví dụ transaction:

```text
Số tiền: 45.000
Mô tả: Cà phê

[Lưu]
```

Không bắt user đi qua nhiều màn hình.

---

# 14. QUICK ADD — FUTURE SMART INPUT

Có thể mở rộng sau này.

Ví dụ user nhập:

```text
45k cà phê
```

App có thể parse thành:

```text
amount: 45000
name: "Cà phê"
type: "expense"
category: "food"
```

Nhưng đây là tính năng phase sau.

Không làm AI parsing trước khi architecture ổn định.

---

# 15. LISTS / "DANH SÁCH"

Tạo một module riêng:

```text
✨ Danh sách
```

Mục tiêu:

> Lưu những thứ user muốn xem / đi / trải nghiệm / theo dõi.

---

# 16. MOVIES & SERIES

Movie card:

```text
🎬 Gintama

187 / 367 tập

██████████░░░░░░ 51%

[-]   187   [+]

Đang xem
```

Nút:

```text
+1
```

phải tăng progress ngay lập tức.

Không mở modal.

---

## Movie status

```text
Đang xem
Muốn xem
Đã xong
```

Có thể hỗ trợ:

- season
- tổng số episode
- current episode
- progress %
- link
- note

---

# 17. GENERIC PROGRESS ENGINE

Movie không nên là một hệ thống hoàn toàn riêng.

Có thể mở rộng cùng logic cho:

```text
Movie
Book
Game
Course
Anime
```

Ví dụ:

```text
Book
37 / 320 pages
```

```text
Course
18 / 30 lessons
```

```text
Movie
187 / 367 episodes
```

Dùng chung concept:

```text
current
total
progressMode
```

Không generic quá mức.

Chỉ generic ở nơi thực sự có chung behavior.

---

# 18. PLACES / TRAVEL

Ví dụ:

```text
☕ The Workshop Coffee

📍 District 1

○ Chưa đi

🔗 Google Maps
```

Thông tin:

- name
- category
- area/address
- status
- map link
- TikTok/review link
- note

Status:

```text
Chưa đi
Đã đi
```

---

# 19. PLACE → FINANCE

Khi user đánh dấu:

```text
✓ Đã đi
```

có thể hiện:

```text
💰 Có muốn ghi lại chi phí không?

[Không]
[Thêm vào thu chi]
```

Nếu chọn:

```text
120.000đ
```

→ tạo transaction thông qua Finance module.

Không copy-paste dữ liệu giữa hai hệ thống.

---

# 20. OTHER LIST TYPES

Có thể mở rộng:

```text
🎬 Movies
📚 Books
🎮 Games
📍 Places
🍜 Restaurants
✈️ Travel
```

Nhưng không nhất thiết phải làm tất cả ngay.

Ưu tiên:

1. Movies
2. Places
3. Restaurants/Cafes

---

# 21. FINANCE

Finance hiện tại đã có:

- Tổng quan
- Sổ thu chi
- Báo cáo
- Wishlist
- Settings
- budget
- category
- recent transactions

Giữ hệ thống hiện tại.

Không xây lại chỉ để thêm Dashboard.

---

# 22. FINANCE PRINCIPLE

Finance phải đơn giản.

User thường xuyên chỉ cần:

```text
+45.000
Cà phê
```

Không ép nhập quá nhiều field.

Các field phụ có thể tự động:

- date
- type
- category
- userId
- createdAt

---

# 23. KHÔNG LINK WISHLIST VỚI SAVINGS

Không xây logic:

```text
Wishlist
→ Savings Goal
```

vì Wishlist có thể được mua bằng nguồn tiền khác.

Wishlist chỉ là:

> danh sách thứ muốn mua / muốn có.

Không coi wishlist là mục tiêu tiết kiệm.

---

# 24. FOCUS TIMER

Một Focus Timer đơn giản:

```text
⏱ FOCUS

25:00

[▶ Bắt đầu]
```

Có thể chọn:

```text
🎯 Goal
📚 Study
💼 Work
```

Khi hoàn thành:

```text
🎉 25 phút tập trung hoàn thành.
```

Nếu session gắn với Goal:

→ cộng thời gian vào Goal.

Không cần làm Pomodoro system phức tạp.

---

# 25. WEEKLY REVIEW

Mỗi tuần có một trang/tổng kết.

Ví dụ:

```text
🌿 TUẦN NÀY

12 tasks completed
6h 20m focused
4 active days

🎯 Goals

AWS       +4 sessions
IELTS     +2 sessions

💰 Finance

Chi tiêu: 1.240.000đ

✨ Lists

2 movies completed
1 place visited
```

Weekly Review chỉ đọc dữ liệu từ:

- Tasks
- Calendar
- Goals
- Finance
- Lists
- Focus

Không tạo một database trùng lặp.

---

# 26. ON THIS DAY

Có thể thêm sau này:

```text
🌱 Một năm trước...

Bạn đã hoàn thành:
12 giờ học

và bắt đầu:
AWS Solutions Architect
```

Đây là tính năng tạo cảm xúc và giúp user thấy lịch sử tiến bộ.

Không phải core feature.

---

# 27. NAVIGATION

Desktop:

```text
🏠 Tổng quan
📅 Lịch
💰 Tiền
🎯 Mục tiêu
📚 Công việc
✨ Danh sách
```

Settings nằm trong avatar/profile menu.

---

# 28. MOBILE NAVIGATION

Mobile ưu tiên bottom navigation:

```text
🏠       📅       ＋       💰       🎯
Home    Lịch    Quick    Tiền    Goal
```

Nút `＋` ở giữa là Quick Add.

Danh sách và các module phụ có thể nằm trong More/Menu.

---

# 29. MOST IMPORTANT ARCHITECTURE RULE

Không coi mỗi HTML là một app riêng.

Phải coi toàn bộ project là:

```text
PERSONAL LIFE OS
│
├── Authentication
├── Dashboard
├── Calendar
├── Tasks
├── Finance
├── Goals
├── Lists
├── Tutoring
└── Settings
```

HTML chỉ là UI.

---

# 30. RECOMMENDED PROJECT STRUCTURE

Giữ cấu trúc HTML hiện tại nếu cần.

Nhưng từng bước chuyển logic thành:

```text
my-life-app/

├── index.html
├── lich-tuan.html
├── chi-tieu.html
├── muc-tieu.html
├── gia-su.html
├── danh-sach.html
│
├── shared/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── store.js
│   ├── sync.js
│   ├── app-shell.js
│   ├── router.js
│   ├── toast.js
│   ├── modal.js
│   ├── quick-add.js
│   └── utils.js
│
├── modules/
│   ├── dashboard/
│   │   ├── dashboard.js
│   │   └── dashboard.css
│   │
│   ├── calendar/
│   │   ├── calendar.js
│   │   └── calendar.css
│   │
│   ├── finance/
│   │   ├── finance.js
│   │   └── finance.css
│   │
│   ├── goals/
│   │   ├── goals.js
│   │   └── goals.css
│   │
│   └── lists/
│       ├── lists.js
│       └── lists.css
│
├── assets/
│   ├── icons/
│   └── images/
│
└── ARCHITECTURE.md
```

Không nhất thiết phải chuyển toàn bộ ngay.

Refactor dần.

---

# 31. SHARED LAYER

`shared/` chứa những thứ mọi module có thể dùng.

Ví dụ:

```text
auth.js
store.js
sync.js
toast.js
modal.js
quick-add.js
utils.js
```

Không copy-paste những logic này vào từng HTML.

---

# 32. STORE = DATA ACCESS LAYER

Module KHÔNG được gọi Firebase lung tung.

Không làm:

```javascript
firebase.firestore()
    .collection(...)
    .add(...)
```

trong từng page.

Thay vào đó:

```javascript
Store.addTransaction(data)
Store.updateTransaction(id, data)
Store.deleteTransaction(id)

Store.addGoal(data)
Store.updateGoal(id, data)

Store.addListItem(data)
Store.updateListItem(id, data)
```

Module chỉ gọi Store.

---

# 33. DATA FLOW

Luồng chuẩn:

```text
UI
 ↓
Module Logic
 ↓
Store
 ↓
Firebase / Local Cache
```

Không:

```text
UI
 ↓
Firebase
```

trực tiếp.

---

# 34. UI LAYER

UI chỉ chịu trách nhiệm:

- render
- event handling
- loading state
- error state
- animation
- user interaction

UI không chịu trách nhiệm quyết định database structure.

---

# 35. APPLICATION LOGIC

Ví dụ:

```text
Finance
Goals
Tasks
Lists
Calendar
```

chịu trách nhiệm business logic.

Ví dụ:

```javascript
Lists.incrementProgress(movieId, 1)
```

function này đảm bảo:

```text
current >= 0
current <= total
updatedAt updated
data persisted
UI updated
```

---

# 36. DASHBOARD = READ / AGGREGATION LAYER

Dashboard không sở hữu dữ liệu.

Ví dụ:

```javascript
Dashboard.getTodaySummary()
```

trả về:

```javascript
{
    tasksCompleted: 3,
    tasksTotal: 5,
    studyMinutes: 45,
    streak: 12,
    upcomingCount: 2
}
```

Dashboard chỉ render.

---

# 37. USER DATA ISOLATION

Mỗi user phải có UID.

Ví dụ:

```text
users/
    userA/
        tasks/
        goals/
        transactions/
        lists/

    userB/
        tasks/
        goals/
        transactions/
        lists/
```

Không dùng một collection chung rồi chỉ lọc bằng frontend nếu có thể tránh.

---

# 38. FIREBASE AUTHENTICATION

Authentication trả lời:

> User là ai?

Ví dụ:

```text
Firebase Auth
     ↓
currentUser.uid
```

UID này dùng để xác định owner của dữ liệu.

---

# 39. AUTHENTICATION ≠ AUTHORIZATION

Authentication:

> "Bạn là ai?"

Authorization:

> "Bạn được phép làm gì?"

Firestore Security Rules phải đảm bảo:

```text
request.auth.uid == userId
```

User A không thể đọc/ghi dữ liệu của User B chỉ bằng cách sửa frontend request.

Security phải nằm ở backend/database rules.

---

# 40. PRIVATE VS PUBLIC DATA

Private data:

```text
/users/{uid}/...
```

Public/shared data có thể nằm riêng:

```text
/public/quotes
/public/config
```

Không lưu dữ liệu cá nhân vào public collections.

---

# 41. FIRESTORE DATA MODEL

Có thể tổ chức:

```text
users/{uid}

users/{uid}/tasks/{taskId}

users/{uid}/transactions/{transactionId}

users/{uid}/goals/{goalId}

users/{uid}/listItems/{itemId}

users/{uid}/events/{eventId}

users/{uid}/focusSessions/{sessionId}

users/{uid}/settings/profile
```

Không cần tạo collection mới nếu dữ liệu có thể thuộc một module hiện có.

---

# 42. LIST DATA MODEL

Dùng model đơn giản:

```javascript
{
    id,
    type,
    name,
    status,
    progress,
    notes,
    link,
    createdAt,
    updatedAt
}
```

Movie có thể thêm:

```javascript
{
    current,
    total,
    progressMode
}
```

Place có thể có:

```javascript
{
    location,
    category
}
```

Không tạo schema quá phức tạp.

---

# 43. ONE SOURCE OF TRUTH

Mỗi dữ liệu chỉ có một nguồn chính.

Ví dụ:

Task:

```text
Tasks
```

Dashboard không lưu task riêng.

Goal progress:

```text
Goals
```

Dashboard không lưu goal progress riêng.

Transaction:

```text
Finance
```

Weekly Review không copy transaction sang database khác.

---

# 44. CROSS-MODULE INTEGRATION

Các module có thể liên kết.

Ví dụ:

```text
Calendar
   ↕
Tasks
   ↕
Goals
   ↕
Dashboard
   ↕
Finance
   ↕
Lists
```

Ví dụ:

```text
Place → đã đi
      ↓
Quick expense
      ↓
Finance transaction
```

hoặc:

```text
Focus Session
      ↓
Goal
      ↓
Goal progress
      ↓
Dashboard
```

Nhưng phải thông qua service/store tương ứng.

Không truy cập trực tiếp database của module khác.

---

# 45. OPTIMISTIC UI

Tất cả thao tác nhanh nên ưu tiên:

```text
User action
 ↓
Update UI immediately
 ↓
Persist to Firebase
 ↓
Success → done
Failure → rollback + toast
```

Đặc biệt:

- +1 episode
- tick task
- add transaction
- mark place visited
- finish focus session

---

# 46. LOADING STATES

Không dùng loading spinner toàn trang nếu chỉ một component đang tải.

Ưu tiên:

- skeleton card
- inline loading
- button loading
- optimistic update

Ví dụ:

```text
+1
```

→ số tăng ngay.

Không:

```text
Loading...
```

toàn trang.

---

# 47. ERROR HANDLING

Không để:

```text
Firebase error
```

làm app trắng.

Thay bằng:

```text
⚠️ Không thể đồng bộ lúc này.
Dữ liệu sẽ được thử lại sau.
```

Nếu có local cache:

→ tiếp tục cho user sử dụng.

---

# 48. OFFLINE / SYNC

Kiến trúc hiện tại đã có Firebase + localStorage fallback.

Giữ nguyên hướng này.

Mục tiêu:

```text
Online
 ↓
Firebase + local cache

Offline
 ↓
Local cache
 ↓
App vẫn hoạt động
 ↓
Online lại
 ↓
Sync
```

Không cần hoàn thiện offline-first ngay trong phase đầu nếu làm phức tạp.

---

# 49. PWA

PWA là phase sau.

Mục tiêu:

- installable
- app icon
- standalone mode
- mobile experience
- offline shell
- cache static assets

Các thành phần:

```text
manifest.json
service-worker.js
icons/
```

Không cần ưu tiên trước khi core architecture ổn định.

---

# 50. RESPONSIVE

Phải thiết kế:

```text
Desktop
Tablet
Mobile
```

Mobile không phải chỉ là desktop thu nhỏ.

Đặc biệt:

- bottom navigation
- Quick Add
- card layout
- modal
- touch target
- font size
- spacing

---

# 51. PERFORMANCE

Ưu tiên:

```text
Fast first render
Fast interaction
Minimal blocking requests
Lazy load non-critical data
Cache static resources
```

Không load tất cả module chỉ vì Dashboard đang mở.

---

# 52. SECURITY

Không bao giờ:

- hardcode user-specific permissions ở frontend
- tin dữ liệu từ frontend
- để client tự quyết định owner
- dùng frontend filtering làm security
- expose secret API keys nếu key đó thực sự là secret

Firebase config public có thể tồn tại phía client theo thiết kế Firebase, nhưng Security Rules vẫn phải bảo vệ dữ liệu.

---

# 53. MULTI-USER MENTAL MODEL

Nếu có:

```text
1 user
```

và sau này:

```text
1.000 users
```

vẫn deploy **một app**.

Ví dụ:

```text
                  WEBSITE
                     │
              Firebase Auth
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
     User A        User B        User C
       │             │             │
     Data A        Data B        Data C
```

Không tạo website riêng cho từng user.

UID quyết định user nào được truy cập dữ liệu nào.

---

# 54. KHÔNG CẦN OPTIMIZE CHO 100.000 USERS NGAY

Ở giai đoạn hiện tại, chỉ cần architecture đúng.

Chưa cần ngay:

- microservices
- Kubernetes
- complex backend
- Redis
- message queues
- sharding
- complicated caching
- enterprise infrastructure

Chỉ cần:

```text
Auth
+
User-scoped data
+
Security Rules
+
Shared Store
+
Clean modules
```

là đủ để phát triển rất xa.

---

# 55. ARCHITECTURE DOCUMENT

Tạo:

```text
ARCHITECTURE.md
```

Nội dung tối thiểu:

```text
# Personal Life OS Architecture

## Core Modules
Dashboard
Calendar
Tasks
Finance
Goals
Lists
Tutoring
Settings

## Shared Services
Auth
Store
Sync
Toast
Modal
Quick Add

## Rules

1. Every private document belongs to a Firebase UID.
2. UI never accesses Firestore directly.
3. Modules access data through Store/services.
4. Dashboard is read/aggregation only.
5. One source of truth per data type.
6. Cross-module communication must use module APIs/services.
7. Do not duplicate persistent data.
8. Prefer optimistic UI.
9. Never let optional APIs block the main UI.
10. Preserve backward compatibility when modifying existing modules.
```

---

# 56. RULES FOR AI VIBE CODING

Mỗi khi yêu cầu AI sửa code, luôn nói:

> Implement this feature without breaking existing functionality.

> Reuse existing shared services, Store, Auth and UI utilities.

> Do not create a second data source for an existing entity.

> Do not duplicate Firebase logic inside individual pages.

> Keep all private user data scoped by Firebase UID.

> Do not modify Firestore data models unless absolutely necessary.

> If a data model must change, provide a migration strategy.

> Preserve existing APIs/functions unless there is a strong reason to change them.

> Do not rewrite unrelated files.

> Do not introduce a new framework unless explicitly requested.

> Prefer small, modular changes.

> Keep the existing visual language and design system.

> Do not add unnecessary dependencies.

> Make the UI optimistic and responsive.

> Handle loading, error and offline states gracefully.

---

# 57. FEATURE DEVELOPMENT RULE

Mỗi feature mới phải đi qua:

```text
1. Does data already exist?
       ↓
2. Reuse existing model
       ↓
3. If not → define minimal model
       ↓
4. Add Store API
       ↓
5. Add module logic
       ↓
6. Add UI
       ↓
7. Integrate Dashboard if useful
       ↓
8. Test existing modules
```

Không được:

```text
UI → Firebase → random document
```

---

# 58. DON'T OVER-GENERALIZE

Không biến mọi thứ thành:

```text
type
subtype
mode
schema
config
metadata
attributes
options
```

chỉ để "future-proof".

Future-proof tốt = kiến trúc rõ ràng.

Future-proof xấu = abstraction quá mức khiến code không ai hiểu.

---

# 59. DON'T CREATE DUPLICATE SYSTEMS

Ví dụ đã có Todo:

Không tạo:

```text
DashboardTasks
```

để Dashboard quản lý task riêng.

Đã có Finance:

Không tạo:

```text
PlaceExpenses
```

cho Places.

Đã có Goals:

Không tạo:

```text
DashboardGoals
```

Dashboard chỉ đọc dữ liệu.

---

# 60. DEVELOPMENT ROADMAP

## PHASE 0 — ARCHITECTURE

Làm trước:

- kiểm tra Store
- kiểm tra Auth
- kiểm tra Firestore Rules
- chuẩn hóa UID
- shared UI utilities
- shared data access
- error handling
- loading states
- ARCHITECTURE.md

Không cần thay đổi toàn bộ app.

Refactor dần.

---

## PHASE 1 — DASHBOARD 2.0

Implement:

- Greeting
- Avatar
- Date
- Quote
- Today's Tasks
- Daily Progress
- Streak
- Countdown
- Weather
- Smart Summary
- Goal Snapshot
- Finance Snapshot
- Quick Add

Dashboard phải trở thành:

> "Today Center"

---

## PHASE 2 — LISTS

Implement:

### Movies
- status
- episode progress
- season
- +1

### Places
- address
- category
- status
- Google Maps
- review link

### Restaurants/Cafes

Sau đó mới mở rộng:

- Books
- Games
- Courses
- Travel

---

## PHASE 3 — CROSS-MODULE INTEGRATION

Implement:

```text
Lists ↔ Finance

Focus ↔ Goals

Tasks ↔ Goals

Calendar ↔ Tasks

Everything ↔ Dashboard
```

---

## PHASE 4 — FOCUS + REVIEW

Implement:

- Focus Timer
- Goal-linked sessions
- Weekly Review
- Monthly Review
- On This Day

---

## PHASE 5 — PWA / OFFLINE POLISH

Sau khi core app ổn:

- manifest
- service worker
- installable
- offline shell
- caching
- sync improvements

---

## PHASE 6 — SCALE

Chỉ khi có nhiều users thật mới tối ưu:

- Firestore indexes
- pagination
- query optimization
- Cloud Functions nếu cần
- monitoring
- analytics
- backups
- cost optimization
- rate limiting
- abuse prevention

---

# 61. FINAL PRODUCT LOOP

Toàn bộ app phải tạo ra vòng lặp:

```text
                 ┌──────────────┐
                 │  OPEN APP    │
                 └──────┬───────┘
                        ↓
               ┌────────────────┐
               │ SEE TODAY      │
               │ Tasks / Events │
               └───────┬────────┘
                       ↓
               ┌────────────────┐
               │ TAKE ACTION    │
               │ Tick / +1 / +  │
               └───────┬────────┘
                       ↓
               ┌────────────────┐
               │ SEE PROGRESS   │
               │ 3 / 5 · +45m   │
               └───────┬────────┘
                       ↓
               ┌────────────────┐
               │ FEEL PROGRESS  │
               │ 🌱 🔥          │
               └───────┬────────┘
                       ↓
               ┌────────────────┐
               │ COME BACK      │
               │ TOMORROW       │
               └────────────────┘
```

Đây là mục tiêu UX quan trọng nhất của toàn bộ project.

---

# 62. WHAT NOT TO BUILD RIGHT NOW

Không ưu tiên:

- social network
- friends/followers
- leaderboard
- achievement system phức tạp
- quá nhiều badges
- quá nhiều charts
- AI assistant hoàn chỉnh
- AI planner hoàn chỉnh
- complex journaling
- quá nhiều notification
- savings ↔ wishlist system
- duplicate task system
- duplicate finance system

---

# 63. SUCCESS CRITERIA

App được xem là thành công nếu:

### Khi mở Dashboard:

User trong 3–5 giây biết:

```text
Hôm nay là ngày gì?
Tôi cần làm gì?
Tôi đang tiến bộ thế nào?
Có deadline gì?
Tình hình tiền hôm nay thế nào?
```

### Khi muốn thêm dữ liệu:

Không quá:

```text
2–3 clicks
```

### Khi tick một task:

UI thay đổi ngay.

### Khi +1 episode:

UI thay đổi ngay.

### Khi mất mạng:

App không trắng.

### Khi đăng nhập thiết bị khác:

Dữ liệu xuất hiện.

### Khi thêm user mới:

User mới không thấy dữ liệu user cũ.

### Khi thêm module mới:

Không cần copy toàn bộ Firebase logic.

---

# 64. GOLDEN RULE

> **Đừng xây một website có thật nhiều chức năng.**
>
> **Hãy xây một hệ thống nhỏ, trong đó mọi chức năng nói chuyện được với nhau và người dùng không cần suy nghĩ để sử dụng.**

Kiến trúc ưu tiên:

```text
SIMPLE
   ↓
MODULAR
   ↓
USER-SCOPED
   ↓
SYNCED
   ↓
FAST
   ↓
EXTENSIBLE
```

Không ưu tiên:

```text
COMPLEX
   ↓
OVER-ENGINEERED
   ↓
HARD TO MAINTAIN
```

---

# 65. ONE-SENTENCE REQUIREMENT FOR FUTURE AI

Mỗi lần phát triển tiếp, AI phải hiểu:

> **"This is a multi-user Personal Life OS. Extend the existing system modularly, preserve current functionality and data, keep all private data scoped to Firebase UID, access persistence through shared Store/services instead of direct Firebase calls from UI, avoid duplicate data sources, use optimistic UI, and prioritize a fast, simple, mobile-friendly experience."**