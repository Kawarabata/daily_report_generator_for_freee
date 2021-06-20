(() => {
  // オプションを取得して設定画面に反映
  chrome.storage.sync.get(['selectedFormat'], (items) => {
    if (!items.selectedFormat) return;

    const selectedElement = document.getElementById(items.selectedFormat);
    selectedElement.checked = true;
  });

  // 日報フォーマットの保存
  const saveFormat = (event) => {
    const selectedFormat = document.getElementById('format-form').format.value;
    chrome.storage.sync.set({
      selectedFormat,
    });
    alert('日報の形式を保存しました！');
    event.preventDefault();
  };
  const formatForm = document.getElementById('format-form');
  formatForm.addEventListener('submit', saveFormat, false);
})();
