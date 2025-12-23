// ===== FULLSCREEN MOBILE GAME (SAFE AREA DYNAMIC) =====

const WORLD_W = 3000;
const WORLD_H = 540;

// min safe padding (akan tambah dinamik ikut device)
const SAFE_TOP_MIN = 56;
const SAFE_BOTTOM_MIN = 120;

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
  const g = this.make.graphics({ add:false });

  g.fillStyle(0x3aa0ff,1);
  g.fillRoundedRect(0,0,32,44,8);
  g.generateTexture("player",32,44);

  g.clear();
  g.fillStyle(0x8b5a2b,1);
  g.fillRect(0,0,64,24);
  g.generateTexture("platform",64,24);
}

function create(){
  this.physics.world.setBounds(0,0,WORLD_W,WORLD_H);

  platforms = this.physics.add.staticGroup();
  for(let x=0;x<WORLD_W;x+=64){
    platforms.create(x+32,WORLD_H-20,"platform").refreshBody();
  }

  player = this.physics.add.sprite(120,WORLD_H-120,"player");
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player,platforms);

  this.cameras.main.startFollow(player,true,0.12,0.12);
  this.cameras.main.setBounds(0,0,WORLD_W,WORLD_H);

  cursors = this.input.keyboard.createCursorKeys();

  // UI hint (letak bawah sedikit dari top)
  ui.hint = this.add.text(16, SAFE_TOP_MIN, "◀ ▶ Gerak   ⤒ Lompat", {
    fontFamily:"Arial",
    fontSize:"16px",
    color:"#ffffff"
  }).setScrollFactor(0);

  createTouchUI.call(this);

  applyZoom.call(this);
  this.scale.on("resize",()=> {
    applyZoom.call(this);
    positionButtons.call(this);
    positionHint.call(this);
  });

  // PC zoom
  this.input.keyboard.on("keydown-PLUS",()=>adjustZoom(0.1));
  this.input.keyboard.on("keydown-MINUS",()=>adjustZoom(-0.1));
}

function update(){
  const speed=260;
  const left=(cursors.left?.isDown)||touch.left;
  const right=(cursors.right?.isDown)||touch.right;
  const jump=(Phaser.Input.Keyboard.JustDown(cursors.up)||touch.jump);

  if(left) player.setVelocityX(-speed);
  else if(right) player.setVelocityX(speed);
  else player.setVelocityX(0);

  if(jump && player.body.blocked.down){
    player.setVelocityY(-520);
  }
  touch.jump=false;
}

// ===== UI =====
function createTouchUI(){
  const style={
    fontFamily:"Arial",
    fontSize:"26px",
    color:"#fff",
    backgroundColor:"rgba(0,0,0,0.55)",
    padding:{x:24,y:18}
  };

  ui.leftBtn=this.add.text(0,0,"◀",style).setScrollFactor(0).setInteractive();
  ui.rightBtn=this.add.text(0,0,"▶",style).setScrollFactor(0).setInteractive();
  ui.jumpBtn=this.add.text(0,0,"⤒",style).setScrollFactor(0).setInteractive();

  ui.leftBtn.on("pointerdown",()=>touch.left=true);
  ui.leftBtn.on("pointerup",()=>touch.left=false);
  ui.leftBtn.on("pointerout",()=>touch.left=false);

  ui.rightBtn.on("pointerdown",()=>touch.right=true);
  ui.rightBtn.on("pointerup",()=>touch.right=false);
  ui.rightBtn.on("pointerout",()=>touch.right=false);

  ui.jumpBtn.on("pointerdown",()=>touch.jump=true);

  positionButtons.call(this);
}

function getSafeTop(){
  // top safe: minimum + sikit margin
  return Math.max(SAFE_TOP_MIN, Math.round(this.scale.height * 0.05));
}

function getSafeBottom(){
  // bottom safe: minimum + ikut tinggi device (phone yg ada nav bar tebal)
  // + extra margin supaya tak pernah potong
  const dyn = Math.round(this.scale.height * 0.16);
  return Math.max(SAFE_BOTTOM_MIN, dyn) + 20;
}

function positionHint(){
  ui.hint.setY(getSafeTop.call(this));
}

function positionButtons(){
  const w=this.scale.width;
  const h=this.scale.height;

  const safeB = getSafeBottom.call(this);

  // letak button naik dari nav bar
  const y = h - safeB;

  const xLeft = 22;
  const gap = 110;

  ui.leftBtn.setPosition(xLeft, y);
  ui.rightBtn.setPosition(xLeft + gap, y);
  ui.jumpBtn.setPosition(w - 105, y);
}

// ===== Camera Zoom =====
function applyZoom(){
  const safeT = getSafeTop.call(this);
  const safeB = getSafeBottom.call(this);

  const usableH = this.scale.height - safeT - safeB;

  // zoom ikut ruang boleh nampak (tak ganggu UI bawah)
  camZoom = Phaser.Math.Clamp((usableH * 0.82) / WORLD_H, 1, 1.9);
  this.cameras.main.setZoom(camZoom);
}

function adjustZoom(d){
  camZoom=Phaser.Math.Clamp(camZoom+d,0.8,2.2);
  this.cameras.main.setZoom(camZoom);
}
