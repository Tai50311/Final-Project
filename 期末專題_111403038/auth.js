// Firebase 初始化設定
const firebaseConfig = {
  apiKey: "AIzaSyDIIP9RoKEz9FXxYhP9NPyI9IrBQB9OKsU",
  authDomain: "study-helper-bddbb.firebaseapp.com",
  projectId: "study-helper-bddbb",
  storageBucket: "study-helper-bddbb.firebasestorage.app",
  messagingSenderId: "754343578041",
  appId: "1:754343578041:web:3c2a1d5141f23ea2408e68"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 在 auth.js 最上方（firebase 初始化之後）
window.currentUser = null;  // 宣告成全域變數

auth.onAuthStateChanged(user => {
  window.currentUser = user;  // 更新全域變數
  console.log("onAuthStateChanged user:", user);
  
  if (user) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("main-container").style.display = "flex";
    loadTasks(user.uid);
    showPage("tasks");
  } else {
    document.getElementById("auth").style.display = "block";
    document.getElementById("main-container").style.display = "none";
  }
});

// 註冊新帳號
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) {
    alert("請輸入 Email 和密碼！");
    return;
  }
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("註冊成功！");
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    })
    .catch(err => alert(err.message));
}

// 登入
function login() {
  console.log("login function triggered");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  console.log("email:", email, "password:", password);

  if (!email || !password) {
    alert("請輸入 Email 和密碼！");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message)); // *** 修正：將切換頁面邏輯移至 onAuthStateChanged ***
}


// 登出
function logout() {
  auth.signOut();
}

window.register = register;
window.login = login;
window.logout = logout;
window.auth = auth;
window.db = db;
