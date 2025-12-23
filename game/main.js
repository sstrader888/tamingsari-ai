// ===== FULLSCREEN MOBILE GAME (SAFE AREA FIXED) =====

const WORLD_W = 3000;
const WORLD_H = 540;

// Safe area (px) – sesuai Android & iOS
const SAFE_TOP = 48;
const SAFE_BOTTOM = 88;

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

  // Player
  g.fillStyle(0x3aa0ff,1);
  g.fillRoundedRect(0,0,32,44,8);
  g.generateTexture("player",32,44);

  // Platform
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

  // UI
  ui.hint = this.add.text(16, SAFE_TOP, "◀ ▶ Gerak   ⤒ Lompat", {
    fontFamily:"Arial",
    fontSize:"16px",
    color:"#ffffff"
  }).setScrollFactor(0);

  createTouchUI.call(this);

  applyZoom.call(this);
  this.scale.on("resize",()=> {
    applyZoom.call(this);
    positionButtons.call(this);
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

function positionButtons(){
  const w=this.scale.width;
  const h=this.scale.height;

  const y = h - SAFE_BOTTOM;

  ui.leftBtn.setPosition(20, y);
  ui.rightBtn.setPosition(120, y);
  ui.jumpBtn.setPosition(w - 100, y);
}

// ===== Camera Zoom =====
function applyZoom(){
  const h=this.scale.height - SAFE_TOP - SAFE_BOTTOM;
  camZoom=Phaser.Math.Clamp((h*0.75)/WORLD_H,1,1.8);
  this.cameras.main.setZoom(camZoom);
}

function adjustZoom(d){
  camZoom=Phaser.Math.Clamp(camZoom+d,0.8,2.2);
  this.cameras.main.setZoom(camZoom);
}
