/* ─── Timer Script ─── */

const canvas    = document.getElementById('dialCanvas');
const ctx       = canvas.getContext('2d');
const timeDisp  = document.getElementById('timeDisplay');
const startBtn  = document.getElementById('startBtn');
const resetBtn  = document.getElementById('resetBtn');
const wrapper   = document.querySelector('.dial-wrapper');

const SIZE      = 260;
const CX        = SIZE / 2;
const CY        = SIZE / 2;
const RADIUS    = 92; //108;
const TICK_R    = 80; //98;
const MAX_SEC   = 3600; // 1 hour

// Colors (keep in sync with CSS vars for portability)
const COLOR_TRACK  = '#d4cdc4';
const COLOR_FILL   = '#d95f3b';
const COLOR_BORDER = '#2a2a35';
const COLOR_BG     = '#e8e1d5';
const COLOR_HAND   = '#2a2a35';

let totalSeconds  = 0;   // set time
let remaining     = 0;   // countdown
let intervalId    = null;
let isDragging    = false;
let isRunning     = false;

// ── Angle helpers ────────────────────────────────────────────
// 0 min = 12 o'clock = -π/2 rad, clockwise
function secToAngle(sec) {
  return (sec / MAX_SEC) * Math.PI * 2 - Math.PI / 2;
}

function drawLabels() {
  const labelData = [
    { min: 0,  text: '0'  },
    { min: 15, text: '15' },
    { min: 25, text: '25' },
    { min: 30, text: '30' },
    { min: 45, text: '45' },
    { min: 55, text: '55' },
  ];

  const labelRadius = RADIUS + 30; // 원에서 얼마나 떨어질지

  labelData.forEach(({ min, text }) => {
    const sec   = min * 60;
    const angle = secToAngle(sec);
    const x     = CX + Math.cos(angle) * labelRadius;
    const y     = CY + Math.sin(angle) * labelRadius;

    ctx.font         = "500 14px 'Special Elite', cursive";
    ctx.fillStyle    = '#1e1e28';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  });
}

// ── Draw ─────────────────────────────────────────────────────
function draw(sec) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  // outer ring bg
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS + 10, 0, Math.PI * 2);
  ctx.fillStyle = COLOR_BG;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = COLOR_BORDER;
  ctx.stroke();

  // track arc (full circle, light)
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2);
  ctx.lineWidth = 18;
  ctx.strokeStyle = COLOR_TRACK;
  ctx.stroke();

  // filled arc from 12 o'clock to current angle
  if (sec > 0) {
    const startA = -Math.PI / 2;
    const endA   = secToAngle(sec);
    ctx.beginPath();
    ctx.arc(CX, CY, RADIUS, startA, endA);
    ctx.lineWidth = 18;
    ctx.strokeStyle = COLOR_FILL;
    ctx.lineCap = 'butt';
    ctx.stroke();
  }

  // tick marks (every 5 min = 300 sec)
  for (let s = 0; s < MAX_SEC; s += 300) {
    const a = secToAngle(s);
    const isMajor = s % 900 === 0; // every 15 min = major
    const inner = isMajor ? TICK_R - 10 : TICK_R - 5;
    const outer = TICK_R + 2;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * inner, CY + Math.sin(a) * inner);
    ctx.lineTo(CX + Math.cos(a) * outer, CY + Math.sin(a) * outer);
    ctx.lineWidth   = isMajor ? 2 : 1.2;
    ctx.strokeStyle = COLOR_BORDER;
    ctx.stroke();
  }

  // hand  (thin line from center to rim)
  if (sec > 0) {
    const angle = secToAngle(sec);
    const handLen = RADIUS + 12;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + Math.cos(angle) * handLen, CY + Math.sin(angle) * handLen);
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = COLOR_HAND;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }
  drawLabels();
}

// ── Display ──────────────────────────────────────────────────
function updateDisplay(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  timeDisp.textContent =
    String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

// ── Pointer → seconds ────────────────────────────────────────
function pointerToSeconds(e) {
  const rect  = canvas.getBoundingClientRect();
  const scaleX = SIZE / rect.width;
  const scaleY = SIZE / rect.height;
  const x = (e.clientX - rect.left) * scaleX - CX;
  const y = (e.clientY - rect.top)  * scaleY - CY;
  let angle = Math.atan2(y, x) + Math.PI / 2; // offset so 0 = top
  if (angle < 0) angle += Math.PI * 2;
  let sec = Math.round((angle / (Math.PI * 2)) * MAX_SEC);
  // snap to 30-sec increments while dragging
  sec = Math.round(sec / 30) * 30;
  return Math.max(0, Math.min(MAX_SEC, sec));
}

// ── Drag to set ───────────────────────────────────────────────
wrapper.addEventListener('mousedown', onDown);
wrapper.addEventListener('touchstart', onDown, { passive: true });

function onDown(e) {
  if (isRunning) return;
  isDragging = true;
  applyDrag(e.touches ? e.touches[0] : e);
}

document.addEventListener('mousemove', onMove);
document.addEventListener('touchmove', onMove, { passive: true });
function onMove(e) {
  if (!isDragging) return;
  applyDrag(e.touches ? e.touches[0] : e);
}

document.addEventListener('mouseup',   () => { isDragging = false; });
document.addEventListener('touchend',  () => { isDragging = false; });

function applyDrag(e) {
  totalSeconds = pointerToSeconds(e);
  remaining    = totalSeconds;
  draw(remaining);
  updateDisplay(remaining);
}

// ── Tick ─────────────────────────────────────────────────────
function tick() {
  remaining--;
  if (remaining <= 0) {
    remaining = 0;
    stopTimer();
    draw(0);
    updateDisplay(0);
    onFinish();
    return;
  }
  draw(remaining);
  updateDisplay(remaining);
}

// ── Start / Stop / Reset ─────────────────────────────────────
startBtn.addEventListener('click', () => {
  if (remaining <= 0 && !isRunning) return;

  if (isRunning) {
    // pause
    clearInterval(intervalId);
    isRunning = false;
    startBtn.textContent = 'Start';
    startBtn.classList.remove('running');
  } else {
    // start
    isRunning = true;
    startBtn.textContent = 'Pause';
    startBtn.classList.add('running');
    intervalId = setInterval(tick, 1000);
  }
});

resetBtn.addEventListener('click', () => {
  stopTimer();
  totalSeconds = 0;
  remaining    = 0;
  draw(0);
  updateDisplay(0);
  startBtn.textContent = 'Start';
  startBtn.classList.remove('running');
});

function stopTimer() {
  clearInterval(intervalId);
  isRunning = false;
}

// ── Finish animation ─────────────────────────────────────────
function onFinish() {
  startBtn.textContent = 'Start';
  startBtn.classList.remove('running');
  // brief flash
  let count = 0;
  const flash = setInterval(() => {
    timeDisp.style.opacity = count % 2 === 0 ? '0.2' : '1';
    count++;
    if (count > 5) { clearInterval(flash); timeDisp.style.opacity = '1'; }
  }, 220);
}

// ── Init ─────────────────────────────────────────────────────
// draw(0);
// updateDisplay(0);

// ── Init ─────────────────────────────────────────────────────
document.fonts.ready.then(() => {
  draw(0);
  updateDisplay(0);
});