const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

// 取得目前使用者 ID（假設已登入）
let currentUserId = null;
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    loadTasks();
  } else {
    currentUserId = null;
    taskList.innerHTML = '';
  }
});

// 新增任務
function addTask() {
  console.log("addTask() 被呼叫了");
  console.log("currentUserId:", currentUserId);
  console.log("db:", db);
  const taskText = taskInput.value.trim();
  const dueDateInput = document.getElementById('taskDueDate');
  const dueDateValue = dueDateInput.value;  // YYYY-MM-DD 格式
  if (!taskText) {
    alert('請輸入學習目標');
    return;
  }
  if (!currentUserId) {
    alert('請先登入');
    return;
  }

  const taskData = {
  text: taskText,
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  completed: false,
  dueDate: dueDateValue ? new Date(dueDateValue) : null
  };

  db.collection('users') 
    .doc(currentUserId)
    .collection('tasks')
    .add(taskData)
    .then(docRef => {
      console.log('任務已新增，ID：', docRef.id);
      taskInput.value = '';
      addTaskToDOM(docRef.id, taskText, false, dueDateValue ? new Date(dueDateValue) : null);
      showMessage('任務新增成功！'); // 新增提示訊息
      loadTasks();
    })
    .catch(error => {
      console.error('新增任務錯誤：', error);
      alert("新增任務失敗：" + error.message);
    });
}

// 顯示提示訊息 (自動3秒後隱藏)
function showMessage(msg, color = 'green') {
  const messageDiv = document.getElementById('task-message');
  messageDiv.textContent = msg;
  messageDiv.style.color = color;
  messageDiv.style.display = 'block';
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

// 更新進度條
function updateTaskProgress(completed, total) {
  const progressHint = document.getElementById('task-progress-hint');
  const progressBar = document.getElementById('task-progress-bar');
  const progressText = document.getElementById('task-progress-text');
  if (total === 0) {
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    return;
  }
  progressHint.textContent = `完成進度：${completed} / ${total}`;
  const percent = Math.round((completed / total) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = percent + '%';
}

// 刪除任務
function deleteTask(id, li) {
  if (!currentUserId) {
    alert('請先登入');
    return;
  }

  db.collection('users')
    .doc(currentUserId)
    .collection('tasks')
    .doc(id)
    .delete()
    .then(() => {
      console.log('任務已刪除：', id);
      li.remove(); // 從畫面移除
      loadTasks();
    })
    .catch(error => {
      console.error('刪除任務錯誤：', error);
      alert("刪除任務失敗：" + error.message);
    });
}

// 將任務加到網頁清單
function addTaskToDOM(id, text, completed, dueDate) {
  const li = document.createElement('li');
  li.setAttribute('data-id', id);
  li.style.display = 'flex';          // 加這行：讓 li 成為 flex 容器
  li.style.alignItems = 'center';     // 加這行：讓子元素垂直置中

  // 自訂勾選框容器
  const circle = document.createElement('span');
  circle.classList.add('checkbox-circle');
  if (completed) circle.classList.add('checked');

  // 點擊切換完成狀態
  circle.addEventListener('click', () => {
    const newStatus = !circle.classList.contains('checked');
    toggleTaskCompleted(id, newStatus, li);
    circle.classList.toggle('checked');
    span.style.textDecoration = newStatus ? 'line-through' : 'none';
  });

  // 任務文字
  const span = document.createElement('span');
  span.classList.add('task-text');
  span.textContent = text;
  span.style.textDecoration = completed ? 'line-through' : 'none';

  // 刪除按鈕
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = '刪除';
  deleteBtn.addEventListener('click', () => {
    deleteTask(id, li);
  });

  // 點擊文字，切換成輸入框
  span.addEventListener('click', () => {
    deleteBtn.style.display = 'none';

    // 建立文字輸入框
    const inputText = document.createElement('input');
    inputText.type = 'text';
    inputText.value = span.textContent;
    inputText.classList.add('task-edit-input');

    // 建立截止日期輸入框
    const inputDate = document.createElement('input');
    inputDate.type = 'date';
    inputDate.classList.add('task-edit-date');
    inputDate.style.marginLeft = '10px';
    if (dueDate instanceof Date && !isNaN(dueDate)) {
      inputDate.valueAsDate = dueDate;
    }

    // 替換文字顯示
    li.replaceChild(inputText, span);
    li.replaceChild(inputDate, dueDateSpan);

    inputText.focus();

    function saveEdit() {
      const newText = inputText.value.trim();
      const newDueDate = inputDate.value ? new Date(inputDate.value) : null;

      // 只有文字或日期有變動才更新
      if (newText && (newText !== text || newDueDate?.toDateString() !== dueDate?.toDateString())) {
        updateTaskTextAndDate(id, newText, newDueDate);
        span.textContent = newText;
        text = newText;
        dueDate = newDueDate;

        // 更新顯示用的截止時間文字
        if (newDueDate instanceof Date && !isNaN(newDueDate)) {
          const now = new Date();
          const diff = newDueDate - now;
          if (diff <= 0) {
            dueDateSpan.textContent = '已截止';
          } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            dueDateSpan.textContent = `剩餘 ${days} 天 ${hours} 小時`;
          }
        } else {
          dueDateSpan.textContent = '無截止日期';
        }
      }

      li.replaceChild(span, inputText);
      li.replaceChild(dueDateSpan, inputDate);
      deleteBtn.style.display = 'inline-block';
    }

    // 只有當兩個欄位都失焦後才儲存
    let hasTextBlurred = false;
    let hasDateBlurred = false;

    function trySaveEdit() {
      if (hasTextBlurred && hasDateBlurred) {
        saveEdit();
      }
    }

    inputText.addEventListener('blur', () => {
      hasTextBlurred = true;
      trySaveEdit();
    });

    inputDate.addEventListener('blur', () => {
      hasDateBlurred = true;
      trySaveEdit();
    });

    inputText.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        hasTextBlurred = true;
        hasDateBlurred = true;
        saveEdit();
      } else if (e.key === 'Escape') {
        li.replaceChild(span, inputText);
        li.replaceChild(dueDateSpan, inputDate);
        deleteBtn.style.display = 'inline-block';
      }
    });

    inputDate.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        hasTextBlurred = true;
        hasDateBlurred = true;
        saveEdit();
      } else if (e.key === 'Escape') {
        li.replaceChild(span, inputText);
        li.replaceChild(dueDateSpan, inputDate);
        deleteBtn.style.display = 'inline-block';
      }
    });
  });

  // 同時更新任務文字與截止時間
  function updateTaskTextAndDate(id, newText, newDueDate) {
    if (!currentUserId) {
      alert('請先登入');
      return;
    }

    db.collection('users')
      .doc(currentUserId)
      .collection('tasks')
      .doc(id)
      .update({
        text: newText,
        dueDate: newDueDate || null
      })
      .then(() => {
        console.log('任務文字與截止日期已更新');
        loadTasks(); // 重新載入任務以更新倒數顯示
      })
      .catch(error => {
        console.error('更新任務內容錯誤：', error);
        alert('更新失敗，請稍後再試');
      });
  }

  // 新增倒數顯示區塊
  const dueDateSpan = document.createElement('span');
  dueDateSpan.style.marginLeft = 'auto';
  dueDateSpan.style.fontSize = '14px';
  dueDateSpan.style.color = '#888';

  /*if (dueDate instanceof Date && !isNaN(dueDate)) {
  function updateCountdown() {
    const now = new Date();
    const diff = dueDate - now;
    if (diff <= 0) {
      dueDateSpan.textContent = '已截止';
      clearInterval(intervalId);
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      dueDateSpan.textContent = `剩餘 ${days} 天 ${hours} 小時`;
    }
  }
  updateCountdown();
  const intervalId = setInterval(updateCountdown, 60 * 1000);
  } else {
    dueDateSpan.textContent = '無截止日期';
  }*/

  try {
  const now = new Date();
  const parsedDueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);

  if (!isNaN(parsedDueDate)) {
    function updateCountdown() {
      const diff = parsedDueDate - new Date();
      if (diff <= 0) {
        dueDateSpan.textContent = '已截止';
        clearInterval(intervalId);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        dueDateSpan.textContent = `剩餘 ${days} 天 ${hours} 小時`;
      }
    }
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 60 * 1000);
  } else {
    dueDateSpan.textContent = '無截止日期';
  }
} catch (e) {
  dueDateSpan.textContent = '已截止';
}

  // 文字跟完成狀態一起更新
  li.appendChild(circle);
  li.appendChild(span);
  li.appendChild(dueDateSpan);
  li.appendChild(deleteBtn);

  taskList.appendChild(li);
}

// 更新 Firestore 任務文字函式
function updateTaskText(id, newText) {
  if (!currentUserId) {
    alert('請先登入');
    return;
  }

  db.collection('users')
    .doc(currentUserId)
    .collection('tasks')
    .doc(id)
    .update({ text: newText })
    .then(() => {
      console.log('任務文字已更新:', newText);
    })
    .catch(error => {
      console.error('更新任務文字錯誤：', error);
      alert('更新失敗，請稍後再試');
    });
}

// 載入當前使用者任務
function loadTasks() {
  if (!currentUserId) return;

  db.collection('users') 
    .doc(currentUserId)
    .collection('tasks')
    .orderBy('createdAt', 'desc')
    .get()
    .then(snapshot => {
      taskList.innerHTML = ''; // 清空任務列表
      
      let completedCount = 0;
      let totalCount = snapshot.size;

      snapshot.forEach(doc => {
        const data = doc.data();
        addTaskToDOM(doc.id, data.text, data.completed, data.dueDate?.toDate?.());
        if (data.completed) completedCount++;
      });

      updateTaskProgress(completedCount, totalCount);
    })
    .catch(error => {
      console.error('載入任務錯誤：', error);
    });
}


// 切換任務完成狀態（可選）
function toggleTaskCompleted(id, completed, li) {
  if (!currentUserId) {
    alert('請先登入');
    return;
  }

  db.collection('users') 
    .doc(currentUserId)
    .collection('tasks')
    .doc(id)
    .update({ completed: completed })
    .then(() => {
      const circle = li.querySelector('.checkbox-circle'); 
      const span = li.querySelector('span');
      if (circle) circle.classList.toggle('checked', completed);
      if (span) span.style.textDecoration = completed ? 'line-through' : 'none'; // ✅ 切換文字刪除線
      db.collection('users')
        .doc(currentUserId)
        .collection('tasks')
        .get()
        .then(snapshot => {
          let completedCount = 0;
          const totalCount = snapshot.size;
          snapshot.forEach(doc => {
            if (doc.data().completed) completedCount++;
          });
          updateTaskProgress(completedCount, totalCount);
        });
    })
    .catch(error => {
      console.error('更新任務狀態錯誤：', error);
    });
}

window.addTask = addTask; // 確保 HTML onclick 可以找到這個函式




