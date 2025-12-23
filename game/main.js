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
  // World
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
  this.cameras.main.startFollow(player);
  this.cameras.main.setBounds(0, 0, 3000, H);

  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  const speed = 260;

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
  } else {
    player.setVelocityX(0);
  }

  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-520);
  }
}
