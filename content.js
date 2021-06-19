(() => {
  // コピーボタン設置
  const navigation = document.querySelector('.navbar-menu');
  const button = document.createElement('button');
  button.innerHTML = '勤務時間から日報を生成してコピー';
  button.style.cssText =
    "height: 34px; color: yellow; background-color: transparent;order: 'none'; cursor: 'pointer'; outline: 'none'; padding: 0 11px; appearance: 'none'";
  navigation.appendChild(button);

  // 今日の年月日を取得
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  const thisDay = today.getDate();

  // 分から○h▲mの形に変換する関数
  const formattedTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // hh:mmからDateオブジェクトに変換する関数
  const dateFromTime = (time) => {
    times = time.split(':');
    return new Date(thisYear, thisMonth, thisDay, times[0], times[1]);
  };

  const showAndCopyDailyReport = () => {
    // モーダル開く
    const swButtons = document.querySelectorAll('.sw-button');
    const lastSwButtonIndex = swButtons.length - 1;
    const changeWorkTimeButton = swButtons[lastSwButtonIndex]; // 「打刻時刻を変更」ボタンが.sw-buttonの最後の要素だから成り立つ
    changeWorkTimeButton.click();
    const datetimes = document.querySelectorAll('.datetime');

    // 休憩時間を計算
    const stampingTypes = Array.from(document.querySelectorAll('.type')).map(
      (type) => type.innerText
    );
    // breakTimes: { start: Date, end: Date }[]
    const breakTimes = stampingTypes
      .map((type, index) => {
        if (type === '休憩開始') {
          return {
            start: dateFromTime(datetimes[index * 2].innerText),
            end: dateFromTime(datetimes[index * 2 + 2].innerText),
          };
        }
      })
      .filter((e) => e);

    // 休憩時間(分)を計算
    let breakTimeMilSeconds = 0;
    breakTimes.forEach((breakTime) => {
      const diff = breakTime.end - breakTime.start;
      breakTimeMilSeconds += diff;
    });
    const breakTimeMinutes = breakTimeMilSeconds / 60000;

    // (退勤時刻 - 出勤時刻) - 休憩時間から実働時間を計算
    const commutingTime = datetimes[0].innerText;
    const lastDatetimeIndex = datetimes.length - 2;
    const leaveTime = datetimes[lastDatetimeIndex].innerText;
    const commutingDate = dateFromTime(commutingTime);
    const leaveDate = dateFromTime(leaveTime);
    const workTimeMinutes =
      (leaveDate - commutingDate) / 60000 - breakTimeMinutes;

    // コピー内容
    const text = `# 本日の作業内容\n稼働時間: ${commutingTime} ~ ${leaveTime}\n- h \n休憩 ${formattedTime(
      breakTimeMinutes
    )}\n実働 ${formattedTime(workTimeMinutes)}\n\n# 明日の予定\n- `;

    // クリップボードにコピー
    const listener = function (e) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
      document.removeEventListener('copy', listener);
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    alert(`以下をクリップボードにコピーしました。\n${'-'.repeat(40)}\n${text}`);

    // モーダル閉じる
    const buttons = document.querySelectorAll('.btn');
    const lastButtonIndex = buttons.length - 1;
    const closeModalButton = buttons[lastButtonIndex];
    closeModalButton.click();
  };

  button.addEventListener('click', showWorkTime, false);
})();
