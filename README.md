# Không Gian Của Tôi — app cá nhân gộp 4 công cụ

Gồm: Trang chủ tổng quan, Lịch tuần, Sổ chi tiêu, Ứng tuyển & Gia sư, Mục tiêu & Chứng chỉ.
Đăng nhập 1 lần bằng tài khoản Firebase của bạn, dữ liệu tự đồng bộ giữa điện thoại / laptop / iPad.

## 1. Điền thông tin Firebase của bạn

Mở file `shared/firebase-config.js`, thay đoạn `firebaseConfig` bằng đoạn bạn copy từ
Firebase Console (Project settings → Your apps → SDK setup and configuration). Chỉ cần sửa
đúng 1 file này, đừng đổi tên biến `firebaseConfig`.

## 2. Dán Firestore Rules (BẮT BUỘC — nếu bỏ qua bước này, ai có URL cũng đọc/ghi được dữ liệu của bạn)

Vào Firebase Console → Firestore Database → tab **Rules**, xoá hết nội dung mặc định và dán:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/kv/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Bấm **Publish**. Rule này đảm bảo chỉ đúng tài khoản bạn đã tạo (bước 4 ở phần setup ban đầu)
mới đọc/ghi được dữ liệu của chính nó — người khác dù có URL cũng không vào được vì họ không
có mật khẩu đăng nhập của bạn.

## 3. Đẩy code lên GitHub và bật GitHub Pages

```
git init
git add .
git commit -m "Khoi tao app ca nhan"
git branch -M main
git remote add origin https://github.com/<ten-ban>/<ten-repo>.git
git push -u origin main
```

Sau đó vào repo trên GitHub → **Settings → Pages** → Source chọn nhánh `main`, thư mục `/ (root)`
→ Save. Sau khoảng 1 phút, trang sẽ chạy tại `https://<ten-ban>.github.io/<ten-repo>/`.

Mở link đó trên điện thoại, laptop, iPad — mỗi lần chỉ cần đăng nhập bằng email/mật khẩu bạn
đã tạo ở bước 4 (phần setup Firebase) là dữ liệu tự đồng bộ.

## Cấu trúc thư mục

```
index.html          → Trang chủ: dashboard tổng quan + 4 ô bấm vào từng công cụ
lich-tuan.html       → Lịch tuần (sự kiện, việc cần làm)
chi-tieu.html        → Sổ chi tiêu
gia-su.html          → Ứng tuyển & quản lý lớp gia sư
muc-tieu.html        → Mục tiêu học tập & chứng chỉ
shared/
  style.css          → Theme sáng/tối, thanh điều hướng, màn hình đăng nhập — SỬA MÀU Ở ĐÂY
  firebase-config.js → Cấu hình Firebase — SỬA THÔNG TIN CỦA BẠN Ở ĐÂY
  store.js           → Lớp lưu trữ (Firestore + dự phòng localStorage khi mất mạng)
  app-shell.js        → Sinh ra thanh nav + đăng nhập + nút đổi theme cho mọi trang
```

## Muốn sửa gì thì sửa ở đâu?

- **Đổi màu / thêm theme**: `shared/style.css` (biến `--gpx-*` ở đầu file).
- **Đổi tên menu / thêm trang mới**: mảng `PAGES` trong `shared/app-shell.js`.
- **Sửa logic riêng của từng công cụ** (thêm trường, đổi cách tính...): sửa thẳng trong
  `lich-tuan.html` / `chi-tieu.html` / `gia-su.html` / `muc-tieu.html` như các file gốc —
  cấu trúc HTML/CSS/JS bên trong mỗi file gần như giữ nguyên, chỉ phần lưu trữ là đổi sang
  gọi `window.Store.storageGetRaw(key)` / `window.Store.storageSetRaw(key, value)`.
- **Đổi nội dung tóm tắt ở trang chủ**: `index.html`, các hàm `renderCalendarSummary`,
  `renderExpenseSummary`, `renderTutoringSummary`, `renderGoalsSummary`.

## Đăng nhập trên thiết bị mới

Chỉ cần mở đúng link GitHub Pages, nhập email + mật khẩu đã tạo trong Firebase Authentication.
Không giới hạn số thiết bị đăng nhập cùng lúc.

## Sao lưu

Cả 4 công cụ vẫn giữ nguyên nút "Xuất JSON" như bản gốc — bấm định kỳ để tải file JSON về
máy làm bản sao lưu ngoài, phòng khi cần khôi phục thủ công.

## Lưu ý nhỏ

- Nếu mất mạng, dữ liệu vẫn được lưu tạm vào bộ nhớ trình duyệt (localStorage) của thiết bị
  đang dùng và sẽ tự đẩy lên Firestore khi có mạng lại — miễn là bạn không xoá dữ liệu trình
  duyệt trước khi mạng trở lại.
- `apiKey` trong `firebase-config.js` không phải bí mật (đây là cách Firebase hoạt động bình
  thường) — lớp bảo mật thật nằm ở Firestore Rules tại bước 2, nên đừng bỏ qua bước đó.
