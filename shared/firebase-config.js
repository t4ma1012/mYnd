/* =========================================================================
   FIREBASE CONFIG — Khởi tạo 1 Firebase app duy nhất, dùng chung cho tất cả
   các trang và giữ persistence LOCAL để session không bị mất khi chuyển tab
   hoặc reload trang.
   ========================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyAtRN2DMuUMEbJYjcGNlGqmrtfHP2OSQsM",
  authDomain: "mynd-211206.firebaseapp.com",
  projectId: "mynd-211206",
  storageBucket: "mynd-211206.firebasestorage.app",
  messagingSenderId: "882164749870",
  appId: "1:882164749870:web:e7a8817ac348c8bc08f1bf"
};

(function(){
  if (typeof firebase === 'undefined') {
    console.error('[Firebase] Firebase SDK chưa được load trước shared/firebase-config.js');
    return;
  }

  const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth(app);
  const db = firebase.firestore(app);

  window.gpxApp = app;
  window.gpxAuth = auth;
  window.gpxDb = db;

  if (typeof auth.setPersistence === 'function') {
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch((error) => {
        console.warn('[Firebase] Không thể thiết lập persistence LOCAL:', error && error.message ? error.message : error);
      });
  }
})();
