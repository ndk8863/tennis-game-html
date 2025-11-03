const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲーム状態
let gameRunning = true;
let score = 0;
let enemiesDestroyed = 0;
let frameCount = 0;

// プレイヤー
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    speed: 5,
    hp: 100,
    maxHp: 100
};

// キーボード入力
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameRunning) {
        e.preventDefault();
        shootBullet();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 弾丸配列
let bullets = [];
let enemyBullets = [];

// 敵配列
let enemies = [];

// ボス画像の読み込み
const bossImages = [];
const bossImageCount = 9;
let imagesLoaded = 0;

for (let i = 1; i <= bossImageCount; i++) {
    const img = new Image();
    img.src = `sample_image/enemy_icon_${i}.jpeg`;
    img.onload = () => {
        imagesLoaded++;
    };
    bossImages.push(img);
}

// 星（背景）
let stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 2
    });
}

// 弾丸発射
function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 3,
        y: player.y,
        width: 6,
        height: 20,
        speed: 10
    });
}

// 敵生成
function spawnEnemy() {
    const type = Math.random();
    let enemy;

    // 全ての敵にランダムな画像を選択
    const imageIndex = Math.floor(Math.random() * bossImages.length);

    if (type < 0.7) {
        // 通常の敵
        enemy = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed: 2 + Math.random() * 2,
            hp: 1,
            type: 'normal',
            shootTimer: 0,
            image: bossImages[imageIndex]
        };
    } else if (type < 0.9) {
        // 強敵
        enemy = {
            x: Math.random() * (canvas.width - 60),
            y: -60,
            width: 60,
            height: 60,
            speed: 1 + Math.random(),
            hp: 3,
            type: 'strong',
            shootTimer: 0,
            image: bossImages[imageIndex]
        };
    } else {
        // ボス級
        enemy = {
            x: Math.random() * (canvas.width - 80),
            y: -80,
            width: 80,
            height: 80,
            speed: 0.5 + Math.random() * 0.5,
            hp: 10,
            type: 'boss',
            shootTimer: 0,
            image: bossImages[imageIndex]
        };
    }

    enemies.push(enemy);
}

// 衝突判定
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// プレイヤー更新
function updatePlayer() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        player.y += player.speed;
    }

    // 画面外に出ないように
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// 弾丸更新
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
}

// 敵の弾丸更新
function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed;

        // プレイヤーとの衝突判定
        if (checkCollision(bullet, player)) {
            player.hp -= 10;
            updateHP();
            if (player.hp <= 0) {
                gameOver();
            }
            return false;
        }

        return bullet.y < canvas.height;
    });
}

// 敵更新
function updateEnemies() {
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;

        // 敵の発射
        enemy.shootTimer++;
        if (enemy.shootTimer > 60 && Math.random() < 0.02) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 3,
                y: enemy.y + enemy.height,
                width: 6,
                height: 15,
                speed: 5
            });
            enemy.shootTimer = 0;
        }

        // 弾丸との衝突判定
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (checkCollision(bullets[i], enemy)) {
                bullets.splice(i, 1);
                enemy.hp--;
                if (enemy.hp <= 0) {
                    // スコア加算
                    if (enemy.type === 'normal') score += 100;
                    else if (enemy.type === 'strong') score += 300;
                    else if (enemy.type === 'boss') score += 1000;

                    enemiesDestroyed++;
                    updateScore();
                    return false;
                }
            }
        }

        // プレイヤーとの衝突判定
        if (checkCollision(enemy, player)) {
            player.hp -= 20;
            updateHP();
            if (player.hp <= 0) {
                gameOver();
            }
            return false;
        }

        return enemy.y < canvas.height;
    });
}

// 星の更新
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// 描画
function draw() {
    // 背景
    ctx.fillStyle = '#001f3f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 星
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // プレイヤー
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // プレイヤーの弾丸
    ctx.fillStyle = '#0f0';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // 敵の弾丸
    ctx.fillStyle = '#f00';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // 敵
    enemies.forEach(enemy => {
        if (enemy.image && enemy.image.complete) {
            // 全ての敵を画像で描画
            ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            // 画像が読み込まれていない場合は色で描画（フォールバック）
            if (enemy.type === 'normal') {
                ctx.fillStyle = '#f0f';
            } else if (enemy.type === 'strong') {
                ctx.fillStyle = '#ff0';
            } else {
                ctx.fillStyle = '#f00';
            }
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        // HP表示（強敵とボス）
        if (enemy.type !== 'normal') {
            ctx.fillStyle = '#0f0';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.hp / (enemy.type === 'strong' ? 3 : 10)), 5);
        }
    });
}

// スコア更新
function updateScore() {
    document.getElementById('score').textContent = score;
}

// HP更新
function updateHP() {
    document.getElementById('hp').textContent = Math.max(0, player.hp);
}

// ゲームオーバー
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('enemiesDestroyed').textContent = enemiesDestroyed;
    document.getElementById('gameOver').style.display = 'block';
}

// ゲーム再起動
function restartGame() {
    gameRunning = true;
    score = 0;
    enemiesDestroyed = 0;
    frameCount = 0;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 100;
    player.hp = 100;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    document.getElementById('gameOver').style.display = 'none';
    updateScore();
    updateHP();
    gameLoop();
}

// ゲームループ
function gameLoop() {
    if (!gameRunning) return;

    frameCount++;

    // 敵生成
    if (frameCount % 60 === 0) {
        spawnEnemy();
    }

    updatePlayer();
    updateBullets();
    updateEnemyBullets();
    updateEnemies();
    updateStars();
    draw();

    requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();
