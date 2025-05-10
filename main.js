
const params = new URLSearchParams(window.location.search);
let teacher_name = params.get('teacher');   // 'apple'
if (!teacher_name) {
    requestAnimationFrame(draw)
    requestAnimationFrame(function () {
        stamps = load_json()
        document.querySelector('#stamp_chosing').style.display = "none"
    })
}
let pushed = false;
const class_index = [
    "red", "yellow", "blue", "green"
]
const colors = [
    'rgba(255, 204, 204, 1)',
    'rgba(255, 255, 204, 1)',
    'rgba(204, 204, 255, 1)',
    'rgba(204, 255, 204, 1)'
];
let index = 0;
let color_ = null;
const box = document.querySelector('.grid-container');
const myDialog = document.querySelector('.myDialog');
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const hanko = new Audio('投げハンコワイプアウト付き.wav');
const hako = new Audio('takarabako.wav');
const bingo_sound = new Audio('たんたらららーん.mp3');
const lineLength = 400; // 線の長さ
const maxSpeed = 5; // 最大スピード
const lineStarts = [100, 200, 300]; // 各線のY座標
let NotStamped = true;
let isAbleToStamp = false;
let stamp = { "x": 0, "y": 0, "rotate": 0, "frame": 0 }
let x = [0, 0, 0]; // 3本の線のX座標（進行する位置）
let speeds = [maxSpeed, maxSpeed, maxSpeed]; // 3本の線の速度
let startTimes = [2000, 2100, 2200]; // 各線の描画開始時間（0.2秒ごと）
let stamps;
// スムージング設定
ctx.lineWidth = 5; // 線の太さ
ctx.lineJoin = 'round'; // 角を丸く
ctx.lineCap = 'round'; // 線の終わりを丸く
function countBingoLinesWithColors(items) {
    const gridSize = 4;
    const cellSize = 100;

    // 4x4のビンゴ表をfalseで初期化
    const board = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill(false)
    );

    // 各マスの色も保持
    const colorBoard = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill(null)
    );

    // 中心座標からマス番号を計算（x-50, y-50してから割る）
    items.forEach(({ x, y, color }) => {
        const col = Math.floor((x - 50) / cellSize);
        const row = Math.floor((y - 50) / cellSize);
        if (
            row >= 0 && row < gridSize &&
            col >= 0 && col < gridSize
        ) {
            board[row][col] = true;
            colorBoard[row][col] = color; // 色を記録
        }
    });

    let bingoCount = 0;
    const bingoColors = []; // 同色ビンゴを格納

    // 横チェック
    for (let row = 0; row < gridSize; row++) {
        if (board[row].every(cell => cell)) {
            bingoCount++;
            // 同色かどうか確認
            const firstColor = colorBoard[row][0];
            if (colorBoard[row].every(color => color === firstColor)) {
                bingoColors.push({ line: 'row', index: row, color: firstColor });
            }
        }
    }

    // 縦チェック
    for (let col = 0; col < gridSize; col++) {
        if (board.every(row => row[col])) {
            bingoCount++;
            // 同色かどうか確認
            const firstColor = colorBoard[0][col];
            if (colorBoard.every(row => row[col] === firstColor)) {
                bingoColors.push({ line: 'col', index: col, color: firstColor });
            }
        }
    }

    // 斜め（左上→右下）
    if (Array.from({ length: gridSize }, (_, i) => board[i][i]).every(cell => cell)) {
        bingoCount++;
        const firstColor = colorBoard[0][0];
        if (Array.from({ length: gridSize }, (_, i) => colorBoard[i][i]).every(color => color === firstColor)) {
            bingoColors.push({ line: 'diag1', color: firstColor });
        }
    }

    // 斜め（右上→左下）
    if (Array.from({ length: gridSize }, (_, i) => board[i][gridSize - 1 - i]).every(cell => cell)) {
        bingoCount++;
        const firstColor = colorBoard[0][gridSize - 1];
        if (Array.from({ length: gridSize }, (_, i) => colorBoard[i][gridSize - 1 - i]).every(color => color === firstColor)) {
            bingoColors.push({ line: 'diag2', color: firstColor });
        }
    }

    return { bingoCount, bingoColors }; // ビンゴ列数と色別ビンゴのリスト
}

function toMainMenu() {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.replace(cleanUrl);
}
function save_json(data, key = "json") {
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
}
function load_json(key = "json") {
    const jsonData = localStorage.getItem(key);
    return jsonData ? JSON.parse(jsonData) : null;
}
if (!load_json()) { // 初期設定
    save_json([]);
    localStorage.setItem("bingo", 0)
    localStorage.setItem("bingoc", 0)
}
function reset_button() {
    if (confirm('これまでのデータがすべて削除されます。本当にいいですか?')) {
        save_json([]);
        location.reload();
    }
}
function display_change() {
    $('#stamp_chosing').fadeOut(500);


    stamps = load_json()
    setTimeout(draw, 1000); // 最初の描画を呼び出し
}
function card_clicked(color) {
    if (!pushed) {
        color_ = color
        clearInterval(intervalId)
        if (color == class_index[document.querySelector("label.color").innerHTML]) {
            document.querySelector("h2.stamp_get").innerHTML = "スタンプゲット!"
            document.querySelector("img.stamp_get").src = `${teacher_name}/${parseInt(document.querySelector('label.color').innerHTML) + 1}.png`
        } else {
            document.querySelector("h2.stamp_get").innerHTML = "残念!"
            document.querySelector("img.stamp_get").src = `${teacher_name}/5.png`
        }
        document.querySelector("img.stamp_get").onload = function () {
            myDialog.classList.add('show');
            hako.play()
        }
        pushed = true
    }
}
if (teacher_name) {
    intervalId = setInterval(() => { // 背景更新
        lastIndex = index
        while (index == lastIndex) {
            index = Math.floor(Math.random() * 4);
            document.querySelector("label.color").innerHTML = index
        }
        box.style.backgroundColor = colors[index];
    }, 450); // 0.45秒ごと
}
function drawImageFitAt(image, x, y, maxWidth, maxHeight) {
    const iw = image.width;
    const ih = image.height;

    // スケーリング比（幅・高さの小さい方）
    const scale = Math.min(maxWidth / iw, maxHeight / ih);

    const drawWidth = iw * scale;
    const drawHeight = ih * scale;

    // 描画開始位置（指定範囲内で中央に配置）
    const dx = x + (maxWidth - drawWidth) / 2;
    const dy = y + (maxHeight - drawHeight) / 2;

    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
}
function easeOut(t, b, c, d) {
    let time = t / d;
    return c * (1 - Math.pow(1 - time, 3)) + b;
}
function easeIn(t, start, end) {
    const easedT = t * t * t; // ease-in（加速）
    return start + (end - start) * easedT;
}
function draw(timestamp) { //線を引く + スタンプを出す
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 前のフレームを消去
    document.querySelector("canvas").style.display = "block"
    if (teacher_name) {
        document.querySelector("div.description2").style.display = "block"
    }

    for (let i = 0; i < lineStarts.length; i++) {
        // 各線の描画開始時間をずらす
        if (timestamp < startTimes[i]) {
            continue; // 描画開始時間になっていなければスキップ
        }

        // 終点でスピードが減速する
        let easedX = easeOut(x[i], 0, lineLength, lineLength);

        // 描画
        ctx.beginPath();
        ctx.moveTo(0, lineStarts[i]); // 開始位置
        ctx.lineTo(easedX, lineStarts[i]); // 終了位置（スムージングを適用）
        ctx.moveTo(lineStarts[i], 0); // 開始位置
        ctx.lineTo(lineStarts[i], easedX); // 終了位置（スムージングを適用）
        ctx.stroke();

        // 各線の進行度を更新
        x[i] += speeds[i]; // 各線の進行

        // 終了条件
        if (x[i] > lineLength) {
            x[i] = lineLength; // 終点で停止
        }
    }
    if (stamps) {
        stamps.forEach((e) => {
            let r = 0, g = 0, b = 0;
            switch (e.color) {
                case "red":
                    r = 255;
                    break;
                case "green":
                    g = 255;
                    break;
                case "blue":
                    b = 255;
                    break;
                case "yellow":
                    r = 255;
                    g = 255;
                    break;
                case "gray":
                    r = 0;
                    g = 0;
                    b = 0;
                    break;
            }
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${x[0] / 1600})`;

            ctx.fillRect(e.x - 50, e.y - 50, 100, 100);

            ctx.globalAlpha = x[0] / 400;
            var img = new Image()
            img.src = e.path
            drawImageFitAt(img, e.x - 50, e.y - 50, 100, 100); // 中心を合わせて描画
            ctx.globalAlpha = 1.0;
        })
    }
    // すべての線が終点に達するまでアニメーションを続ける
    if (x[2] < lineLength) {
        requestAnimationFrame(draw); // アニメーションを続ける
    } else {
        if (stamp.frame == 0) {
            isAbleToStamp = true;
        }
    }
}
function draw2() { //スタンプ押す
    draw();
    if (stamp.frame < 60) {
        ctx.save(); // 現在の状態を保存
        if (stamp.x > 200) {
            ctx.translate(stamp.x + easeIn((stamp.frame) / 60, -200, 0), stamp.y - (stamp.frame - 60) * 10);       // (x, y)に原点を移動
        } else {
            ctx.translate(stamp.x + easeIn((stamp.frame) / 60, 200, 0), stamp.y - (stamp.frame - 60) * 10);       // (x, y)に原点を移動

        }
        ctx.rotate(stamp.rotate);         // 回転
        drawImageFitAt(document.querySelector("img.stamp_get"), -50, -50, 100, 100); // 中心を合わせて描画
        ctx.restore()
        stamp.rotate += 48 * Math.PI / 180;
    } else {
        if (class_index[document.querySelector("label.color").innerHTML] == "red") {
            ctx.fillStyle = `rgba(255, 0, 0, ${(stamp.frame - 60) / 120})`;
        }
        if (class_index[document.querySelector("label.color").innerHTML] == "green") {
            ctx.fillStyle = `rgba(0, 255, 0, ${(stamp.frame - 60) / 120})`;
        }
        if (class_index[document.querySelector("label.color").innerHTML] == "blue") {
            ctx.fillStyle = `rgba(0, 0, 255, ${(stamp.frame - 60) / 120})`;
        }
        if (class_index[document.querySelector("label.color").innerHTML] == "yellow") {
            ctx.fillStyle = `rgba(255, 255, 0, ${(stamp.frame - 60) / 120})`;
        }
        if (color_ != class_index[document.querySelector("label.color").innerHTML]) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(stamp.frame - 60) / 90})`;
        }
        ctx.fillRect(stamp.x - 50, stamp.y - 50, 100, 100);
        drawImageFitAt(document.querySelector("img.stamp_get"), stamp.x - 50, stamp.y - 50, 100, 100); // 中心を合わせて描画
    }
    stamp.frame++;
    if (stamp.frame < 91) {
        requestAnimationFrame(draw2); // アニメーションを続ける
    } else {
        var bingoCount = countBingoLinesWithColors(load_json()).bingoCount
        var local_bingocount = localStorage.getItem("bingo")
        var bingoColors = countBingoLinesWithColors(load_json()).bingoColors.length
        var local_bingocolors = localStorage.getItem("bingoc")
        var bingo = 0;
        var color = 0;
        for (var i = local_bingocount; i < bingoCount; i++) {
            bingo++
        }
        for (var i = local_bingocolors; i < bingoColors; i++) {
            color++
        }
        if (bingo) {
            setTimeout(() => {
                document.querySelector("div.bingo").classList.add("show");
                bingo_sound.play()
                document.querySelector("#bingo_details").innerHTML = `ビンゴ: ${bingo}pt<br>同色スタンプボーナス: ${color}pt`
            }, 1000)
        } else {
            document.querySelector(".toMainMenu").style.display = "block";
        }
        localStorage.setItem("bingo", countBingoLinesWithColors(load_json()).bingoCount)
        localStorage.setItem("bingoc", countBingoLinesWithColors(load_json()).bingoColors.length)
    }
}
function convertToNaturalNumber(value) {
    if (value < 0 || value > 400) {
        throw new Error("値は0から400の間である必要があります");
    }

    // 100ごとに分けて 1〜4 に変換
    return Math.floor(value / 100);
}
if (teacher_name) { // canvas_click
    canvas.addEventListener('click', (event) => {
        if (isAbleToStamp && NotStamped) {
            const rect = canvas.getBoundingClientRect(); // canvasの位置とサイズ
            stamp.x = convertToNaturalNumber((event.clientX - rect.left) / rect.width * 400) * 100 + 50;
            stamp.y = convertToNaturalNumber((event.clientY - rect.top) / rect.height * 400) * 100 + 50;
            var ok = true;
            load_json().forEach((e) => {
                if (e.x == stamp.x && e.y == stamp.y) {
                    ok = false;
                }
            })
            if (ok) {
                hanko.play()
                NotStamped = false;
                requestAnimationFrame(draw2); // アニメーションを続ける
                var col = class_index[document.querySelector("label.color").innerHTML]
                if (color_ != col) {
                    col = "gray"
                }
                var json = load_json()
                json.push({ x: stamp.x, y: stamp.y, color: col, path: document.querySelector("img.stamp_get").src })
                save_json(json)
            }
        }
    });
}
//メニューボタン
const menuButton = document.querySelector('.menu-button');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');

menuButton.addEventListener('click', () => {
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
});
if (teacher_name) {
    menuButton.style.display = "none";
}