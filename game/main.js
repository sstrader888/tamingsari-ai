// ===== TAIPING RUNNER (ENDLESS) - MOBILE FRIENDLY =====
// Controls: Jump button + Space/Up (PC)
// Auto-run to the right. Endless ground recycling + coins + obstacles + score + restart.

const WORLD_H = 540;

// UI safe areas
const SAFE_TOP = 70;
function safeBottom(h) {
  // lift UI away from Android nav bar
  return Math.max(240, Math.round(h * 0.26));
}

let player, groundGroup, coinGroup, obstacleGroup;
let touch = { jump:false };
let ui = {};
let gameState = {
  speed: 260,
  distance: 0,
  coins: 0,
  alive: true
};

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#1b1f2a",
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { pixelArt: true, roundPixels: true },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1300 }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload(){
  // Generate placeholder textures (no external assets required)
  const g = this.make.graphics({ add:false });

  // Player (simple rounded)
  g.fillStyle(0x3aa0ff,1);
  g.fillRoundedRect(0,0,32,44,8);
  g.generateTexture("player",32,44);

  // Ground tile
  g.clear();
  g.fillStyle(0x2f6f3a,1); // grass
  g.fillRect(0,0,128,12);
  g.fillStyle(0x8b5a2b,1); // soil
  g.fillRect(0,12,128,28);
  // tiny stones
  g.fillStyle(0x6e4421,1);
  for(let i=0;i<14;i++) g.fillRect(4+i*9, 22 + (i%2)*4, 4, 3);
  g.generateTexture("groundTile",128,40);

  // Coin
  g.clear();
  g.fillStyle(0xf4c542,1);
  g.fillCircle(12,12,11);
  g.fillStyle(0xffe38a,1);
  g.fillCircle(8,8,4);
  g.generateTexture("coin",24,24);

  // Obstacle (rock)
  g.clear();
  g.fillStyle(0x5b5b5b,1);
  g.fillRoundedRect(0,0,36,26,6);
  g.fillStyle(0x7a7a7a,1);
  g.fillRoundedRect(6,6,10,6,3);
  g.generateTexture("rock",36,26);

  // Parallax layers (simple silhouettes)
  // far hills
  g.clear();
  g.fillStyle(0x23304a,1);
  g.fillRect(0,0,512,256);
  g.fillStyle(0x1e2a3f,1);
  for(let x=0;x<520;x+=70){
    g.fillCircle(x, 210, 70);
  }
  g.generateTexture("hillFar",512,256);

  // near trees
  g.clear();
  g.fillStyle(0x182339,1);
  g.fillRect(0,0,512,256);
  g.fillStyle(0x0f192c,1);
  for(let x=0;x<520;x+=64){
    g.fillRect(x+26, 80, 12, 150); // trunk
    g.fillCircle(x+32, 80, 44);    // canopy
  }
  g.generateTexture("treeNear",512,256);
}

function create(){
  // World bounds (wide enough; we recycle anyway)
  this.physics.world.setBounds(0, 0, 999999, WORLD_H);

  // --- Parallax background (Taiping vibe placeholder) ---
  this.bgFar = this.add.tileSprite(0, 0, 10, 10, "hillFar").setOrigin(0,0).setScrollFactor(0);
  this.bgNear = this.add.tileSprite(0, 0, 10, 10, "treeNear").setOrigin(0,0).setScrollFactor(0);

  // --- Ground recycling ---
  groundGroup = this.physics.add.staticGroup();

  // We place enough tiles to cover any screen width + buffer
  this.groundY = WORLD_H - 60;  // ground top y
  this.tileW = 128;
  this.tileH = 40;

  // Create initial belt of ground
  buildInitialGround.call(this);

  // --- Player ---
  player = this.physics.add.sprite(120, this.groundY - 120, "player");
  player.setCollideWorldBounds(false);
  player.body.setSize(28, 42).setOffset(2, 2);

  this.physics.add.collider(player, groundGroup);

  // --- Coins & obstacles ---
  coinGroup = this.physics.add.group({ allowGravity:false, immovable:true });
  obstacleGroup = this.physics.add.staticGroup();

  spawnPackAhead.call(this, 1000);

  // Overlaps / hits
  this.physics.add.overlap(player, coinGroup, (p, c) => {
    c.destroy();
    gameState.coins += 1;
    ui.coinText.setText(String(gameState.coins));
  });

  this.physics.add.collider(player, obstacleGroup, () => {
    if (!gameState.alive) return;
    killPlayer.call(this);
  });

  // --- Camera ---
  this.cameras.main.startFollow(player, true, 0.10, 0.10);
  this.cameras.main.setBounds(0, 0, 999999, WORLD_H);

  // --- Input ---
  this.cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.on("keydown-SPACE", () => touch.jump = true);

  // --- UI ---
  ui.hint = this.add.text(16, SAFE_TOP, "Runner Taiping: tekan ⤒ untuk lompat", {
    fontFamily: "Arial",
    fontSize: "16px",
    color: "#ffffff"
  }).setScrollFactor(0);

  // HUD (coin + distance)
  ui.coinLabel = this.add.text(16, SAFE_TOP + 26, "Coin:", {
    fontFamily:"Arial", fontSize:"16px", color:"#ffffff"
  }).setScrollFactor(0);

  ui.coinText = this.add.text(70, SAFE_TOP + 26, "0", {
    fontFamily:"Arial", fontSize:"16px", color:"#ffe38a"
  }).setScrollFactor(0);

  ui.distText = this.add.text(16, SAFE_TOP + 48, "Jarak: 0 m", {
    fontFamily:"Arial", fontSize:"16px", color:"#ffffff"
  }).setScrollFactor(0);

  // Big Jump button
  createTouchUI.call(this);

  // Responsive sizing & UI position
  applyLayout.call(this);
  this.scale.on("resize", () => applyLayout.call(this));
}

function update(time, delta){
  const dt = Math.min(0.033, delta/1000);

  // Background parallax movement based on camera scroll
  const camX = this.cameras.main.scrollX;
  this.bgFar.tilePositionX = camX * 0.15;
  this.bgNear.tilePositionX = camX * 0.35;

  // Keep background filling screen
  this.bgFar.setSize(this.scale.width, this.scale.height);
  this.bgNear.setSize(this.scale.width, this.scale.height);
  this.bgFar.setPosition(0, 0);
  this.bgNear.setPosition(0, 0);

  if (!gameState.alive) {
    // Let player fall/stop; allow restart tap
    return;
  }

  // Auto-run
  player.setVelocityX(gameState.speed);

  // Jump input
  const jumpPressed =
    (Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
    (Phaser.Input.Keyboard.JustDown(this.cursors.space)) ||
    touch.jump;

  if (jumpPressed && player.body.blocked.down) {
    player.setVelocityY(-560);
  }
  touch.jump = false;

  // Distance counter
  gameState.distance += (gameState.speed * dt);
  ui.distText.setText("Jarak: " + Math.floor(gameState.distance/10) + " m");

  // Recycle ground tiles as camera moves
  recycleGround.call(this);

  // Spawn more coins/obstacles ahead
  const aheadX = camX + this.scale.width + 600;
  spawnPackAhead.call(this, aheadX);

  // Fail if player drops too low
  if (player.y > WORLD_H + 200) {
    killPlayer.call(this);
  }
}

// ====== UI / Touch ======
function createTouchUI(){
  const style = {
    fontFamily:"Arial",
    fontSize:"28px",
    color:"#fff",
    backgroundColor:"rgba(0,0,0,0.60)",
    padding:{x:26,y:18}
  };

  ui.jumpBtn = this.add.text(0,0,"⤒", style).setScrollFactor(0).setInteractive({ useHandCursor:true });

  ui.jumpBtn.on("pointerdown", () => touch.jump = true);
}

function applyLayout(){
  const w = this.scale.width;
  const h = this.scale.height;

  // Zoom to keep world height comfy in portrait/landscape
  const usableH = h - SAFE_TOP - safeBottom(h);
  const zoom = Phaser.Math.Clamp((usableH * 0.92) / WORLD_H, 1.0, 2.0);
  this.cameras.main.setZoom(zoom);

  // UI positions
  ui.hint.setPosition(16, SAFE_TOP);
  ui.coinLabel.setPosition(16, SAFE_TOP + 26);
  ui.coinText.setPosition(70, SAFE_TOP + 26);
  ui.distText.setPosition(16, SAFE_TOP + 48);

  // Jump button safely above nav bar
  const y = h - safeBottom(h);
  ui.jumpBtn.setPosition(w - 110, y);
}

// ====== Ground build/recycle ======
function buildInitialGround(){
  const w = Math.max(this.scale.width, 800);
  const tilesNeeded = Math.ceil((w + 600) / this.tileW);

  this.groundTiles = [];

  let startX = 0;
  for (let i=0; i<tilesNeeded; i++){
    const x = startX + i*this.tileW + this.tileW/2;
    const t = groundGroup.create(x, this.groundY, "groundTile").refreshBody();
    t.setOrigin(0.5, 0.5);
    this.groundTiles.push(t);
  }
}

function recycleGround(){
  const camX = this.cameras.main.scrollX;
  const leftEdge = camX - 200;

  // find rightmost tile x
  let rightMost = -Infinity;
  for (const t of this.groundTiles) rightMost = Math.max(rightMost, t.x);

  // move tiles that are far left to the right
  for (const t of this.groundTiles){
    if (t.x < leftEdge){
      t.x = rightMost + this.tileW;
      rightMost = t.x;
      t.refreshBody();
    }
  }
}

// ====== Spawning coins/obstacles ahead ======
function spawnPackAhead(targetX){
  // We only spawn if we haven't spawned near this region
  if (!this.lastSpawnX) this.lastSpawnX = 0;
  if (targetX < this.lastSpawnX + 500) return;

  // spawn in chunks
  const chunkStart = this.lastSpawnX + 600;
  const chunkEnd = targetX;

  for (let x = chunkStart; x <= chunkEnd; x += Phaser.Math.Between(260, 420)) {
    // 70% coins
    if (Math.random() < 0.70) {
      const y = this.groundY - Phaser.Math.Between(120, 220);
      const c = coinGroup.create(x, y, "coin");
      c.setCircle(10, 2, 2);
    }

    // 35% obstacle (rock)
    if (Math.random() < 0.35) {
      const ox = x + Phaser.Math.Between(80, 160);
      const o = obstacleGroup.create(ox, this.groundY - 10, "rock");
      o.refreshBody();
    }
  }

  this.lastSpawnX = targetX;
}

// ====== Death / Restart ======
function killPlayer(){
  gameState.alive = false;
  player.setVelocityX(0);
  player.setTint(0xff5555);

  ui.hint.setText("Game Over — tap untuk restart");
  ui.hint.setPosition(16, SAFE_TOP);

  // Tap anywhere to restart
  this.input.once("pointerdown", () => restart.call(this));
  this.input.keyboard.once("keydown-R", () => restart.call(this));
}

function restart(){
  // Reset state
  gameState.alive = true;
  gameState.distance = 0;
  gameState.coins = 0;

  ui.coinText.setText("0");
  ui.distText.setText("Jarak: 0 m");
  ui.hint.setText("Runner Taiping: tekan ⤒ untuk lompat");
  player.clearTint();

  // Clear spawned objects
  coinGroup.clear(true, true);
  obstacleGroup.clear(true, true);

  // Reset spawn tracker
  this.lastSpawnX = 0;

  // Reset player
  player.setPosition(120, this.groundY - 120);
  player.setVelocity(0, 0);

  // Spawn first packs
  spawnPackAhead.call(this, this.cameras.main.scrollX + this.scale.width + 900);
       }
