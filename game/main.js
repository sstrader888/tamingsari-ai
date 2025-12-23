// ===== PORTRAIT (9:16) + STABLE MOBILE CONTROLS + PC ZOOM =====

// Frame portrait base size (akan scale ikut container #frame)
const GAME_W = 405;   // sesuai untuk phone
const GAME_H = 720;   // 9:16

// World side scroll
const WORLD_W = 3000;
const WORLD_H = 540;

let player, cursors, platforms;
let ui = {};

let camZoom = 1.0;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_W,
  height: GAME_H,
  backgroundColor: "#1b1f2a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: { pixelArt: true, roundPixels: true },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
  const g = this.make.graphics({ x: 0, y: 0, add: false });

  // Player
  g.clear();
  g.fillStyle(0x3aa0ff, 1);
  g.fillRoundedRect(0, 0, 32, 44, 8);
  g.generateTexture("player", 32, 44);

  // Platform
  g.clear();
  g.fillStyle(0x8b5a2b, 1);
  g.fillRect(0, 0, 64, 24);
  g.generateTexture("platform", 64, 24);
}

function create() {
  // World bounds
  this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

  // Platforms
  platforms = this.physics.add.staticGroup();
  for (let x = 0; x < WORLD_W; x += 64) {
    platforms.create(x + 32, WORLD_H - 20, "platform").refreshBody();
  }

  // Player
  player = this.physics.add.sprite(120, WORLD_H - 120, "player");
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);

  // Camera: follow player, crop ikut portrait frame
  this.cameras.main.startFollow(player, true, 0.12, 0.12);
  this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  // Zoom default untuk portrait (bagi nampak besar)
  camZoom = calcPortraitZoom(this.scale.width, this.scale.height);
  this.cameras.main.setZoom(camZoom);

  // Controls
  cursors = this.input.keyboard.createCursorKeys();
  this.touch = { left:false, right:false, jump:false };

  // UI: text + buttons
  ui.hint = this.add.text(12, 10, "◀ ▶ Gerak   ⤒ Lompat", {
    fontFamily: "Arial",
    fontSize: "14px",
    color: "#ffffff"
  }).setScrollFactor(0);

  createTouchButtons.call(this);

  // Reposition UI on resize (important)
  this.scale.on("resize", (gs) => {
    // keep zoom good for portrait
    camZoom = calcPortraitZoom(gs.width, gs.height);
    this.cameras.main.setZoom(camZoom);

    // reposition buttons
    positionTouchButtons.call(this, gs.width, gs.height);
  });

  // PC Zoom: +/- keys
  this.input.keyboard.on("keydown-PLUS", () => adjustZoom.call(this, +0.1));
  this.input.keyboard.on("keydown-NUMPAD_ADD", () => adjustZoom.call(this, +0.1));
  this.input.keyboard.on("keydown-MINUS", () => adjustZoom.call(this, -0.1));
  this.input.keyboard.on("keydown-NUMPAD_SUBTRACT", () => adjustZoom.call(this, -0.1));
}

function update() {
  const speed = 260;

  const left = (cursors.left && cursors.left.isDown) || this.touch.left;
  const right = (cursors.right && cursors.right.isDown) || this.touch.right;
  const jumpPressed =
    (cursors.up && Phaser.Input.Keyboard.JustDown(cursors.up)) || this.touch.jump;

  if (left) player.setVelocityX(-speed);
  else if (right) player.setVelocityX(speed);
  else player.setVelocityX(0);

  if (jumpPressed && player.body.blocked.down) {
    player.setVelocityY(-520);
  }
  this.touch.jump = false;
}

// ---------- UI Helpers ----------
function createTouchButtons() {
  const btnStyle = {
    fontFamily: "Arial",
    fontSize: "22px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: { x: 18, y: 14 }
  };

  ui.leftBtn = this.add.text(0, 0, "◀", btnStyle).setScrollFactor(0).setInteractive();
  ui.rightBtn = this.add.text(0, 0, "▶", btnStyle).setScrollFactor(0).setInteractive();
  ui.jumpBtn = this.add.text(0, 0, "⤒", btnStyle).setScrollFactor(0).setInteractive();

  // bigger hit
  ui.leftBtn.setPadding(22, 18, 22, 18);
  ui.rightBtn.setPadding(22, 18, 22, 18);
  ui.jumpBtn.setPadding(26, 20, 26, 20);

  // events
  ui.leftBtn.on("pointerdown", () => (this.touch.left = true));
  ui.leftBtn.on("pointerup", () => (this.touch.left = false));
  ui.leftBtn.on("pointerout", () => (this.touch.left = false));

  ui.rightBtn.on("pointerdown", () => (this.touch.right = true));
  ui.rightBtn.on("pointerup", () => (this.touch.right = false));
  ui.rightBtn.on("pointerout", () => (this.touch.right = false));

  ui.jumpBtn.on("pointerdown", () => (this.touch.jump = true));

  // initial position
  positionTouchButtons.call(this, this.scale.width, this.scale.height);
}

function positionTouchButtons(screenW, screenH) {
  // Safe margins inside portrait frame
  const margin = Math.max(14, Math.floor(screenW * 0.03));
  const bottomY = screenH - margin - 70; // 70px up from bottom

  ui.leftBtn.x = margin;
  ui.leftBtn.y = bottomY;

  ui.rightBtn.x = margin + 86;
  ui.rightBtn.y = bottomY;

  ui.jumpBtn.x = screenW - margin - 72;
  ui.jumpBtn.y = bottomY;
}

// Portrait zoom: make world height visible nicely in portrait
function calcPortraitZoom(screenW, screenH) {
  // show world with some space for UI
  const targetH = screenH * 0.78; // leave bottom for buttons
  const z = targetH / WORLD_H;
  return Phaser.Math.Clamp(z, 1.0, 1.8);
}

function adjustZoom(delta) {
  camZoom = Phaser.Math.Clamp(camZoom + delta, 0.8, 2.2);
  this.cameras.main.setZoom(camZoom);
}
