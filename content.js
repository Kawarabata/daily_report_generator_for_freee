(() => {
  // コピーボタン設置
  const navigation = document.querySelector('.main-menu');
  const button = document.createElement('button');
  button.innerHTML = '日報を生成';
  button.style.cssText = `
    height: 48px;
    padding: 0 16px;
    color: #ffff80;
    background-color: #4e74ea;
    border: none;
    font-size: 16px;
    font-weight: bold;`;
  navigation.appendChild(button);

  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  // 今日の年月日と曜日を取得
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  const thisDate = today.getDate();
  const thisDay = days[today.getDay()];

  // 明日の年月日と曜日を取得
  let tomorrow = new Date();
  const isFriday = () => thisDay === 'friday';
  if (isFriday()) {
    tomorrow.setDate(tomorrow.getDate() + 3);
  } else {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  const tomorrowMonth = tomorrow.getMonth();
  const tomorrowDate = tomorrow.getDate();
  const tomorrowDay = days[tomorrow.getDay()];

  // 「打刻時刻を変更」モーダルを開く関数
  const openModal = () => {
    const swButtons = document.querySelectorAll('.sw-button');
    const lastSwButtonIndex = swButtons.length - 1;
    const changeWorkTimeButton = swButtons[lastSwButtonIndex]; // 「打刻時刻を変更」ボタンはsw-buttonの最後の要素のはず
    changeWorkTimeButton.click();
  };

  // hh:mmからDateオブジェクトに変換する関数
  const dateFromTime = (time) => {
    times = time.split(':');
    return new Date(thisYear, thisMonth, thisDate, times[0], times[1]);
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
      .filter((type) => type);
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

  // ルーティン一覧のテキストを返す関数
  const routinesFrom = (everydayRoutines, dayRoutines) => {
    if (everydayRoutines || dayRoutines) {
      let routines = [];
      if (everydayRoutines) {
        routines = [...routines, ...JSON.parse(everydayRoutines)];
      }
      if (dayRoutines) {
        routines = [...routines, ...JSON.parse(dayRoutines)];
      }
      return routines.map((routine) => `- ${routine}`).join('\n');
    } else {
      return '- ';
    }
  };

  // optionsのitems.selectedFormatの内容から、開発部風フォーマットである場合trueを返す関数
  const isDevFormat = (selectedFormat) => {
    return selectedFormat === undefined || selectedFormat === 'dev';
  };

  const textFrom = (
    selectedFormat,
    todayRoutines,
    tomorrowRoutines,
    timeParams
  ) => {
    if (isDevFormat(selectedFormat)) {
      // 開発部風
      return (
        '# 本日の作業内容\n' +
        `稼働時間: ${timeParams.commute} ~ ${timeParams.leave}\n` +
        `${todayRoutines}\n` +
        `休憩: ${timeParams.break}\n` +
        `実働: ${timeParams.work}\n` +
        `\n` +
        '# 明日の予定\n' +
        `${tomorrowRoutines}`
      );
    } else if (selectedFormat === 'biz') {
      // Biz風
      return (
        `# ${thisMonth + 1}/${thisDate}の作業内容\n` +
        `稼働時間 ${timeParams.commute}~${timeParams.leave}（実働 ${timeParams.work})\n` +
        `${todayRoutines}\n` +
        '\n' +
        `# ${tomorrowMonth + 1}/${tomorrowDate}の作業予定\n` +
        `${tomorrowRoutines}`
      );
    } else {
      alert('すみません、日報を生成できませんでした...');
    }
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
    const closeModalButton = buttons[lastButtonIndex]; // モーダル内の「キャンセル」ボタンのはず
    closeModalButton.click();
  };

  // ボタンを押した時のメインの処理
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
    const timeParams = {
      commute: commutingTime,
      leave: leaveTime,
      break: formattedBreakTime,
      work: formattedWorkTime,
    };

    // optionsで設定した内容をチェックしてフォーマットに反映
    chrome.storage.sync.get(
      ['selectedFormat', 'everyday', thisDay, tomorrowDay],
      (items) => {
        const todayRoutines = routinesFrom(items['everyday'], items[thisDay]);
        const tomorrowRoutines = routinesFrom(
          items['everyday'],
          items[tomorrowDay]
        );
        const text = textFrom(
          items.selectedFormat,
          todayRoutines,
          tomorrowRoutines,
          timeParams
        );

        if (text) {
          // クリップボードにコピーしてalertで表示
          copyToClipboard(text);
        }
      }
    );

    // 「打刻時刻を変更」モーダルを閉じる
    closeModal();
  };

  button.addEventListener('click', showAndCopyDailyReport, false);
})();
