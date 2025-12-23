// ===== FAMILY PLATFORMER (STABLE VERSION) =====

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

let player, cursors;
let platforms;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: "#1b1f2a",
  scale: {
    mode: Phaser.Scale.FIT,       // 🔑 auto fit
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
  const g = this.make.graphics({ x: 0, y: 0, add: false });

  // Player (Ayah)
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
  // Resize handler (penting untuk mobile rotate)
  this.scale.on("resize", resize, this);
  resize({ width: window.innerWidth, height: window.innerHeight });

  // World
  this.physics.world.setBounds(0, 0, 3000, BASE_HEIGHT);

  // Platforms
  platforms = this.physics.add.staticGroup();
  for (let x = 0; x < 3000; x += 64) {
    platforms.create(x + 32, BASE_HEIGHT - 20, "platform").refreshBody();
  }

  // Player
  player = this.physics.add.sprite(120, BASE_HEIGHT - 120, "player");
  player.setCollideWorldBounds(true);

  this.physics.add.collider(player, platforms);

  // Camera
  this.cameras.main.startFollow(player, true, 0.12, 0.12);
  this.cameras.main.setBounds(0, 0, 3000, BASE_HEIGHT);

  // Keyboard (PC)
  cursors = this.input.keyboard.createCursorKeys();

  // Touch controls (Mobile)
  this.touch = { left:false, right:false, jump:false };
  addTouchControls.call(this);
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

function addTouchControls() {
  const btnStyle = {
    fontFamily: "Arial",
    fontSize: "24px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: { x: 18, y: 14 }
  };

  const leftBtn = this.add.text(30, BASE_HEIGHT - 90, "◀", btnStyle)
    .setScrollFactor(0).setInteractive();
  const rightBtn = this.add.text(110, BASE_HEIGHT - 90, "▶", btnStyle)
    .setScrollFactor(0).setInteractive();
  const jumpBtn = this.add.text(BASE_WIDTH - 100, BASE_HEIGHT - 90, "⤒", btnStyle)
    .setScrollFactor(0).setInteractive();

  leftBtn.on("pointerdown", () => this.touch.left = true);
  leftBtn.on("pointerup", () => this.touch.left = false);
  leftBtn.on("pointerout", () => this.touch.left = false);

  rightBtn.on("pointerdown", () => this.touch.right = true);
  rightBtn.on("pointerup", () => this.touch.right = false);
  rightBtn.on("pointerout", () => this.touch.right = false);

  jumpBtn.on("pointerdown", () => this.touch.jump = true);
}

function resize(gameSize) {
  const width = gameSize.width;
  const height = gameSize.height;
  this.cameras.resize(width, height);
}
