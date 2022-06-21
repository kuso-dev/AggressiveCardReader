const MODE_AGGRESSIVE = 500
const MODE_PASSIVE = 10000000
const MODE_INSANE = 10

const suica = document.getElementById("suica");
const reader = document.getElementById("reader");
const sideMenu = document.getElementById("side-menu");
const overlay = document.getElementById("overlay");

const currentBalance = document.getElementById("current-balance");
const surviveTime = document.getElementById("survive");
const score = document.getElementById("score");

// SUICA決済フラグ
var isSettled = false;
// 決済音声用タイマー
var settleTimer;
// 衝突監視用タイマー
var observingTimer;
// 回避用タイマー
var escapingTimer;
// 残高
var balance = 200;
// 生存期間
var survive = 0;

var cardReaderMode = {
    interval: MODE_AGGRESSIVE
}


function onClickButton() {
    if (settleTimer || observingTimer) return

    if ("speechSynthesis" in window) {
        startMouseStalking()
        startSettleTimer()
        startObservingTimer()
    } else {
        window.alert("非対応端末です");
    }
}

function onSelectBalance(value) {
    balance = parseFloat(value);
    setCurrentBalance(value)
}

function onSelectCardReaderMode(value) {
    switch (value) {
        case 'aggressive':
            cardReaderMode.interval = MODE_AGGRESSIVE;
            break
        case 'passive':
            cardReaderMode.interval = MODE_PASSIVE;
            break
        case 'insane':
            cardReaderMode.interval = MODE_INSANE;
    }
}

function onClickReStartButton() {
    location.reload()
}

// 決済音再生
function playSuicaSound() {
    const music = new Audio("src/sound/suica.mp3");
    music.play();
}

function setCurrentBalance(value) {
    currentBalance.textContent = `¥${value}`
}

function setSurviveTime(value) {
    surviveTime.textContent = `${value / 1000}秒`
}

function setScore() {
    switch (cardReaderMode.interval) {
        case MODE_PASSIVE:
            score.textContent = '水出し麦茶級'
            break
        case MODE_AGGRESSIVE:
            score.textContent = '水出し麦茶級'
            break
        case MODE_INSANE:
            score.textContent = '水出し麦茶級'
            break
    }
}


// マウスカーソル追従
function startMouseStalking() {
    suica.style.opacity = 1;
    document.addEventListener("mousemove", (e) => {
        const suicaRect = new Rectangle(suica.getBoundingClientRect())
        const sideMenuRect = new Rectangle(sideMenu.getBoundingClientRect())
        if (isOverlap(suicaRect, sideMenuRect)) {
            suica.style.transform = "translate(50%, 50%)";
            return
        }
        suica.style.transform =
            "translate(" + e.clientX + "px, " + e.clientY + "px)";
    });
}

// カードリーダー動作
function moveCardReader() {
    x = Math.random() * 100
    y = Math.random() * 100
    reader.style.left = `calc(${x}% - 200px)`;
    reader.style.top = `calc(${y}% - 200px)`;
}

// 決済開始
function startSettleTimer() {
    const headline = document.getElementById("headline");
    headline.textContent = "音が鳴るまでカードをタッチしてください";
    const uttr = new SpeechSynthesisUtterance(headline.textContent);
    const speech = () => {
        window.speechSynthesis.speak(uttr);
    }
    speech()
    settleTimer = setInterval(speech, 10000);
}

// 決済監視
function startObservingTimer() {
    observingTimer = setInterval(() => {
        const readerRect = new Rectangle(reader.getBoundingClientRect())
        const suicaRect = new Rectangle(suica.getBoundingClientRect())
        if (isOverlap(suicaRect, readerRect)) {
            balance -= 200;
            setCurrentBalance(balance)
            playSuicaSound();
            clearInterval(settleTimer);
            clearInterval(observingTimer);
            setTimeout(() => {
                setInterval(startEscapingTimer(), 10000);
            }, 1000)
        }
    }, 100);
}

// 回避監視
function startEscapingTimer() {
    const headline = document.getElementById("headline");
    headline.textContent = "音が鳴らないようカードをタッチしないでください";
    const uttr = new SpeechSynthesisUtterance(headline.textContent);
    const speech = () => {
        window.speechSynthesis.speak(uttr);
    }
    speech()
    escapingTimer = setInterval(() => {
        const readerRect = new Rectangle(reader.getBoundingClientRect())
        const suicaRect = new Rectangle(suica.getBoundingClientRect())
        if (isOverlap(suicaRect, readerRect)) {
            playSuicaSound();
            balance -= 200;
            setCurrentBalance(balance)
            if (balance < 0) {
                clearInterval(escapingTimer);
                setScore()
                showOverlay();
            }
        } else {
            survive += 100;
            setSurviveTime(survive);
        }
    }, 100);
    setInterval(moveCardReader, cardReaderMode.interval);
}

// ゲームオーバー
function showOverlay() {
    overlay.style.visibility = "visible";
    overlay.style.zIndex = 999;
    overlay.animate(
        [
            { opacity: 0 },
            { opacity: 0.9 }
        ],
        {
            duration: 1500,
            fill: "forwards"
        }
    );
}

// 重なり判定
function isOverlap(p1, p2) {
    return ((Math.max(p1.lb.x, p2.lb.x) < Math.min(p1.rt.x, p2.rt.x))
        && Math.min(p1.lb.y, p2.lb.y) > (Math.max(p1.rt.y, p2.rt.y)))
}

class Rectangle {
    constructor(domRect) {
        const { x, y, width, height } = domRect
        this.rt = {
            x: x + width,
            y
        }
        this.lb = {
            x,
            y: y + height
        }
    }
}
