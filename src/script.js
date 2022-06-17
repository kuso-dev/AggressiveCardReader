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

var cardReaderMode = {
    interval: 100
}

const suica = document.getElementById("suica");
const reader = document.getElementById("reader");
const overlay = document.getElementById("overlay");

const currentBalance = document.getElementById("current-balance");

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
            cardReaderMode.interval = 500;
            break
        case 'passive':
            cardReaderMode.interval = 10000000;
            break
        case 'insane':
            cardReaderMode.interval = 10;
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


// マウスカーソル追従
function startMouseStalking() {
    document.addEventListener("mousemove", (e) => {
        suica.style.opacity = 1;
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
                showOverlay();
            }
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
    console.log(p1, p2);
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
