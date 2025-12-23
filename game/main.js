
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
    mode: Phaser.Scale.ENVELOP,          // 🔥 FULL SCREEN MOBILE
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

  // PLAYER (Ayah)
  g.clear();
  g.fillStyle(0x3aa0ff, 1);
  g.fillRoundedRect(0, 0, 32, 44, 8);
  g.generateTexture("player", 32, 44);

  // PLATFORM
  g.clear();
  g.fillStyle(0x8b5a2b, 1);
  g.fillRect(0, 0, 64, 24);
  g.generateTexture("platform", 64, 24);
}

function create() {
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

  // Touch control (Mobile)
  this.touch = { left: false, right: false, jump: false };
  addTouchControls.call(this);

  // Hint
  this.add.text(20, 20, "◀ ▶ Gerak   ⤒ Lompat", {
    fontFamily: "Arial",
    fontSize: "18px",
    color: "#ffffff"
  }).setScrollFactor(0);
}

function update() {
  const speed = 260;

  const left =
    (cursors.left && cursors.left.isDown) || this.touch.left;
  const right =
    (cursors.right && cursors.right.isDown) || this.touch.right;
  const jumpPressed =
    (cursors.up && Phaser.Input.Keyboard.JustDown(cursors.up)) ||
    this.touch.jump;

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
    fontSize: "28px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: { x: 22, y: 16 }
  };

  // LEFT
  const leftBtn = this.add.text(
    50,
    BASE_HEIGHT - 150,
    "◀",
    btnStyle
  )
    .setScrollFactor(0)
    .setScale(1.3)
    .setInteractive();

  // RIGHT
  const rightBtn = this.add.text(
    160,
    BASE_HEIGHT - 150,
    "▶",
    btnStyle
  )
    .setScrollFactor(0)
    .setScale(1.3)
    .setInteractive();

  // JUMP
  const jumpBtn = this.add.text(
    BASE_WIDTH - 160,
    BASE_HEIGHT - 150,
    "⤒",
    btnStyle
  )
    .setScrollFactor(0)
    .setScale(1.4)
    .setInteractive();

  // Events
  leftBtn.on("pointerdown", () => (this.touch.left = true));
  leftBtn.on("pointerup", () => (this.touch.left = false));
  leftBtn.on("pointerout", () => (this.touch.left = false));

  rightBtn.on("pointerdown", () => (this.touch.right = true));
  rightBtn.on("pointerup", () => (this.touch.right = false));
  rightBtn.on("pointerout", () => (this.touch.right = false));

  jumpBtn.on("pointerdown", () => (this.touch.jump = true));
}
