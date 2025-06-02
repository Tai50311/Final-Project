// challenge.js

document.addEventListener('DOMContentLoaded', () => {
  const challengingList = document.getElementById('challenging-list');
  const challengeCards = document.querySelectorAll('.challenge-card');
  const challengeModal = document.getElementById('challengeModal');
  const challengeDaysInput = document.getElementById('challengeDays');
  const selectedHabitList = document.getElementById('selectedHabitList');
  const customHabitInput = document.getElementById('customHabitInput');
  const addCustomHabitBtn = document.getElementById('addCustomHabitBtn');
  const customHabitList = document.getElementById('customHabitList');
  const confirmChallengeBtn = document.getElementById('confirmChallengeBtn');
  const cancelChallengeBtn = document.getElementById('cancelChallengeBtn');

  challengeDaysInput.addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, '');
  });

  // 用來記錄當前選擇的挑戰習慣 (陣列)
  let currentSelectedHabits = [];

  // 讀取並顯示使用者的進行中挑戰
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      loadChallenges(user.uid);
      loadProgressHistory(user.uid);
    } else {
      // 沒登入，清空挑戰清單或提示登入
      challengingList.innerHTML = '';
    }
  });

  function loadChallenges(userId) {
    firebase.firestore()
      .collection('users')
      .doc(userId)
      .collection('challenges')
      .doc('active') // 假設我們只有一個進行中挑戰
      .get()
      .then(doc => {
        if (!doc.exists) return;

        const challengeData = doc.data();
        const habits = challengeData.habits || [];

        // 顯示在右邊清單
        challengingList.innerHTML = '';
        habits.forEach(habit => {
          addHabitToChallengingList(habit);
        });

        // ⬇ 取得 progress 資料
        firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('challenges')
          .doc('active')
          .collection('progress')
          .get()
          .then(progressSnap => {
            const progressMap = {};

            progressSnap.forEach(doc => {
              progressMap[doc.id] = doc.data(); // doc.id 是 YYYY-MM-DD
            });

            // ⬇ 呼叫這兩個函式
            renderProgressHistory(transformProgressMapToArray(progressMap));
            updateStreakCount(progressMap, habits);
          });
      })
      .catch(error => {
        console.error('讀取挑戰失敗:', error);
      });
  }


  // 顯示「從挑戰開始日到今天」的每日紀錄
  function loadProgressHistory(userId) {
  // 從 Firestore 讀取過去完成的挑戰紀錄（假設存在 collection 'challengeRecords'）
    firebase.firestore()
      .collection('users')
      .doc(userId)
      .collection('challengeRecords')  // 這邊換成你的歷史挑戰紀錄 collection 名稱
      .get()
      .then(snapshot => {
        const progressContainer = document.getElementById('progress-history');
        progressContainer.innerHTML = ''; // 清空

        if (snapshot.empty) {
          progressContainer.textContent = "尚無挑戰記錄";
          return;
        }

        snapshot.forEach(doc => {
          const record = doc.data();
          // record 範例: { name: "晨型人挑戰", days: 7, completedAt: Timestamp }

          const card = document.createElement('div');
          card.className = 'challenge-card';

          const completedDate = record.completedAt?.toDate?.() || new Date();
          const completedDateStr = completedDate.toISOString().split('T')[0];

          card.innerHTML = `
            <h4>${record.name}</h4>
            <p>完成天數：${record.days || '-' } 天</p>
            <p>完成日期：${completedDateStr}</p>
          `;

          progressContainer.appendChild(card);
        });
      })
      .catch(error => {
        console.error('讀取挑戰記錄失敗:', error);
      });
  }

  //顯示每一列
  function renderProgressHistory(challengeData) {
    const historyDiv = document.getElementById("progress-history");
    historyDiv.innerHTML = ""; // 清空

    if (!challengeData || challengeData.length === 0) {
      historyDiv.textContent = "尚未有挑戰紀錄。";
      return;
    }

    challengeData.forEach(entry => {
      const item = document.createElement("div");
      item.classList.add("progress-item");
      item.textContent = `${entry.date} - ${entry.habitName}: ${entry.completed ? "✔️ 已完成" : "❌ 未完成"}`;
      historyDiv.appendChild(item);
    });
  }


  //計算「連續幾天挑戰全部完成」
  function calculateStreak(progressMap, habits) {
    let today = new Date();
    today.setHours(0, 0, 0, 0); 
    let streak = 0;

    while (true) {
      const dateStr = today.toISOString().split('T')[0];
      const dayProgress = progressMap[dateStr];

      if (!dayProgress) break;

      const allCompleted = habits.every(h => dayProgress[h] === true);
      if (!allCompleted) break;

      streak++;
      today.setDate(today.getDate() - 1);
    }

    return streak;
  }

  function updateStreakCount(progressMap, habits) {
    const streak = calculateStreak(progressMap, habits);
    document.getElementById("streak-count").textContent = `已連續達成 ${streak} 天！`;
  }

  // 將 progressMap 轉為 renderProgressHistory 可用的陣列格式
  function transformProgressMapToArray(progressMap) {
    const result = [];

    Object.entries(progressMap).forEach(([date, habitsObj]) => {
      Object.entries(habitsObj).forEach(([habitName, completed]) => {
        result.push({ date, habitName, completed });
      });
    });

    return result;
  }

  // 2. 挑戰範本按鈕點擊，打開 Modal 並載入習慣
  challengeCards.forEach(card => {
    const applyBtn = card.querySelector('.apply-challenge-btn');
    applyBtn.addEventListener('click', () => {
      openChallengeModal(JSON.parse(card.dataset.habits));
    });
  });

  // 開啟挑戰設定 Modal
  function openChallengeModal(habits) {
    currentSelectedHabits = [...habits]; // 複製陣列
    renderSelectedHabits();
    renderCustomHabits([]);
    challengeDaysInput.value = 7;
    customHabitInput.value = '';

    challengeModal.style.display = 'flex';
  }

  // 關閉 Modal
  function closeChallengeModal() {
    challengeModal.style.display = 'none';
    currentSelectedHabits = [];
    clearCustomHabits();
  }

  cancelChallengeBtn.addEventListener('click', () => {
    closeChallengeModal();
  });

  // 3. 將習慣顯示在 Modal 已選擇清單
  function renderSelectedHabits() {
    selectedHabitList.innerHTML = '';
    currentSelectedHabits.forEach((habit, index) => {
      const li = document.createElement('li');
      li.textContent = habit;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.classList.add('delete-habit');
      deleteBtn.title = "移除習慣";
      deleteBtn.addEventListener('click', () => {
        currentSelectedHabits.splice(index, 1);
        renderSelectedHabits();
      });

      li.appendChild(deleteBtn);
      selectedHabitList.appendChild(li);
    });
  }

  // 4. 新增自訂習慣按鈕
  addCustomHabitBtn.addEventListener('click', e => {
    e.preventDefault();
    const newHabit = customHabitInput.value.trim();
    if (!newHabit) return alert('請輸入自訂習慣名稱');
    if (currentSelectedHabits.includes(newHabit)) return alert('此習慣已在列表中');

    currentSelectedHabits.push(newHabit);
    renderSelectedHabits();
    customHabitInput.value = '';
  });

  // 自訂習慣核取清單（這裡不額外顯示，全部加入 selectedHabitList 即可）

  // 5. 確定挑戰按鈕
  confirmChallengeBtn.addEventListener('click', () => {
  const days = parseInt(challengeDaysInput.value);
  if (isNaN(days) || days <= 0) {
    alert('請輸入有效的挑戰天數');
    return;
  }
  if (currentSelectedHabits.length === 0) {
    alert('請至少選擇一個習慣');
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    alert('請先登入');
    return;
  }

  firebase.firestore()
    .collection('users')
    .doc(user.uid)
    .collection('challenges')
    .doc('active')
    .set({
      habits: currentSelectedHabits,
      challengeDays: days,
      createdAt: new Date()
    })
    .then(() => {
      // 新增習慣到挑戰清單(頁面右側核取方塊區)
      currentSelectedHabits.forEach(habit => {
        addHabitToChallengingList(habit);
      });

      closeChallengeModal();
      alert('挑戰已儲存！');
    })
    .catch((error) => {
      console.error('儲存挑戰失敗:', error);
      alert('儲存挑戰失敗，請稍後再試');
    });
});


  // 新增習慣到挑戰列表（如果重複就不新增）
  function addHabitToChallengingList(habitName) {
    // 檢查是否已存在
    const exists = [...challengingList.querySelectorAll('input[type="checkbox"]')].some(input => {
      return input.value === habitName;
    });

    if (exists) return;

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'challengingHabit';
    checkbox.value = habitName;
    checkbox.classList.add('checkbox-circle1');
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(habitName));
    challengingList.appendChild(label);
    
    // ✅ 從 firestore 讀取當天進度
    const user = firebase.auth().currentUser;
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .collection('challenges')
        .doc('active') // 如果改成固定 active 就用這個
        .collection('progress')
        .doc(today)
        .get()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data();
            checkbox.checked = !!data[habitName];
          }
        });
    }

    // ✅ 勾選儲存
    checkbox.addEventListener('change', () => {
      label.classList.toggle('checked', checkbox.checked);
      saveProgressToFirestore(habitName, checkbox.checked);
    });
  }

  // 清除 Modal 內自訂習慣欄位及列表
  function clearCustomHabits() {
    customHabitInput.value = '';
  }

  // 預留，將來可以顯示自訂習慣核取列表，如果要可再擴充
  function renderCustomHabits(customHabits) {
  customHabitList.innerHTML = '';
    // 目前不額外顯示，暫空
  }
  function saveProgressToFirestore(habitName, isChecked) {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.warn('尚未登入，無法儲存進度');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`儲存 ${today} ${habitName} = ${isChecked}`);

    const progressRef = firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .collection('challenges')
      .doc('active')
      .collection('progress')
      .doc(today);

    progressRef.set({
      [habitName]: isChecked
    }, { merge: true });
  }
});