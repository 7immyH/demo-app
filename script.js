let timeLeft = 25 * 60; // 25 minutes
let timerId = null;
let currentMode = 'work'; // 'work' or 'break'

const display = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timerId !== null) return;
    startBtn.textContent = 'Running...';
    startBtn.style.opacity = '0.7';

    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            new Notification('Pomodoro Timer', {
                body: currentMode === 'work' ? 'Time for a break!' : 'Back to work!'
            });
            switchMode(currentMode === 'work' ? 'break' : 'work');
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    startBtn.textContent = 'Start';
    startBtn.style.opacity = '1';
}

function resetTimer() {
    pauseTimer();
    timeLeft = currentMode === 'work' ? 25 * 60 : 5 * 60;
    updateDisplay();
}

function switchMode(mode) {
    currentMode = mode;
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Set appropriate background gradients based on mode
    if (mode === 'break') {
        document.body.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    resetTimer();
}

// Keep requesting notification permission
if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        switchMode(e.target.dataset.mode);
    });
});

// Initialize display
updateDisplay();
