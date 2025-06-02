document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  const navButtons = document.querySelectorAll('#sidebar .nav-btn');

  // 設為全域，讓其他檔案也能用
  window.showPage = function(pageId) {
    pages.forEach(page => {
      page.style.display = page.id === 'page-' + pageId ? 'block' : 'none';

      // 如果有 timer 的清理函式，切換頁面時呼叫
      if (typeof stopTimer === 'function' && page.id !== 'page-timer') {
        stopTimer();
      }
    });
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const page = btn.getAttribute('data-page');
      window.showPage(page);
    });
  });

  // 預設載入 timer 頁面
  window.showPage('timer');
});
