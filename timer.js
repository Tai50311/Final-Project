/*let timer, remainingSeconds = 0, isPaused = false;

const circleSlider = document.getElementById('circleSlider');
const circleTime = document.getElementById('circleTime');
const startBtn = document.getElementById('startTimerBtn');
const pauseBtn = document.getElementById('pauseTimerBtn');
const resetBtn = document.getElementById('resetTimerBtn');
//const runningAnimal = document.getElementById('runningAnimal');

// 根據滑桿值調整狗狗位置（滑動滑桿時）
function updateDogPosition() {
  const sliderRect = circleSlider.getBoundingClientRect();
  const sliderWidth = sliderRect.width;
  const value = circleSlider.value;
  // 計算狗狗位置，讓圖片中心對齊滑桿圓點
  const positionX = (value - circleSlider.min) / (circleSlider.max - circleSlider.min) * sliderWidth;
  // 加上調整值（正數往右，負數往左）
  //const offset = -10; // 你可以調整這個數字，試著找到最適合的位移
  //positionX += offset;
  runningAnimal.style.left = `${positionX+200}px`;
}

// 根據倒數進度調整狗狗位置（倒數計時時）
function updateAnimalPosition(progress) {
  const sliderRect = circleSlider.getBoundingClientRect();
  const sliderWidth = sliderRect.width;
  // progress 從 0（開始）到 1（結束）
  // 狗狗從最右側滑到最左側
  const positionX = sliderWidth * (1 - progress);
  runningAnimal.style.left = `${positionX}px`;
}

// 初始化狗狗位置
updateDogPosition();
// 滑桿拖動時更新狗狗位置
circleSlider.addEventListener('input', () => {
  // 同時更新時間文字
  const minutes = parseInt(circleSlider.value);
  circleTime.textContent = `${minutes.toString().padStart(2, '0')}:00`;
  updateDogPosition();
});

function startTimer() {
  const minutes = parseInt(circleSlider.value);
  if (isNaN(minutes) || minutes <= 0) return;

  remainingSeconds = minutes * 60;
  updateCircleDisplay(remainingSeconds);
  toggleTimerUI("running");
  updateAnimalPosition(0); // 起點位置

  clearInterval(timer);
  timer = setInterval(() => {
    if (!isPaused) {
      remainingSeconds--;
      updateCircleDisplay(remainingSeconds);
      // 傳入剩餘時間比例，更新狗狗位置
      updateAnimalPosition(remainingSeconds / (minutes * 60));
      if (remainingSeconds < 0) {
        clearInterval(timer);
        circleTime.textContent = "時間到 🍵";
        toggleTimerUI("stopped");
        updateAnimalPosition(1); // 終點位置
      }
    }
  }, 1000);
}

function pauseTimer() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "繼續" : "暫停";
}

function resetTimer() {
  clearInterval(timer);
  isPaused = false;
  pauseBtn.textContent = "暫停";
  toggleTimerUI("stopped");
  circleTime.textContent = `${circleSlider.value.toString().padStart(2, '0')}:00`;
  updateAnimalPosition(0); // 重設狗狗回起點
}

function updateCircleDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  circleTime.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function toggleTimerUI(state) {
  if (state === "running") {
    circleSlider.style.display = "none";
    startBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
    resetBtn.style.display = "inline-block";
  } else {
    circleSlider.style.display = "block";
    startBtn.style.display = "inline-block";
    pauseBtn.style.display = "none";
    resetBtn.style.display = "none";
  }
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);*/
let timer, remainingSeconds = 0, isPaused = false;

const circleSlider = document.getElementById('circleSlider');
const circleTime = document.getElementById('circleTime');
const startBtn = document.getElementById('startTimerBtn');
const pauseBtn = document.getElementById('pauseTimerBtn');
const resetBtn = document.getElementById('resetTimerBtn');
const restartBtn = document.getElementById('restartTimerBtn');

// 滑桿拖動時更新時間文字
circleSlider.addEventListener('input', () => {
  const minutes = parseInt(circleSlider.value);
  circleTime.textContent = `${minutes.toString().padStart(2, '0')}:00`;
});

function startTimer() {
  const minutes = parseInt(circleSlider.value);
  if (isNaN(minutes) || minutes <= 0) return;

  remainingSeconds = minutes * 60;
  updateCircleDisplay(remainingSeconds);
  toggleTimerUI("running");

  clearInterval(timer);
  timer = setInterval(() => {
    if (!isPaused) {
      remainingSeconds--;
      updateCircleDisplay(remainingSeconds);

      if (remainingSeconds < 0) {
        clearInterval(timer);
        circleTime.textContent = "時間到!";
        toggleTimerUI("finished");
        saveFocusSession(minutes); 
      }
    }
  }, 1000);
}

function pauseTimer() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "繼續" : "暫停";
}

function resetTimer() {
  clearInterval(timer);
  isPaused = false;
  pauseBtn.textContent = "暫停";
  toggleTimerUI("stopped");
  circleTime.textContent = `${circleSlider.value.toString().padStart(2, '0')}:00`;
}

function updateCircleDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  circleTime.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function toggleTimerUI(state) {
  if (state === "running") {
    circleSlider.style.display = "none";
    startBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
    resetBtn.style.display = "inline-block";
    restartBtn.style.display = "none";
  }else if (state === "stopped") {
    circleSlider.style.display = "block";
    startBtn.style.display = "inline-block";
    pauseBtn.style.display = "none";
    resetBtn.style.display = "none";
    restartBtn.style.display = "none";
  } else if (state === "finished") {
    // 倒數完成後的畫面
    circleSlider.style.display = "none";
    startBtn.style.display = "none";
    pauseBtn.style.display = "none";
    resetBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
  }
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

// 當倒數完成（或專注結束）時，儲存紀錄
/*async function saveFocusSession(minutesFocused) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, "users", user.uid, "focusSessions"), {
      duration: minutesFocused,             // 專注幾分鐘
      timestamp: serverTimestamp()          // 系統時間
    });
    console.log("專注紀錄已儲存");
  } catch (e) {
    console.error("無法儲存專注紀錄：", e);
  }
}*/

restartBtn.addEventListener("click", () => {
  // 恢復 UI 成初始狀態
  toggleTimerUI("stopped");
  circleTime.textContent = `${circleSlider.value.toString().padStart(2, '0')}:00`;
});
async function saveFocusSession(minutesFocused) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await db.collection("users")
      .doc(user.uid)
      .collection("focusSessions")
      .add({
        duration: minutesFocused,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    console.log("專注紀錄已儲存");
  } catch (e) {
    console.error("無法儲存專注紀錄：", e);
  }
}
