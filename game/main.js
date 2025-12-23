// ===== TAIPING JUNGLE RUNNER (AUTO-FALLBACK EDITION) =====
// Kod ini automatik guna kotak warna jika gambar tak jumpa!

const WORLD_H = 540;
const SAFE_TOP = 70;

function safeBottom(h) {
    return Math.max(240, Math.round(h * 0.26));
}

let player, groundGroup, coinGroup, obstacleGroup;
let touch = { jump: false };
let ui = {};
let bgFar, bgNear;
let gameState = { speed: 350, distance: 0, coins: 0, alive: true };

const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#1b1f2a",
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: true, roundPixels: true },
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 1500 }, debug: false }
    },
    scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
    // Kita set path, tapi kita akan check kalau fail gagal load
    this.load.setPath('assets/');

    // Cuba load gambar (Pastikan nama fail SAMA dengan yang anda upload)
    this.load.spritesheet('playerRun', 'player_sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.image('bgFar', 'jungle_far.png');
    this.load.image('bgNear', 'jungle_near.png');
    this.load.image('groundImg', 'ground.png');
    this.load.image('coinImg', 'coin.png');
    this.load.image('rockImg', 'rock.png');
}

function create() {
    // --- SISTEM PENYELAMAT (FALLBACK) ---
    // Kalau gambar tak jumpa, kita buat grafik sementara on-the-fly
    generateMissingTextures.call(this);

    this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, WORLD_H);

    // --- BACKGROUND ---
    // Guna gambar jika ada, jika tiada guna warna kosong
    let bgFarKey = this.textures.exists('bgFar') ? 'bgFar' : null;
    let bgNearKey = this.textures.exists('bgNear') ? 'bgNear' : null;

    if (bgFarKey) {
        this.bgFar = this.add.tileSprite(0, 0, this.scale.width, WORLD_H, bgFarKey).setOrigin(0,0).setScrollFactor(0);
    } else {
        // Kalau takde gambar background, buat langit biru gelap
        this.add.rectangle(0, 0, this.scale.width, WORLD_H, 0x23304a).setOrigin(0,0).setScrollFactor(0);
    }

    if (bgNearKey) {
        this.bgNear = this.add.tileSprite(0, 0, this.scale.width, WORLD_H, bgNearKey).setOrigin(0,0).setScrollFactor(0);
        this.bgNear.y = -50;
    }

    // --- GROUND ---
    groundGroup = this.physics.add.staticGroup();
    this.groundY = WORLD_H - 40;
    this.tileW = 128;
    buildInitialGround.call(this);

    // --- PLAYER ---
    // Check kalau spritesheet player wujud, kalau tak guna kotak biru
    let playerKey = this.textures.exists('playerRun') ? 'playerRun' : 'placeholderPlayer';
    
    player = this.physics.add.sprite(100, this.groundY - 150, playerKey);
    player.body.setSize(30, 40);
    player.setCollideWorldBounds(false);

    // Animasi hanya jalan kalau gambar betul wujud
    if (this.textures.exists('playerRun')) {
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('playerRun', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: -1
        });
        player.play('run');
    }

    this.physics.add.collider(player, groundGroup);

    // --- OBJECTS ---
    coinGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    obstacleGroup = this.physics.add.staticGroup();
    spawnPackAhead.call(this, 1000);

    // Collision
    this.physics.add.overlap(player, coinGroup, (p, c) => {
        c.destroy();
        gameState.coins += 1;
        ui.coinText.setText(String(gameState.coins));
    });
    this.physics.add.collider(player, obstacleGroup, () => {
        if (gameState.alive) killPlayer.call(this);
    });

    // --- CAMERA & INPUT ---
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, WORLD_H);
    
    this.input.on("pointerdown", () => tryJump.call(this));
    this.input.keyboard.on("keydown-SPACE", () => tryJump.call(this));

    // --- UI ---
    createUI.call(this);
    applyLayout.call(this);
    this.scale.on("resize", () => applyLayout.call(this));
}

function update(time, delta) {
    if (!gameState.alive) return;

    const dt = Math.min(0.033, delta / 1000);

    // Parallax
    if (this.bgFar) { this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.2; this.bgFar.setSize(this.scale.width, WORLD_H); }
    if (this.bgNear) { this.bgNear.tilePositionX = this.cameras.main.scrollX * 0.5; this.bgNear.setSize(this.scale.width, WORLD_H + 50); }

    player.setVelocityX(gameState.speed);

    if (touch.jump) {
        if (player.body.touching.down || player.body.blocked.down) {
            player.setVelocityY(-650);
        }
        touch.jump = false;
    }

    gameState.distance += (gameState.speed * dt);
    ui.distText.setText(Math.floor(gameState.distance / 10) + " m");

    recycleGround.call(this);
    spawnPackAhead.call(this, this.cameras.main.scrollX + this.scale.width + 600);

    if (player.y > WORLD_H + 200) killPlayer.call(this);
}

// --- LOGIC TAMBAHAN ---

function generateMissingTextures() {
    const g = this.make.graphics({ add: false });
    
    // Kalau Player tak jumpa, buat kotak biru
    if (!this.textures.exists('playerRun')) {
        g.clear(); g.fillStyle(0x3aa0ff); g.fillRoundedRect(0,0,48,48,8);
        g.generateTexture('placeholderPlayer', 48, 48);
    }
    // Kalau Tanah tak jumpa, buat kotak hijau
    if (!this.textures.exists('groundImg')) {
        g.clear(); g.fillStyle(0x2f6f3a); g.fillRect(0,0,128,40); 
        g.fillStyle(0x8b5a2b); g.fillRect(0,10,128,30);
        g.generateTexture('groundImg', 128, 40);
    }
    // Kalau Coin tak jumpa
    if (!this.textures.exists('coinImg')) {
        g.clear(); g.fillStyle(0xffd700); g.fillCircle(15,15,15);
        g.generateTexture('coinImg', 30,30);
    }
    // Kalau Rock tak jumpa
    if (!this.textures.exists('rockImg')) {
        g.clear(); g.fillStyle(0x555555); g.fillRoundedRect(0,0,40,40,5);
        g.generateTexture('rockImg', 40,40);
    }
}

function tryJump() {
    if(!gameState.alive && ui.hint.text.includes("OVER")) {
        restartGame.call(this.scene);
        return;
    }
    touch.jump = true;
}

function createUI() {
    const style = { fontFamily: "Courier", fontSize: "20px", color: "#fff", stroke: "#000", strokeThickness: 3 };
    ui.coinText = this.add.text(50, SAFE_TOP, "0", { ...style, color: "#ffd700" }).setScrollFactor(0);
    ui.add.text(20, SAFE_TOP, "$", style).setScrollFactor(0);
    ui.distText = this.add.text(20, SAFE_TOP + 30, "0 m", style).setScrollFactor(0);
    ui.hint = this.add.text(this.scale.width/2, this.scale.height - 100, "TAP TO JUMP", style).setOrigin(0.5).setScrollFactor(0);
    
    // Debug Msg jika gambar tak load
    if (!this.textures.exists('playerRun')) {
        this.add.text(10, 10, "WARNING: IMAGE FILES MISSING", { fill: '#ff0000', backgroundColor: '#000' }).setScrollFactor(0);
    }
}

function applyLayout() {
    const h = this.scale.height;
    const zoom = Phaser.Math.Clamp((h - SAFE_TOP - safeBottom(h)) / WORLD_H, 0.8, 1.3);
    this.cameras.main.setZoom(zoom);
    if(ui.hint) ui.hint.setPosition(this.scale.width/2, this.scale.height - safeBottom(h) - 30);
}

function buildInitialGround() {
    const w = Math.max(this.scale.width, 1000);
    const tiles = Math.ceil((w + 800) / this.tileW);
    this.groundTiles = [];
    for (let i = 0; i < tiles; i++) {
        const t = groundGroup.create(-200 + i * this.tileW, this.groundY, 'groundImg').refreshBody();
        t.setOrigin(0, 0.5);
        this.groundTiles.push(t);
    }
}

function recycleGround() {
    const camX = this.cameras.main.scrollX;
    const leftEdge = camX - 300;
    let rightMostX = -Infinity;
    this.groundTiles.forEach(t => rightMostX = Math.max(rightMostX, t.x));
    this.groundTiles.forEach(t => {
        if (t.x + this.tileW < leftEdge) { t.x = rightMostX + this.tileW; t.refreshBody(); rightMostX = t.x; }
    });
}

function spawnPackAhead(targetX) {
    if (!this.lastSpawnX) this.lastSpawnX = 0;
    if (targetX < this.lastSpawnX + 500) return;
    for (let x = this.lastSpawnX + 600; x <= targetX; x += Phaser.Math.Between(300, 600)) {
        if (Math.random() < 0.7) coinGroup.create(x, this.groundY - Phaser.Math.Between(80, 250), 'coinImg');
        if (Math.random() < 0.4) obstacleGroup.create(x + Phaser.Math.Between(100, 200), this.groundY - 30, 'rockImg').body.setSize(30,30);
    }
    this.lastSpawnX = targetX;
}

function killPlayer() {
    gameState.alive = false; player.setVelocityX(0); player.setTint(0xff0000);
    if(player.anims) player.anims.stop();
    ui.hint.setText("GAME OVER! TAP TO RESTART");
}

function restartGame() {
    this.scene.restart();
    gameState.alive = true; gameState.coins = 0; gameState.distance = 0; this.lastSpawnX = 0;
}
