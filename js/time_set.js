const pomodoroBtn  = document.getElementById('pomodoroBtn');
const endBtn       = document.getElementById('endBtn');
const countDisplay = document.getElementById('countDisplay');
const btn25m       = document.getElementById('25mBtn');
const btn5m        = document.getElementById('5mBtn');
const btn30m       = document.getElementById('30mBtn');

// 시간 세팅 버튼
function setTimer(minutes) {
  if (isRunning) return;
  totalSeconds = minutes * 60;
  remaining    = totalSeconds;
  draw(remaining);
  updateDisplay(remaining);
}

btn25m.addEventListener('click', () => setTimer(25));
btn5m.addEventListener('click',  () => setTimer(5));
btn30m.addEventListener('click', () => setTimer(30));

// 포모도로 카운트 (API 연동 전 임시)
pomodoroBtn.addEventListener('click', () => {
  // TODO: API 호출로 교체
  const current = parseInt(countDisplay.textContent) || 0;
  countDisplay.textContent = current + 1;
});

// END: 카운트 초기화
endBtn.addEventListener('click', () => {
  // TODO: API 초기화 호출로 교체
  countDisplay.textContent = 0;
});