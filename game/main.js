// ===== TAIPING JUNGLE RUNNER (FINAL EDITION) =====

const WORLD_H = 540;
const SAFE_TOP = 70;

function safeBottom(h) {
    return Math.max(240, Math.round(h * 0.26));
}

let player, groundGroup, coinGroup, obstacleGroup;
let touch = { jump: false };
let ui = {};
let bgFar, bgNear;

let gameState = {
    speed: 350, // Laju sikit
    distance: 0,
    coins: 0,
    alive: true
};

const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#1b1f2a",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // Sangat penting untuk kekalkan rupa pixel art yang tajam:
    render: { pixelArt: true, roundPixels: true, antialias: false },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1500 },
            debug: false // Tukar ke 'true' jika nak tengok kotak hitbox
        }
    },
    scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
    // Tetapkan path ke folder assets
    this.load.setPath('assets/'); 

    // 1. MUAT NAIK KARAKTER (Spritesheet)
    // PENTING: Pastikan frameWidth/frameHeight sepadan dengan gambar anda.
    // Saya anggap spritesheet anda adalah 4 frame mendatar, saiz contoh 48x48px satu frame.
    // Jika guna gambar wanita, tukar nama fail di sini.
    this.load.spritesheet('playerRun', 'player_sheet.png', { 
        frameWidth: 48,  // UBAH INI ikut saiz sebenar lebar satu frame gambar anda
        frameHeight: 48  // UBAH INI ikut saiz sebenar tinggi satu frame gambar anda
    });
    
    // 2. MUAT NAIK BACKGROUND & OBJEK
    this.load.image('bgFar', 'jungle_far.png');
    this.load.image('bgNear', 'jungle_near.png');
    this.load.image('groundImg', 'ground.png');
    
    // Placeholder untuk coin/rock jika anda tiada gambarnya
    createPlaceholderObjects.call(this);
}

function create() {
    this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, WORLD_H);

    // --- SETUP PARALLAX BACKGROUND ---
    // Kita guna tileSprite supaya ia boleh berulang
    this.bgFar = this.add.tileSprite(0, 0, this.scale.width, WORLD_H, 'bgFar')
        .setOrigin(0, 0)
        .setScrollFactor(0); // Lekat pada kamera

    this.bgNear = this.add.tileSprite(0, 0, this.scale.width, WORLD_H, 'bgNear')
        .setOrigin(0, 0)
        .setScrollFactor(0);
    // Naikkan sedikit bgNear supaya nampak dasar pokok
    this.bgNear.y = -50; 

    // --- SETUP GROUND ---
    groundGroup = this.physics.add.staticGroup();
    this.groundY = WORLD_H - 40; // Tinggikan sikit tanah
    this.tileW = 128; // Lebar satu tile tanah (ikut gambar ground.png anda)
    
    buildInitialGround.call(this);

    // --- SETUP PLAYER ---
    // Mula di posisi kiri, atas tanah
    player = this.physics.add.sprite(100, this.groundY - 150, 'playerRun');
    
    // Kecilkan hitbox supaya lari lebih tepat (ubah nilai jika perlu)
    // setSize(lebar, tinggi), setOffset(jarakX, jarakY dari kiri atas)
    player.body.setSize(20, 38).setOffset(14, 10); 
    player.setCollideWorldBounds(false);

    // Cipta Animasi Berlari dari spritesheet
    this.anims.create({
        key: 'run',
        // Menggunakan frame 0 hingga 3 (total 4 frame)
        frames: this.anims.generateFrameNumbers('playerRun', { start: 0, end: 3 }), 
        frameRate: 12, // Kelajuan animasi
        repeat: -1     // Ulang selamanya
    });
    player.play('run'); // Mula animasi

    this.physics.add.collider(player, groundGroup);

    // --- SETUP OBJEK LAIN & UI ---
    coinGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    obstacleGroup = this.physics.add.staticGroup();

    spawnPackAhead.call(this, 1000);

    // Collision Logic
    this.physics.add.overlap(player, coinGroup, (p, c) => {
        c.destroy();
        gameState.coins += 1;
        ui.coinText.setText(String(gameState.coins));
    });

    this.physics.add.collider(player, obstacleGroup, () => {
        if (!gameState.alive) return;
        killPlayer.call(this);
    });

    // Kamera ikut player
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, WORLD_H);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-SPACE", () => tryJump());
    this.input.keyboard.on("keydown-UP", () => tryJump());

    createUI.call(this);
    applyLayout.call(this);
    this.scale.on("resize", () => applyLayout.call(this));
}

function update(time, delta) {
    const dt = Math.min(0.033, delta / 1000);

    // --- PARALLAX MOVEMENT ---
    // Gerakkan texture background berdasarkan posisi kamera
    if (this.bgFar) {
        this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.2; // Bergerak perlahan
        this.bgFar.setSize(this.scale.width, WORLD_H);
    }
    if (this.bgNear) {
        this.bgNear.tilePositionX = this.cameras.main.scrollX * 0.5; // Bergerak sederhana laju
        this.bgNear.setSize(this.scale.width, WORLD_H + 50);
    }

    if (!gameState.alive) return;

    // Player sentiasa bergerak ke depan
    player.setVelocityX(gameState.speed);

    // Logik Lompat
    if (touch.jump) {
        // Hanya boleh lompat jika kaki cecah tanah
        if (player.body.touching.down || player.body.blocked.down) {
            player.setVelocityY(-650); // Kuasa lompat
        }
        touch.jump = false;
    }

    // Update UI Jarak
    gameState.distance += (gameState.speed * dt);
    ui.distText.setText(Math.floor(gameState.distance / 10) + " m");

    // Kitar Semula Tanah & Spawn Objek
    recycleGround.call(this);
    
    const camX = this.cameras.main.scrollX;
    const aheadX = camX + this.scale.width + 600;
    spawnPackAhead.call(this, aheadX);

    // Jatuh dalam lubang
    if (player.y > WORLD_H + 200) {
        killPlayer.call(this);
    }
}

// ================= FUNGSI-FUNGSI TAMBAHAN =================

function tryJump() {
    if(!gameState.alive && ui.hint.text.includes("GameOver")) {
        restartGame.call(this.scene);
        return;
    }
    touch.jump = true;
}

function createUI() {
    // Gaya font retro sikit
    const fontStyle = { fontFamily: "Courier", fontSize: "20px", color: "#ffffff", stroke: "#000", strokeThickness: 3 };
    
    ui.coinLabel = this.add.text(20, SAFE_TOP, "COINS:", fontStyle).setScrollFactor(0);
    ui.coinText = this.add.text(100, SAFE_TOP, "0", { ...fontStyle, color: "#ffd700" }).setScrollFactor(0);
    ui.distText = this.add.text(20, SAFE_TOP + 30, "0 m", fontStyle).setScrollFactor(0);

    ui.hint = this.add.text(this.scale.width/2, this.scale.height - 50, "TAP / SPACE UNTUK LOMPAT", fontStyle)
        .setOrigin(0.5).setScrollFactor(0);

    // Zone sentuh seluruh skrin untuk mobile
    let jumpZone = this.add.zone(0, 0, this.scale.width, this.scale.height)
        .setOrigin(0).setScrollFactor(0).setInteractive();
    jumpZone.on("pointerdown", () => tryJump.call(this));
}

function applyLayout() {
    const h = this.scale.height;
    const usableH = h - SAFE_TOP - safeBottom(h);
    const zoom = Phaser.Math.Clamp((usableH * 0.9) / WORLD_H, 0.8, 1.3);
    this.cameras.main.setZoom(zoom);
    
    if(ui.hint) ui.hint.setPosition(this.scale.width/2, this.scale.height - safeBottom(h) - 30);
}

function buildInitialGround() {
    const w = Math.max(this.scale.width, 1000);
    const tilesNeeded = Math.ceil((w + 800) / this.tileW);
    this.groundTiles = [];
    let startX = -200; // Mula sikit ke belakang skrin
    for (let i = 0; i < tilesNeeded; i++) {
        const x = startX + i * this.tileW;
        // Guna gambar groundImg
        const t = groundGroup.create(x, this.groundY, 'groundImg').refreshBody();
        t.setOrigin(0, 0.5); // Origin kiri tengah supaya senang sambung
        this.groundTiles.push(t);
    }
}

function recycleGround() {
    const camX = this.cameras.main.scrollX;
    const leftEdge = camX - 300;
    let rightMostX = -Infinity;
    this.groundTiles.forEach(t => { rightMostX = Math.max(rightMostX, t.x); });

    this.groundTiles.forEach(t => {
        // Jika tile terkeluar jauh ke kiri skrin
        if (t.x + this.tileW < leftEdge) {
            // Pindahkan ke paling kanan
            t.x = rightMostX + this.tileW;
            t.refreshBody();
            rightMostX = t.x; // Update posisi paling kanan baru
        }
    });
}

function spawnPackAhead(targetX) {
    if (!this.lastSpawnX) this.lastSpawnX = 0;
    if (targetX < this.lastSpawnX + 500) return;

    const chunkStart = this.lastSpawnX + 600;
    const chunkEnd = targetX;

    // Jarak antara objek (300 hingga 600 pixel)
    for (let x = chunkStart; x <= chunkEnd; x += Phaser.Math.Between(300, 600)) {
        // Coin (70% chance)
        if (Math.random() < 0.70) {
            const y = this.groundY - Phaser.Math.Between(80, 250);
            coinGroup.create(x, y, 'coin');
        }
        // Obstacle (40% chance) - Jarakkan sikit dari coin
        if (Math.random() < 0.40) {
            const ox = x + Phaser.Math.Between(100, 200);
            const rock = obstacleGroup.create(ox, this.groundY - 30, 'rock');
            rock.body.setSize(30,30).setOffset(0,0); // Kecilkan hitbox batu
        }
    }
    this.lastSpawnX = targetX;
}

function killPlayer() {
    gameState.alive = false;
    player.setVelocityX(0);
    player.setTint(0xff5555); // Jadi merah
    player.anims.stop(); // Berhenti animasi lari

    ui.hint.setText("GAME OVER! TAP UNTUK RESTART");
}

function restartGame() {
    this.scene.restart();
    gameState.alive = true;
    gameState.distance = 0;
    gameState.coins = 0;
    this.lastSpawnX = 0;
}

// Guna ini jika tiada gambar coin/rock
function createPlaceholderObjects() {
    const g = this.make.graphics({ add: false });
    // Coin Kuning
    g.clear(); g.fillStyle(0xffd700); g.fillCircle(15,15,15); g.generateTexture('coin', 30,30);
    // Batu Kelabu
    g.clear(); g.fillStyle(0x555555); g.fillRoundedRect(0,0,40,40,5); g.generateTexture('rock', 40,40);
            }
