/* Family Platformer - Phaser 3 (no external assets)
   - Player run/jump
   - Platforms
   - Coins
   - Enemy patrol
   - Camera follow + HUD
*/

const W = 960;
const H = 540;

let player, cursors, keys, scoreText, hintText;
let platforms, coins, enemies;
let score = 0;

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
  // Generate simple textures (rectangles/circles) so no need images
  const g = this.make.graphics({ x: 0, y: 0, add: false });

  // Player (blue)
  g.clear();
  g.fillStyle(0x3aa0ff, 1);
  g.fillRoundedRect(0, 0, 32, 44, 8);
  g.fillStyle(0xffffff, 1); // “glasses” line
  g.fillRect(6, 16, 20, 4);
  g.generateTexture("player", 32, 44);

  // Platform (brown)
  g.clear();
  g.fillStyle(0x8b5a2b, 1);
  g.fillRect(0, 0, 64, 24);
  g.fillStyle(0x6f421b, 1);
  g.fillRect(0, 18, 64, 6);
  g.generateTexture("platform", 64, 24);

  // Coin (yellow)
  g.clear();
  g.fillStyle(0xffd24a, 1);
  g.fillCircle(10, 10, 10);
  g.fillStyle(0xfff2b0, 1);
  g.fillCircle(7, 7, 4);
  g.generateTexture("coin", 20, 20);

  // Enemy (red)
  g.clear();
  g.fillStyle(0xff4a4a, 1);
  g.fillRoundedRect(0, 0, 34, 30, 6);
  g.fillStyle(0x111111, 1);
  g.fillCircle(10, 12, 3);
  g.fillCircle(24, 12, 3);
  g.generateTexture("enemy", 34, 30);
}

function create() {
  score = 0;

  // World bounds bigger than screen (side-scrolling)
  this.physics.world.setBounds(0, 0, 3000, H);

  // Platforms group
  platforms = this.physics.add.staticGroup();

  // Ground platforms
  for (let x = 0; x < 3000; x += 64) {
    platforms.create(x + 32, H - 20, "platform").setScale(1, 1).refreshBody();
  }

  // Floating platforms (level design simple)
  const floats = [
    [300, 420], [480, 360], [650, 300], [900, 380],
    [1200, 320], [1450, 260], [1750, 340], [2050, 280],
    [2350, 360], [2650, 300]
  ];
  floats.forEach(([x, y]) => platforms.create(x, y, "platform").refreshBody());

  // Player
  player = this.physics.add.sprite(120, H - 120, "player");
  player.setCollideWorldBounds(true);
  player.setBounce(0.05);
  player.body.setSize(24, 42).setOffset(4, 2);

  // Collide player with platforms
  this.physics.add.collider(player, platforms);

  // Coins
  coins = this.physics.add.group({ allowGravity: false, immovable: true });
  const coinSpots = [
    [300, 380], [480, 320], [650, 260], [900, 340],
    [1200, 280], [1450, 220], [1750, 300], [2050, 240],
    [2350, 320], [2650, 260], [2800, H - 80]
  ];
  coinSpots.forEach(([x, y]) => coins.create(x, y, "coin"));

  // Overlap: collect coin
  this.physics.add.overlap(player, coins, (p, c) => {
    c.destroy();
    score += 10;
    scoreText.setText(`Score: ${score}`);
  });

  // Enemies
  enemies = this.physics.add.group();
  const enemySpots = [
    [800, H - 80],
    [1600, H - 80],
    [2400, H - 80]
  ];
  enemySpots.forEach(([x, y]) => {
    const e = enemies.create(x, y, "enemy");
    e.setCollideWorldBounds(true);
    e.setBounce(0);
    e.body.setSize(32, 28).setOffset(1, 2);
    e.setVelocityX(120);
    e.patrolMinX = x - 140;
    e.patrolMaxX = x + 140;
  });

  // Enemies collide with platforms
  this.physics.add.collider(enemies, platforms);

  // Player hits enemy = restart (simple)
  this.physics.add.overlap(player, enemies, () => {
    this.scene.restart();
  });

  // Camera follow player
  this.cameras.main.startFollow(player, true, 0.12, 0.12);
  this.cameras.main.setBounds(0, 0, 3000, H);

  // Controls
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys("A,D,W,SPACE,R");

  // HUD (fixed on screen)
  scoreText = this.add.text(16, 12, "Score: 0", {
    fontFamily: "Arial",
    fontSize: "20px",
    color: "#ffffff"
  }).setScrollFactor(0);

  hintText = this.add.text(16, 38, "← → / A D untuk gerak, ↑ / W / Space lompat, R restart", {
    fontFamily: "Arial",
    fontSize: "14px",
    color: "#cbd5e1"
  }).setScrollFactor(0);

  // Optional: quick touch buttons (mobile)
  addTouchControls.call(this);
}

function update() {
  const left = cursors.left.isDown || keys.A.isDown;
  const right = cursors.right.isDown || keys.D.isDown;
  const jump = Phaser.Input.Keyboard.JustDown(cursors.up) ||
               Phaser.Input.Keyboard.JustDown(keys.W) ||
               Phaser.Input.Keyboard.JustDown(keys.SPACE);

  const speed = 260;

  if (left) player.setVelocityX(-speed);
  else if (right) player.setVelocityX(speed);
  else player.setVelocityX(0);

  // Jump only if on ground
  if (jump && player.body.blocked.down) {
    player.setVelocityY(-520);
  }

  // Enemies patrol
  enemies.children.iterate((e) => {
    if (!e) return;
    if (e.x < e.patrolMinX) e.setVelocityX(120);
    if (e.x > e.patrolMaxX) e.setVelocityX(-120);
  });

  if (Phaser.Input.Keyboard.JustDown(keys.R)) {
    this.scene.restart();
  }
}

function addTouchControls() {
  const cam = this.cameras.main;
  const btnStyle = { fontFamily: "Arial", fontSize: "18px", color: "#fff", backgroundColor: "rgba(0,0,0,0.35)", padding: { x: 14, y: 10 } };

  // Left button
  const leftBtn = this.add.text(30, H - 70, "◀", btnStyle).setScrollFactor(0).setInteractive();
  const rightBtn = this.add.text(95, H - 70, "▶", btnStyle).setScrollFactor(0).setInteractive();
  const jumpBtn = this.add.text(W - 90, H - 70, "⤒", btnStyle).setScrollFactor(0).setInteractive();

  leftBtn.on("pointerdown", () => { leftBtn.isHeld = true; });
  leftBtn.on("pointerup", () => { leftBtn.isHeld = false; });
  leftBtn.on("pointerout", () => { leftBtn.isHeld = false; });

  rightBtn.on("pointerdown", () => { rightBtn.isHeld = true; });
  rightBtn.on("pointerup", () => { rightBtn.isHeld = false; });
  rightBtn.on("pointerout", () => { rightBtn.isHeld = false; });

  jumpBtn.on("pointerdown", () => { jumpBtn.justPressed = true; });

  // Hook into update via events
  this.events.on("preupdate", () => {
    // emulate keyboard states
    if (leftBtn.isHeld) player.setVelocityX(-260);
    if (rightBtn.isHeld) player.setVelocityX(260);

    if (jumpBtn.justPressed && player.body.blocked.down) {
      player.setVelocityY(-520);
    }
    jumpBtn.justPressed = false;
  });
}
