const params = new URLSearchParams(window.location.search);
let pushed = false;
const color_index = ["赤", "黄色", "青", "緑", "はずれ"]
const class_index = [
    "red", "yellow", "blue", "green", "gray"
]
const colors = [
    'rgba(255, 204, 204, 1)',
    'rgba(255, 255, 204, 1)',
    'rgba(204, 204, 255, 1)',
    'rgba(204, 255, 204, 1)',
    'rgba(204, 204, 204, 1)',
];
const teachers = {
    "noda": "野田岳志", "hiraku": "比楽朱里", "hayama": "羽山祐樹", "shinba": "新林裕基"
}
let teacher_name = params.get('teacher');
let param_color = params.get('color');
let animation_frame_id = null;
let selected_exchange_stamp = null;
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
function getRelativePathParts(baseUrl, targetUrl) {
    const base = new URL(baseUrl);
    const target = new URL(targetUrl);

    if (base.origin !== target.origin) {
        throw new Error("異なるオリジンです");
    }

    let basePath = base.pathname;
    let targetPath = target.pathname;

    if (!basePath.endsWith("/")) {
        basePath = basePath.substring(0, basePath.lastIndexOf("/") + 1);
    }

    let relativePath = targetPath.startsWith(basePath)
        ? targetPath.substring(basePath.length)
        : targetPath;

    // "/" で分割し、空文字を除く
    return relativePath.split("/").filter(part => part.length > 0);
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
function reset_button() {
    if (confirm('これまでのデータがすべて削除されます。本当にいいですか?')) {
        localStorage.clear();
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
if (teacher_name && !param_color) {
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
    } else {
        document.querySelector("table").style.display = "block";
        document.querySelector("td.numberOfBingo").innerHTML = localStorage.getItem("bingo");
        document.querySelector("td.numberOfBingoWithSameColor").innerHTML = localStorage.getItem("bingoc");
        document.querySelector("td.maxNumberOfBingo").innerHTML = localStorage.getItem("mbingo");
        document.querySelector("td.maxNumberOfBingoWithSameColor").innerHTML = localStorage.getItem("mbingoc");
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
        animation_frame_id = requestAnimationFrame(draw); // アニメーションを続ける
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
        if (class_index[document.querySelector("label.color").innerHTML] == "gray") {
            ctx.fillStyle = `rgba(0, 0, 0, ${(stamp.frame - 60) / 90})`;
        }
        if (color_ != class_index[document.querySelector("label.color").innerHTML]) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(stamp.frame - 60) / 90})`;
        }
        ctx.fillRect(stamp.x - 50, stamp.y - 50, 100, 100);
        drawImageFitAt(document.querySelector("img.stamp_get"), stamp.x - 50, stamp.y - 50, 100, 100); // 中心を合わせて描画
    }
    stamp.frame++;
    if (stamp.frame < 91) {
        animation_frame_id = requestAnimationFrame(draw2); // アニメーションを続ける
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
                console.log(bingoCount, bingoColors)
                document.querySelector("#bingo_details").innerHTML = `ビンゴ: ${-parseInt(localStorage.getItem("mbingo")) + bingoCount}pt<br>同色スタンプボーナス: ${-parseInt(localStorage.getItem("mbingoc")) + bingoColors}pt`
                localStorage.setItem("coin", parseInt(localStorage.getItem("coin")) + (-parseInt(localStorage.getItem("mbingo")) + bingoCount - parseInt(localStorage.getItem("mbingoc")) + bingoColors) * 100)

                localStorage.setItem("bingo", countBingoLinesWithColors(load_json()).bingoCount)
                localStorage.setItem("bingoc", countBingoLinesWithColors(load_json()).bingoColors.length)
                localStorage.getItem("mbingo") < localStorage.getItem("bingo") && localStorage.setItem("mbingo", localStorage.getItem("bingo"))
                localStorage.getItem("mbingoc") < localStorage.getItem("bingoc") && localStorage.setItem("mbingoc", localStorage.getItem("bingoc"))
            }, 1000)
        } else {
            document.querySelector(".toMainMenu").style.display = "block";
        }
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
                animation_frame_id = requestAnimationFrame(draw2); // アニメーションを続ける
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

function showExchangeStamp() {
    document.querySelector("canvas").style.display = "none";
    document.querySelector("div.exchange_stamp").style.display = "block";
    document.querySelector("div.exchange_stamp_list").innerHTML = "読み込み中...";
    document.querySelector("table").style.display = "none";
    cancelAnimationFrame(animation_frame_id);

    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
    fetch("https://script.google.com/macros/s/AKfycbwXo5sqgN4XttFXp4dAv15XzdDHYGNGzZ3Ixeb2bPLtUUZMfjLUcR1F2sYI243ZgY93bQ/exec?type=getAll")
        .then(response => response.text()) // 必要に応じて .text() などに変更
        .then(data => {
            load_json().length > 0 && document.querySelector("div.bottom-box").classList.remove("bottom-transform");
            var div = document.querySelector("div.exchange_stamp_list")
            var parsed_data = JSON.parse(data);
            var items = []
            parsed_data.forEach((item) => {
                if (item[2] > 0) {
                    console.log(item)
                    items.push(item)
                }
            })
            div.innerHTML = ""
            if (items.length == 0) {
                div.innerHTML = "取得可能スタンプはありません";
            }
            items.forEach((item) => {
                div.innerHTML = div.innerHTML + `<button onclick="get_stamp('${item[0]}',${item[1]})" class="card stamp_list_button" style="background-color:${colors[item[1] - 1]}">${teachers[item[0]]}<label style="font-size:5px;">先生</label> ${color_index[item[1] - 1]}スタンプ </button><label style="position: relative;top: -30;left: calc(100% - 80px);background-color: rgba(255,255,255,0.5);border-radius: 10px;padding: 5px 6px;">×${item[2]}</label>`
            })
        })
        .catch(error => {
            alert("エラーが発生しました。\nサーバーが混雑している可能性があります。")
            console.log(error)
            location.reload()
        });
}
function get_stamp(item1, item2) {
    var continue_ = false;
    load_json().forEach((e) => {
        let tn = getRelativePathParts(location.href, e.path)[0];
        if (tn == item1) {
            alert("すでにそのスタンプは交換済みです");
            continue_ = true;
        }
    })
    if (localStorage.getItem("coin") < 100) {
        alert("おカネが足りません")
        continue_ = true;
    }
    if (continue_) { return false; }
    if (confirm(`${teachers[item1]} ${color_index[item2 - 1]} 100ポイント消費して交換しますか?`)) {

        document.querySelector("div.exchange_stamp").style.display = "none";
        fetch("https://script.google.com/macros/s/AKfycbwXo5sqgN4XttFXp4dAv15XzdDHYGNGzZ3Ixeb2bPLtUUZMfjLUcR1F2sYI243ZgY93bQ/exec?type=takeStamp&teacher_name=" + item1 + "&image_number=" + item2)
            .then(response => response.text()) // 必要に応じて .text() などに変更
            .then(data => {
                if (data) {
                    localStorage.setItem("coin", parseInt(localStorage.getItem("coin")) - 100);
                    location.href = "?teacher=" + item1 + "&color=" + class_index[item2 - 1];
                } else {
                    alert("エラーが発生しました。そのスタンプはすでにほかの人に取られています。")
                    location.reload()
                }
            })
            .catch(error => {
                alert("エラーが発生しました。\nサーバーが混雑している可能性があります。")
                console.log(error)
                location.reload()
            });
    }
}
function show_uploadStamp() {
    document.querySelector("div.exchange_stamp").style.display = "none";
    document.querySelector("table").style.display = "none";
    document.querySelector("body > button.menu-button").style.display = "none";
    document.querySelector("body > div.description2 > h2").innerHTML = "スタンプをえらべ！";
    document.querySelector(".description2").style.display = "block";
    x = [0, 0, 0]; // 3本の線のX座標（進行する位置）
    speeds = [maxSpeed, maxSpeed, maxSpeed]; // 3本の線の速度
    draw()

    canvas.addEventListener('click', (event) => {
        if (!selected_exchange_stamp) {
            const rect = canvas.getBoundingClientRect(); // canvasの位置とサイズ
            const x = convertToNaturalNumber((event.clientX - rect.left) / rect.width * 400) * 100 + 50;
            const y = convertToNaturalNumber((event.clientY - rect.top) / rect.height * 400) * 100 + 50;
            var ok = false;
            var path = false;
            let count = 0;
            load_json().forEach((e) => {
                if (e.x == x && e.y == y) {
                    ok = count + 1;
                    path = e.path;
                }
                count++
            })
            var tn = teachers[getRelativePathParts(location.href, path)[0]]
            var cl = color_index[parseInt(getRelativePathParts(location.href, path)[1][0] - 1)]
            if (ok && confirm(`${tn} ${cl} このデバイスからスタンプが消えます。本当にいいですか？`)) {
                localStorage.setItem("coin", parseInt(localStorage.getItem("coin")) + 50)
                selected_exchange_stamp = true;
                var json = load_json()
                json.splice(ok - 1, 1)

                fetch("https://script.google.com/macros/s/AKfycbwXo5sqgN4XttFXp4dAv15XzdDHYGNGzZ3Ixeb2bPLtUUZMfjLUcR1F2sYI243ZgY93bQ/exec?type=addStamp&teacher_name=" + getRelativePathParts(location.href, path)[0] + "&image_number=" + getRelativePathParts(location.href, path)[1][0])
                    .then(response => response.text()) // 必要に応じて .text() などに変更
                    .then(data => {
                        location.reload()
                        save_json(json);
                    })
                    .catch(error => {
                        alert("エラーが発生しました。\nサーバーが混雑している可能性があります。")
                        console.log(error)
                        location.reload()
                    });
            }
        }
    });
}


// main
if (!load_json()) { // 初期設定
    save_json([]);
    localStorage.setItem("bingo", 0)
    localStorage.setItem("bingoc", 0)
    localStorage.setItem("mbingo", 0)
    localStorage.setItem("mbingoc", 0)
    localStorage.setItem("coin", 0)
}

localStorage.setItem("bingo", countBingoLinesWithColors(load_json()).bingoCount)
localStorage.setItem("bingoc", countBingoLinesWithColors(load_json()).bingoColors.length)
localStorage.getItem("mbingo") < localStorage.getItem("bingo") && localStorage.setItem("mbingo", localStorage.getItem("bingo"))
localStorage.getItem("mbingoc") < localStorage.getItem("bingoc") && localStorage.setItem("mbingoc", localStorage.getItem("bingoc"))
document.querySelector(".coin").innerHTML = localStorage.getItem("coin")
if (!teacher_name || param_color) {
    animation_frame_id = requestAnimationFrame(draw)
    animation_frame_id = requestAnimationFrame(function () {
        if (param_color) {
            color_ = param_color;
            document.querySelector("label.color").innerHTML = class_index.indexOf(param_color);
            document.querySelector("img.stamp_get").src = `${teacher_name}/${parseInt(document.querySelector('label.color').innerHTML) + 1}.png`
        }
        stamps = load_json()
        document.querySelector('#stamp_chosing').style.display = "none"
    })
}

if (teacher_name) {
    load_json().forEach((e) => {
        let tn = getRelativePathParts(location.href, e.path)[0];
        if (tn == teacher_name) {
            alert("すでにそのスタンプは交換済みです");
            toMainMenu();
        }
    })
}