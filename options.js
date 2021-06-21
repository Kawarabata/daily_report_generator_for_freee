(() => {
  // chrome.storageからオプションを取得して設定画面に反映
  chrome.storage.sync.get(['selectedFormat', 'routines'], (items) => {
    if (items.selectedFormat) {
      const selectedRadioButton = document.getElementById(items.selectedFormat);
      selectedRadioButton.checked = true;
    }

    if (items.routines) {
      const routines = JSON.parse(items.routines);
      const routineInputList = document.getElementsByClassName('routine-input');
      routines.forEach((routine, index) => {
        routineInputList[index].value = routine;
      });
    }
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

  // ルーティン業務の登録
  const saveRoutine = (event) => {
    const routineInputList = document.getElementsByClassName('routine-input');
    const routines = Array.from(routineInputList)
      .map((routine) => routine.value)
      .filter((routine) => routine);
    chrome.storage.sync.set({
      routines: JSON.stringify(routines),
    });
    alert('ルーティン業務を登録しました！');
    event.preventDefault();
  };

  const formatForm = document.getElementById('format-form');
  formatForm.addEventListener('submit', saveFormat, false);

  const routineForm = document.getElementById('routine-form');
  routineForm.addEventListener('submit', saveRoutine, false);
})();
