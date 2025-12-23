// ===== FAMILY PLATFORMER (STABLE VERSION) =====

const W = 960;
const H = 540;

let player, cursors;
let platforms;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  backgroundColor: "#1b1f2a",
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
  // World bounds
  this.physics.world.setBounds(0, 0, 3000, H);

  // Platforms
  platforms = this.physics.add.staticGroup();
  for (let x = 0; x < 3000; x += 64) {
    platforms.create(x + 32, H - 20, "platform").refreshBody();
  }

  // Player
  player = this.physics.add.sprite(120, H - 120, "player");
  player.setCollideWorldBounds(true);

  this.physics.add.collider(player, platforms);

  // Camera
  this.cameras.main.startFollow(player, true, 0.12, 0.12);
  this.cameras.main.setBounds(0, 0, 3000, H);

  // Keyboard (PC)
  cursors = this.input.keyboard.createCursorKeys();

  // Touch buttons (Mobile)
  this.touch = { left:false, right:false, jump:false };
  addTouchControls.call(this);

  // Hint
  this.add.text(16, 12, "Mobile: guna butang ◀ ▶ ⤒", {
    fontFamily: "Arial",
    fontSize: "16px",
    color: "#ffffff"
  }).setScrollFactor(0);
}

function update() {
  const speed = 260;

  const left = (cursors.left && cursors.left.isDown) || (this.touch && this.touch.left);
  const right = (cursors.right && cursors.right.isDown) || (this.touch && this.touch.right);
  const jumpPressed = (cursors.up && Phaser.Input.Keyboard.JustDown(cursors.up)) || (this.touch && this.touch.jump);

  // Move
  if (left) player.setVelocityX(-speed);
  else if (right) player.setVelocityX(speed);
  else player.setVelocityX(0);

  // Jump (sekali tekan)
  if (jumpPressed && player.body.blocked.down) {
    player.setVelocityY(-520);
  }
  if (this.touch) this.touch.jump = false; // reset jump after one use
}

function addTouchControls() {
  const btnStyle = {
    fontFamily: "Arial",
    fontSize: "22px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: { x: 16, y: 12 }
  };

  const leftBtn = this.add.text(24, H - 84, "◀", btnStyle).setScrollFactor(0).setInteractive();
  const rightBtn = this.add.text(92, H - 84, "▶", btnStyle).setScrollFactor(0).setInteractive();
  const jumpBtn = this.add.text(W - 86, H - 84, "⤒", btnStyle).setScrollFactor(0).setInteractive();

  // Left hold
  leftBtn.on("pointerdown", () => this.touch.left = true);
  leftBtn.on("pointerup", () => this.touch.left = false);
  leftBtn.on("pointerout", () => this.touch.left = false);

  // Right hold
  rightBtn.on("pointerdown", () => this.touch.right = true);
  rightBtn.on("pointerup", () => this.touch.right = false);
  rightBtn.on("pointerout", () => this.touch.right = false);

  // Jump tap
  jumpBtn.on("pointerdown", () => this.touch.jump = true);
}
