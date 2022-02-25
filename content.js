const DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

// 今日のDate
let today = new Date();
// 昼12時より前なら昨日の日報を書いているものとする
if (today.getHours() < 12) {
  today.setDate(today.getDate() - 1);
}
// 今日の年月日と曜日を取得
const thisYear = today.getFullYear();
const thisMonth = today.getMonth();
const thisDate = today.getDate();
const thisDay = DAYS[today.getDay()];

// 明日のDate
let tomorrow = new Date();
// 昼12時より前なら昨日の日報を書いているものとする
if (tomorrow.getHours() < 12) {
  tomorrow.setDate(tomorrow.getDate() - 1);
}

// 今日が金曜日ならtomorrowを月曜日とする
if (thisDay === 'friday') {
  tomorrow.setDate(tomorrow.getDate() + 3);
} else {
  tomorrow.setDate(tomorrow.getDate() + 1);
}

// 明日の年月日と曜日を取得
const tomorrowYear = tomorrow.getFullYear();
const tomorrowMonth = tomorrow.getMonth();
const tomorrowDate = tomorrow.getDate();
const tomorrowDay = DAYS[tomorrow.getDay()];

class WorkTimeScraper {
  // 休憩時間のリストを作成: breakTimeList: { start: Date, end: Date }[]
  get breakTimeList() {
    return this.#stampingTypeList
      .map((type, index) => {
        if (type === '休憩開始') {
          return {
            start: this.#timeList[index],
            end: this.#timeList[index + 1],
          };
        }
      })
      .filter((type) => type);
  }

  get commutingDatetime() {
    return this.#timeList[0];
  }

  get leaveDatetime() {
    return this.#timeList[this.#timeList.length - 1];
  }

  get #timeList() {
    return this.#timeElements.map((time) =>
      this.#dateFromTime(time.textContent)
    );
  }

  get #stampingTypeList() {
    return this.#stampingTypeElements.map((type) => type.textContent);
  }

  // 打刻時刻(Date)と打刻内容をモーダル内から取得
  get #timeElements() {
    return this.#tableCellElements.filter((el) => {
      return (this.#tableCellElements.indexOf(el) + 3) % 4 === 0; // #tableCellElementsの4n-3(n:自然数) 番目の要素を取得する
    });
  }

  get #stampingTypeElements() {
    return this.#tableCellElements.filter((el) => {
      return (this.#tableCellElements.indexOf(el) % 4) / 4 === 0; // #tableCellElementsの4n-4(n:自然数) 番目の要素を取得する
    });
  }

  get #tableCellElements() {
    return Array.from(
      document.querySelectorAll('.vb-tableListCell__text') // 「打刻時刻の修正」モーダル内のテーブルセルは'.vb-tableListCell__text'クラスのはず
    );
  }

  // hh:mmからDateオブジェクトに変換する関数
  get #dateFromTime() {
    return (time) => {
      const [hours, minutes] = time.split(':');
      // 0時〜6時の場合は退勤が日を跨いだと見なし、翌日扱いにする
      const dateParams =
        Number(hours) < 6
          ? [tomorrowYear, tomorrowMonth, tomorrowDate, hours, minutes]
          : [thisYear, thisMonth, thisDate, hours, minutes];
      return new Date(...dateParams);
    };
  }
}

class WorkTimeCalculator {
  constructor({ commutingDatetime, leaveDatetime, breakTimeList }) {
    this.commutingDatetime = commutingDatetime;
    this.leaveDatetime = leaveDatetime;
    this.breakTimeList = breakTimeList;
  }

  get workTimeMinutes() {
    const wholeWorkTimeMinutes =
      (this.leaveDatetime - this.commutingDatetime) / 60000;
    return wholeWorkTimeMinutes - this.breakTimeMinutes;
  }

  get breakTimeMinutes() {
    let breakTimeMilSeconds = 0;
    this.breakTimeList.forEach((breakTime) => {
      const diff = breakTime.end - breakTime.start;
      breakTimeMilSeconds += diff;
    });
    return breakTimeMilSeconds / 60000;
  }
}

class WorkTimeFormatter {
  constructor({
    commutingDatetime,
    leaveDatetime,
    breakTimeMinutes,
    workTimeMinutes,
  }) {
    this.commutingDatetime = commutingDatetime;
    this.leaveDatetime = leaveDatetime;
    this.breakTimeMinutes = breakTimeMinutes;
    this.workTimeMinutes = workTimeMinutes;
  }

  // 出勤時刻と退勤時刻をDateからhh:mmに変換
  get commutingTime() {
    return this.#digitalTimeFromDate(this.commutingDatetime);
  }

  get leaveTime() {
    return this.#digitalTimeFromDate(this.leaveDatetime);
  }

  get breakTime() {
    return this.#formattedTimeHM(this.breakTimeMinutes);
  }

  get workTime() {
    return this.#formattedTimeHM(this.workTimeMinutes);
  }

  // Dateオブジェクトをhh:mmの時刻の形に変換する関数
  get #digitalTimeFromDate() {
    return (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
  }

  // minutesから○h▲mの形に変換する関数
  get #formattedTimeHM() {
    return (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };
  }
}

class DailyReportGenerator {
  constructor({
    selectedFormat,
    todayRoutines,
    tomorrowRoutines,
    workTimeParams,
  }) {
    this.selectedFormat = selectedFormat;
    this.todayRoutines = todayRoutines;
    this.tomorrowRoutines = tomorrowRoutines;
    this.workTimeParams = workTimeParams;
  }

  generateReport() {
    if (this.#isDevFormat) {
      // 開発部風
      return (
        '# 本日の作業内容\n' +
        `稼働時間: ${this.workTimeParams.commute} ~ ${this.workTimeParams.leave}\n` +
        `${this.todayRoutines}\n` +
        `休憩: ${this.workTimeParams.break}\n` +
        `実働: ${this.workTimeParams.work}\n` +
        `\n` +
        '# 明日の予定\n' +
        `${this.tomorrowRoutines}`
      );
    } else if (this.#isBizFormat) {
      // Biz風
      return (
        `# ${thisMonth + 1}/${thisDate}の作業内容\n` +
        `稼働時間 ${this.workTimeParams.commute}~${this.workTimeParams.leave}（実働 ${this.workTimeParams.work})\n` +
        `${this.todayRoutines}\n` +
        '\n' +
        `# ${tomorrowMonth + 1}/${tomorrowDate}の作業予定\n` +
        `${this.tomorrowRoutines}`
      );
    } else {
      alert('すみません、日報を生成できませんでした...');
    }
  }

  get #isDevFormat() {
    return this.selectedFormat === undefined || this.selectedFormat === 'dev';
  }

  get #isBizFormat() {
    return this.selectedFormat === 'biz';
  }
}

(() => {
  // 「日報を生成」ボタン設置
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

  // 「打刻時刻を修正」モーダルを開く関数
  const openModal = () => {
    const changeWorkTimeButton = Array.prototype.slice
      .call(document.querySelectorAll('button'))
      .find((el) => {
        return el.textContent === '打刻時刻を修正';
      });
    changeWorkTimeButton.click();
  };

  // 「打刻時刻を変更」モーダルを閉じる関数
  const closeModal = () => {
    const closeModalButton = Array.prototype.slice
      .call(document.querySelectorAll('button'))
      .find((el) => {
        return el.textContent === 'キャンセル';
      });
    closeModalButton.click();
  };

  // クリップボードにtextをコピーする関数
  const copyToClipboard = (text) => {
    const listener = function (e) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
      document.removeEventListener('copy', listener);
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
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

  const showAndCopyDailyReport = () => {
    openModal();

    const workTimeScraper = new WorkTimeScraper();
    const workTimeCalculator = new WorkTimeCalculator({
      commutingDatetime: workTimeScraper.commutingDatetime,
      leaveDatetime: workTimeScraper.leaveDatetime,
      breakTimeList: workTimeScraper.breakTimeList,
    });

    const workTimeFormatter = new WorkTimeFormatter({
      commutingDatetime: workTimeScraper.commutingDatetime,
      leaveDatetime: workTimeScraper.leaveDatetime,
      breakTimeMinutes: workTimeCalculator.breakTimeMinutes,
      workTimeMinutes: workTimeCalculator.workTimeMinutes,
    });

    const workTimeParams = {
      commute: workTimeFormatter.commutingTime,
      leave: workTimeFormatter.leaveTime,
      break: workTimeFormatter.breakTime,
      work: workTimeFormatter.workTime,
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
        const dailyReportGenerator = new DailyReportGenerator({
          selectedFormat: items.selectedFormat,
          todayRoutines,
          tomorrowRoutines,
          workTimeParams,
        });
        const dailyReportText = dailyReportGenerator.generateReport();

        if (dailyReportText) {
          copyToClipboard(dailyReportText);
          alert(
            `以下をクリップボードにコピーしました。\n${'-'.repeat(
              40
            )}\n${dailyReportText}`
          );
        }
      }
    );

    // 「打刻時刻を変更」モーダルを閉じる
    closeModal();
  };

  button.addEventListener('click', showAndCopyDailyReport, false);
})();
