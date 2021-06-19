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

  // 「打刻時刻を変更」モーダルを開く関数
  const openModal = () => {
    const swButtons = document.querySelectorAll('.sw-button');
    const lastSwButtonIndex = swButtons.length - 1;
    const changeWorkTimeButton = swButtons[lastSwButtonIndex]; // 「打刻時刻を変更」ボタンが.sw-buttonの最後の要素だから成り立つ
    changeWorkTimeButton.click();
  };

  // hh:mmからDateオブジェクトに変換する関数
  const dateFromTime = (time) => {
    times = time.split(':');
    return new Date(thisYear, thisMonth, thisDay, times[0], times[1]);
  };

  // 休憩開始・休憩終了時刻のオブジェクトの配列を返す関数
  const breakTimeListFrom = (stampingTypes, datetimes) => {
    return stampingTypes
      .map((type, index) => {
        if (type === '休憩開始') {
          return {
            start: datetimes[index * 2],
            end: datetimes[index * 2 + 2],
          };
        }
      })
      .filter((e) => e);
  };

  // 休憩時間の合計(分)を計算する関数
  const breakTimeMinutesFrom = (breakTimeList) => {
    let breakTimeMilSeconds = 0;
    breakTimeList.forEach((breakTime) => {
      const diff = breakTime.end - breakTime.start;
      breakTimeMilSeconds += diff;
    });
    return breakTimeMilSeconds / 60000;
  };

  // Dateオブジェクトをhh:mmの時刻の形に変換する関数
  const digitalTimeFromDate = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // minutesから○h▲mの形に変換する関数
  const formattedTimeHM = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // (退勤時刻 - 出勤時刻) - 休憩時間から実働時間を計算する関数
  const formattedWorkTimeFrom = (
    commutingDatetime,
    leaveDatetime,
    breakTimeMinutes
  ) => {
    const wholeWorkTimeMinutes = (leaveDatetime - commutingDatetime) / 60000;
    const workTimeMinutes = wholeWorkTimeMinutes - breakTimeMinutes;
    return formattedTimeHM(workTimeMinutes);
  };

  // クリップボードにtextをコピーしてalertで表示する関数
  const copyToClipboard = (text) => {
    const listener = function (e) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
      document.removeEventListener('copy', listener);
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    alert(`以下をクリップボードにコピーしました。\n${'-'.repeat(40)}\n${text}`);
  };

  // 「打刻時刻を変更」モーダルを閉じる関数
  const closeModal = () => {
    const buttons = document.querySelectorAll('.btn');
    const lastButtonIndex = buttons.length - 1;
    const closeModalButton = buttons[lastButtonIndex]; // モーダル内の「キャンセル」ボタン
    closeModalButton.click();
  };

  // ボタンを押して時のメインの処理
  const showAndCopyDailyReport = () => {
    // 「打刻時刻を変更」モーダルを開く
    openModal();

    // 打刻時刻(Date)と打刻内容をモーダル内から取得
    const datetimes = Array.from(document.querySelectorAll('.datetime')).map(
      (datetime) => dateFromTime(datetime.innerText)
    );
    const stampingTypes = Array.from(document.querySelectorAll('.type')).map(
      (type) => type.innerText
    );

    // 休憩時間のリストを作成: breakTimeList: { start: Date, end: Date }[]
    const breakTimeList = breakTimeListFrom(stampingTypes, datetimes);

    // 休憩時間の合計を計算
    const breakTimeMinutes = breakTimeMinutesFrom(breakTimeList);

    // 出勤時刻と退勤時刻をDateオブジェクトとして取得
    const commutingDatetime = datetimes[0];
    const lastDatetimeIndex = datetimes.length - 2;
    const leaveDatetime = datetimes[lastDatetimeIndex];

    // 出勤時刻, 退勤時刻, 休憩時間から実働時間を計算
    const formattedWorkTime = formattedWorkTimeFrom(
      commutingDatetime,
      leaveDatetime,
      breakTimeMinutes
    );

    // 出勤時刻と退勤時刻をDateからhh:mmに変換
    const commutingTime = digitalTimeFromDate(commutingDatetime);
    const leaveTime = digitalTimeFromDate(leaveDatetime);
    const formattedBreakTime = formattedTimeHM(breakTimeMinutes);

    // 生成するテキストの内容
    const text = `# 本日の作業内容
稼働時間: ${commutingTime} ~ ${leaveTime}
- h
休憩 ${formattedBreakTime}
実働 ${formattedWorkTime}

# 明日の予定
- `;

    // クリップボードにコピーしてalertで表示
    copyToClipboard(text);

    // モーダル閉じる
    closeModal();
  };

  button.addEventListener('click', showAndCopyDailyReport, false);
})();
