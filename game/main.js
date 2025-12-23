// ===== STABLE MOBILE PLATFORMER (RESIZE + MANUAL ZOOM) =====
const WORLD_W = 3000;
const WORLD_H = 540; // tinggi dunia (platform ground)

let player, cursors, platforms;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#1b1f2a",
  scale: {
    mode: Phaser.Scale.RESIZE,              // ✅ paling stabil untuk mobile
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

  // Camera
  this.cameras.main.startFollow(player, true, 0.12, 0.12);
  this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  // Keyboard (PC)
  cursors = this.input.keyboard.createCursorKeys();

  // Touch (Mobile)
  this.touch = { left:false, right:false, jump:false };
  addTouchControls.call(this);

  // Apply zoom based on screen size
  applyZoom.call(this);

  // Re-apply on resize (rotate / address bar changes)
  this.scale.on("resize", () => applyZoom.call(this));
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

function applyZoom() {
  const cam = this.cameras.main;
  const w = this.scale.width;
  const h = this.scale.height;

  // Target: world height fit nicely (avoid too small/too huge)
  // Clamp zoom for stability across devices.
  const zoom = Phaser.Math.Clamp(h / WORLD_H, 0.9, 1.6);
  cam.setZoom(zoom);
}

function addTouchControls() {
  const cam = this.cameras.main;

  const btnStyle = {
    fontFamily: "Arial",
    fontSize: "26px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: { x: 22, y: 16 }
  };

  // place buttons relative to WORLD_H, then pin with scrollFactor(0)
  const leftBtn = this.add.text(40, WORLD_H - 140, "◀", btnStyle)
    .setScrollFactor(0).setInteractive();
  const rightBtn = this.add.text(140, WORLD_H - 140, "▶", btnStyle)
    .setScrollFactor(0).setInteractive();
  const jumpBtn = this.add.text(820, WORLD_H - 140, "⤒", btnStyle)
    .setScrollFactor(0).setInteractive();

  // Bigger hit area (stabil touch)
  leftBtn.setPadding(26, 20, 26, 20);
  rightBtn.setPadding(26, 20, 26, 20);
  jumpBtn.setPadding(28, 22, 28, 22);

  leftBtn.on("pointerdown", () => (this.touch.left = true));
  leftBtn.on("pointerup", () => (this.touch.left = false));
  leftBtn.on("pointerout", () => (this.touch.left = false));

  rightBtn.on("pointerdown", () => (this.touch.right = true));
  rightBtn.on("pointerup", () => (this.touch.right = false));
  rightBtn.on("pointerout", () => (this.touch.right = false));

  jumpBtn.on("pointerdown", () => (this.touch.jump = true));
}
