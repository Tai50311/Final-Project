// profile.js
// 引用 Firebase Auth 與 Firestore
const nicknameInput = document.getElementById('nicknameInput');
const editNicknameBtn = document.getElementById('editNicknameBtn');
const userAvatar = document.getElementById("userAvatar");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");
const avatarSelection = document.getElementById("avatarSelection");


// 監聽登入狀態變化
firebase.auth().onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    const userDocRef = firebase.firestore().collection('users').doc(user.uid);
    const doc = await userDocRef.get();

    // 頭像載入
    const photoURL = doc.exists && doc.data().photoURL
      ? doc.data().photoURL
      : user.photoURL || "default-avatar.png";
    userAvatar.src = photoURL;

    // 暱稱載入
    if (doc.exists && doc.data().nickname) {
      nicknameInput.value = doc.data().nickname;
    }

    // 載入時數
    const sessionsRef = userDocRef.collection('focusSessions');

    sessionsRef.onSnapshot(snapshot => {
      // 清除先前的資料
      let totalMinutes = 0;
      let todayMinutes = 0;
      const weeklyData = Array(7).fill(0);
      const hourlyData = Array(24).fill(0);

      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      snapshot.forEach(doc => {
        const data = doc.data();
        const minutes = data.duration || 0;
        const timestamp = data.timestamp?.toDate();
        if (!timestamp) return;

        totalMinutes += minutes;

        // 判斷是否為今天
        if (
          timestamp.getFullYear() === todayYear &&
          timestamp.getMonth() === todayMonth &&
          timestamp.getDate() === todayDate
        ) {
          todayMinutes += minutes;
        }

        const day = (timestamp.getDay() + 6) % 7;
        weeklyData[day] += minutes;
        const hour = timestamp.getHours();
        hourlyData[hour] += minutes;
      });

      renderTotalFocusTime(totalMinutes);
      renderTodayFocusTime(todayMinutes);
      renderWeeklyChart(weeklyData);
      renderPeriodChart(hourlyData);
    });


    let totalMinutes = 0;
    const weeklyData = Array(7).fill(0);    // 週一～週日
    const hourlyData = Array(24).fill(0);   // 每小時

    /*snapshot.forEach(doc => {
      const data = doc.data();
      const minutes = data.duration || 0;
      const timestamp = data.timestamp?.toDate();
      if (!timestamp) return;

      totalMinutes += minutes;

      const day = (timestamp.getDay() + 6) % 7;  // 轉成週一=0
      weeklyData[day] += minutes;

      const hour = timestamp.getHours();
      hourlyData[hour] += minutes;
    });

    // 渲染
    renderTotalFocusTime(totalMinutes);
    renderWeeklyChart(weeklyData);
    renderPeriodChart(hourlyData);*/
  }
});

// 點擊按鈕直接儲存暱稱
editNicknameBtn.addEventListener('click', async () => {
  const newNickname = nicknameInput.value.trim();
  if (newNickname === '') {
    alert("暱稱不能為空");
    return;
  }

  const user = firebase.auth().currentUser;
  if (user) {
    try {
      const userDocRef = firebase.firestore().collection('users').doc(user.uid);
      await userDocRef.set({ nickname: newNickname }, { merge: true });
      alert("暱稱已更新！");
    } catch (error) {
      console.error("更新暱稱失敗：", error);
      alert("更新暱稱時發生錯誤");
    }
  }
});


// ----------- 以下是圖表與時間渲染邏輯 -----------

function renderTotalFocusTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  document.getElementById('totalFocusTime').textContent = `${h} 小時 ${m} 分鐘`;
}

function renderTodayFocusTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  document.getElementById('todayFocusTime').textContent = `今日專注時間：${h} 小時 ${m} 分鐘`;
}

let weeklyChartInstance = null;
function renderWeeklyChart(data) {
  const ctx = document.getElementById('weeklyFocusChart').getContext('2d');
  // 如果已經有圖表存在，先銷毀它
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
  }
  weeklyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
      datasets: [{
        label: '專注趨勢',
        data: data, 
        fill: false,
        borderColor: '#5e8370',
        tension: 0.2
      }]
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: { 
        y: { 
          beginAtZero: true,
          ticks: {
            callback: value => value + ' 分鐘'
          }
        } 
      }
    }    
  });
}

let periodChartInstance = null;
function renderPeriodChart(data) {
  const ctx = document.getElementById('focusPeriodChart').getContext('2d');
  if (periodChartInstance) {
    periodChartInstance.destroy();
  }
  periodChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [{
        label: '專注時間',
        data: data,
        backgroundColor: '#a3b9b4'
      }]
    },
    /*options: {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }*/
    options: {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: {
            maxRotation: 90,
            minRotation: 45,
            font: {
              size: 12,
            }
          }
        },
        y: {
          beginAtZero: true,
          max: 60,
          ticks: {
            stepSize: 15,
            callback: value => {
              switch(value) {
                case 15: return '15 分鐘';
                case 30: return '30 分鐘';
                case 45: return '45 分鐘';
                case 60: return '60 分鐘';
                default: return '';  // 其他不顯示標籤
              }
            }
          }
        }
      }
    }
  });
}

// ----------- 以下是更換頭像邏輯 -----------
// 顯示或隱藏頭像選擇區塊
changeAvatarBtn.addEventListener("click", () => {
  avatarSelection.style.display = avatarSelection.style.display === "none" ? "flex" : "none";
});

// 點選其中一個預設頭像後進行更換
document.querySelectorAll(".avatar-option").forEach(img => {
  img.addEventListener("click", async () => {
    const selectedURL = img.getAttribute("src");
    if (!currentUser) return;

    try {
      // 更新 Firestore 資料
      await firebase.firestore().collection("users").doc(currentUser.uid).set({
        photoURL: selectedURL
      }, { merge: true });

      // 更新畫面上的頭像
      userAvatar.src = selectedURL;

      // 隱藏選擇區塊
      avatarSelection.style.display = "none";

      console.log("頭像已更新為預設圖片");
    } catch (error) {
      console.error("更新頭像失敗：", error);
      alert("更新頭像時發生錯誤");
    }
  });
});
