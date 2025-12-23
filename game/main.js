// ===== FULLSCREEN MOBILE GAME (FAMILY SHEET + SAFE UI + STABLE TOUCH) =====

// --- SPRITESHEET SETTINGS (ubah jika grid tak ngam) ---
const SHEET_KEY = "family";
const SHEET_URL = "assets/family_sheet.png";

// ✅ Kalau sprite nampak “lari grid”, tukar 64 ke 48/72/80 ikut sebenar.
const FRAME_W = 64;
const FRAME_H = 64;

// --- WORLD SETTINGS ---
const WORLD_W = 3000;
const WORLD_H = 540;

// UI safe padding
const SAFE_TOP = 64;

// ✅ Bawah: kita kira “safe bottom” + pastikan butang TAK terkeluar screen
function safeBottom(h) {
  // jangan terlalu tinggi sampai makan screen, tapi cukup elak nav bar
  return Math.max(120, Math.round(h * 0.18));
}

let player, cursors, platforms;
let touch = { left:false, right:false, jump:false };
let camZoom = 1;
let ui = {};

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#1b1f2a",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: { pixelArt:true, roundPixels:true },
  physics: {
    default: "arcade",
    arcade: { gravity:{ y:1200 }, debug:false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload(){
  // ✅ Load family spritesheet
  this.load.spritesheet(SHEET_KEY, SHEET_URL, {
    frameWidth: FRAME_W,
    frameHeight: FRAME_H
  });

  // Fallback textures (platform)
  const g = this.make.graphics({ add:false });

  g.clear();
  g.fillStyle(0x8b5a2b, 1);
  g.fillRect(0, 0, 64, 24);
  g.generateTexture("platform", 64, 24);

  // fallback player (kalau sheet gagal load)
  g.clear();
  g.fillStyle(0x3aa0ff, 1);
  g.fillRoundedRect(0, 0, 32, 44, 8);
  g.generateTexture("player_fallback", 32, 44);
}

function create(){
  // ✅ Stabilkan mobile: elak browser scroll / zoom gesture kacau input
  try {
    if (this.game?.canvas) this.game.canvas.style.touchAction = "none";
  } catch(e) {}

  this.input.mouse?.disableContextMenu?.();
  this.input.addPointer(2); // multi touch basic

  this.physics.world.setBounds(0,0,WORLD_W,WORLD_H);

  // Ground
  platforms = this.physics.add.staticGroup();
  for(let x=0;x<WORLD_W;x+=64){
    platforms.create(x+32, WORLD_H-20, "platform").refreshBody();
  }

  // ✅ Player from sheet (frame 0) - kalau sheet tak ada, guna fallback
  const canUseSheet = this.textures.exists(SHEET_KEY);
  player = canUseSheet
    ? this.physics.add.sprite(140, WORLD_H-120, SHEET_KEY, 0)
    : this.physics.add.sprite(140, WORLD_H-120, "player_fallback");

  player.setCollideWorldBounds(true);

  // Hitbox lebih kemas (untuk 64x64 sprite)
  if (canUseSheet) {
    player.setScale(1);
    player.body.setSize(28, 44, true);
    player.body.setOffset(
      Math.max(0, Math.floor((FRAME_W - 28) / 2)),
      Math.max(0, Math.floor((FRAME_H - 44) / 2))
    );
  }

  this.physics.add.collider(player,platforms);

  // Camera
  this.cameras.main.startFollow(player,true,0.12,0.12);
  this.cameras.main.setBounds(0,0,WORLD_W,WORLD_H);

  cursors = this.input.keyboard.createCursorKeys();

  // ✅ Animations (ambil 3 frame pertama sebagai walk, frame 0 idle)
  // Kalau Cikgu nak set walk frame lain, tukar range ini.
  if (canUseSheet && !this.anims.exists("idle")) {
    this.anims.create({
      key: "idle",
      frames: [{ key: SHEET_KEY, frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers(SHEET_KEY, { start: 1, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
  }

  // Hint text (auto scale ikut screen)
  ui.hint = this.add.text(16, SAFE_TOP, "◀ ▶ Gerak   ⤒ Lompat", {
    fontFamily:"Arial",
    fontSize: "16px",
    color:"#ffffff"
  }).setScrollFactor(0);

  createTouchUI.call(this);

  applyZoom.call(this);
  positionUI.call(this);

  this.scale.on("resize", () => {
    applyZoom.call(this);
    positionUI.call(this);
  });

  // PC zoom
  this.input.keyboard.on("keydown-PLUS",()=>adjustZoom.call(this, 0.1));
  this.input.keyboard.on("keydown-MINUS",()=>adjustZoom.call(this, -0.1));
}

function update(){
  const speed = 260;

  const left = (cursors.left?.isDown) || touch.left;
  const right = (cursors.right?.isDown) || touch.right;

  // mobile jump (touch.jump) + keyboard up
  const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || touch.jump;

  if(left){
    player.setVelocityX(-speed);
    if (player.anims) player.setFlipX(true);
  } else if(right){
    player.setVelocityX(speed);
    if (player.anims) player.setFlipX(false);
  } else {
    player.setVelocityX(0);
  }

  if(jumpPressed && player.body.blocked.down){
    player.setVelocityY(-520);
  }
  touch.jump = false;

  // Anim control
  if (player.anims && this.textures.exists(SHEET_KEY)) {
    if (!player.body.blocked.down) {
      player.anims.play("idle", true);
    } else if (left || right) {
      player.anims.play("walk", true);
    } else {
      player.anims.play("idle", true);
    }
  }
}

// ===== UI =====
function createTouchUI(){
  // Auto scale UI ikut screen (lebih friendly mobile)
  const w = this.scale.width;
  const h = this.scale.height;
  const base = Math.max(0.9, Math.min(1.25, Math.min(w, h) / 420));

  const style = {
    fontFamily: "Arial",
    fontSize: Math.round(26 * base) + "px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.60)",
    padding: { x: Math.round(24 * base), y: Math.round(18 * base) }
  };

  ui.leftBtn  = this.add.text(0,0,"◀",style).setScrollFactor(0).setInteractive({ useHandCursor:false });
  ui.rightBtn = this.add.text(0,0,"▶",style).setScrollFactor(0).setInteractive({ useHandCursor:false });
  ui.jumpBtn  = this.add.text(0,0,"⤒",style).setScrollFactor(0).setInteractive({ useHandCursor:false });

  // ✅ Elak “stuck key” bila jari keluar kawasan
  const bindHold = (btn, keyName) => {
    btn.on("pointerdown", (p, lx, ly, e) => { touch[keyName] = true; e?.preventDefault?.(); });
    btn.on("pointerup",   () => { touch[keyName] = false; });
    btn.on("pointerout",  () => { touch[keyName] = false; });
    btn.on("pointerupoutside", () => { touch[keyName] = false; });
  };

  bindHold(ui.leftBtn, "left");
  bindHold(ui.rightBtn, "right");

  // Jump: sekali tekan
  ui.jumpBtn.on("pointerdown", (p, lx, ly, e) => { touch.jump = true; e?.preventDefault?.(); });

  // Hint auto scale
  ui.hint.setFontSize(Math.round(16 * base));
}

function positionUI(){
  const w = this.scale.width;
  const h = this.scale.height;

  // Hint top
  ui.hint.setPosition(16, SAFE_TOP);

  // ✅ Pastikan butang sepenuhnya dalam screen
  const bottomPad = safeBottom(h);
  const btnH = ui.leftBtn.height || 60;

  // y akhir = h - bottomPad - btnH (supaya tak terpotong bawah)
  const y = Math.max(SAFE_TOP + 30, h - bottomPad - btnH);

  const xLeft = 18;
  const gap = Math.max(92, Math.round(w * 0.16)); // responsive gap

  ui.leftBtn.setPosition(xLeft, y);
  ui.rightBtn.setPosition(xLeft + gap, y);

  // Jump kanan (pastikan tak keluar kanan)
  const jumpW = ui.jumpBtn.width || 80;
  ui.jumpBtn.setPosition(Math.max(10, w - jumpW - 18), y);
}

// ===== Camera Zoom =====
function applyZoom(){
  const w = this.scale.width;
  const h = this.scale.height;

  // ruang usable: buang top + safe bottom
  const usableH = h - SAFE_TOP - safeBottom(h);

  // zoom ikut ketinggian world (world height kecil)
  camZoom = Phaser.Math.Clamp((usableH * 0.92) / WORLD_H, 1, 2.0);

  // kalau screen terlalu sempit, clamp sedikit supaya tak “overscale”
  if (w < 360) camZoom = Math.min(camZoom, 1.6);

  this.cameras.main.setZoom(camZoom);
}

function adjustZoom(d){
  camZoom = Phaser.Math.Clamp(camZoom + d, 0.8, 2.2);
  this.cameras.main.setZoom(camZoom);
}
