(() => {
  const dayNames = [
    'everyday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ];

  // chrome.storageからオプションを取得して設定画面に反映
  chrome.storage.sync.get([...dayNames, 'selectedFormat'], (items) => {
    if (items.selectedFormat) {
      const selectedRadioButton = document.getElementById(items.selectedFormat);
      selectedRadioButton.checked = true;
    }

    dayNames.forEach((dayName) => {
      if (items[dayName]) {
        const routines = JSON.parse(items[dayName]);
        const routineInputList = document.getElementsByClassName(dayName);
        routines.forEach((routine, index) => {
          routineInputList[index].value = routine;
        });
      }
    });
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

  // ルーティンをchrome.storageに保存
  const saveRoutineToStorage = (routineInputList, dayName) => {
    const routines = Array.from(routineInputList)
      .map((routine) => routine.value)
      .filter((routine) => routine);
    chrome.storage.sync.set({
      [dayName]: JSON.stringify(routines),
    });
  };

  // ルーティン業務の登録
  function saveRoutine(event) {
    const routineInputList = document.getElementsByClassName(this.className);
    saveRoutineToStorage(routineInputList, this.className);
    alert('ルーティン業務を登録しました！');
    event.preventDefault();
  }

  dayNames.forEach((dayName) => {
    const target = document.getElementById(dayName);
    target.addEventListener('click', {
      className: dayName,
      handleEvent: saveRoutine,
    });
  });

  const formatForm = document.getElementById('format-form');
  formatForm.addEventListener('submit', saveFormat, false);
})();
