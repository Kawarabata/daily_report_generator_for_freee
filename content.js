(function () {
  const navigation = document.querySelector('.navbar-menu');
  const button = document.createElement('button');
  button.innerHTML = '稼働時間・休憩時間・実働時間をコピー';
  button.style.cssText =
    "height: 34px; color: yellow; background-color: transparent;order: 'none'; cursor: 'pointer'; outline: 'none'; padding: 0 11px; appearance: 'none'";
  button.id = 'copy-work-time';
  navigation.appendChild(button);

  const showWorkTime = () => {
    const changeWorkTimeButton = document.querySelectorAll('.sw-button')[2];
    changeWorkTimeButton.click();
  };

  button.addEventListener('click', showWorkTime, false);
})();
