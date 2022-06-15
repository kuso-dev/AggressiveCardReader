// SUICA決済フラグ
var isSettled = false;
// 決済音声用タイマー
var settleTimer;
// 衝突監視用タイマー
var observingTimer;
// 回避用タイマー
var escapingTimer;

const suica = document.getElementById("suica");
const reader = document.getElementById("reader");
const overlay = document.getElementById("overlay");

function onClickButton() {
    if (escapingTimer) {
        location.reload()
    }
    if (settleTimer || observingTimer) return

    if ("speechSynthesis" in window) {
        startMouseStalking()
        startSettleTimer()
        startObservingTimer()
    } else {
        window.alert("非対応端末です");
    }
}

// 決済音再生
function playSuicaSound() {
    const music = new Audio("src/sound/suica.mp3");
    music.play();
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
            playSuicaSound();
            clearInterval(settleTimer);
            clearInterval(observingTimer);
            setInterval(startEscapingTimer(), 10000);
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
        moveCardReader()
        const readerRect = new Rectangle(reader.getBoundingClientRect())
        const suicaRect = new Rectangle(suica.getBoundingClientRect())
        if (isOverlap(suicaRect, readerRect)) {
            playSuicaSound();
            clearInterval(escapingTimer);
            showOverlay();
        }
    }, 500);
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