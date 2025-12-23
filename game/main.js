// ===== FULLSCREEN RESPONSIVE PLATFORMER (USER FRIENDLY) =====

const WORLD_W = 3000;
const WORLD_H = 540;

let player, cursors, platforms;
let touch = { left:false, right:false, jump:false };
let camZoom = 1;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#1b1f2a",
  scale: {
    mode: Phaser.Scale.RESIZE,     // 🔑 paling stabil
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
  addTouchUI.call(this);

  applyZoom.call(this);
  this.scale.on("resize",()=>applyZoom.call(this));

  // PC zoom
  this.input.keyboard.on("keydown-PLUS",()=>setZoom(0.1));
  this.input.keyboard.on("keydown-MINUS",()=>setZoom(-0.1));
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

// ===== UI & Helpers =====
function addTouchUI(){
  const style={
    fontFamily:"Arial",
    fontSize:"26px",
    color:"#fff",
    backgroundColor:"rgba(0,0,0,0.55)",
    padding:{x:24,y:18}
  };

  const h=this.scale.height;
  const m=24;

  const leftBtn=this.add.text(m,h-90,"◀",style).setScrollFactor(0).setInteractive();
  const rightBtn=this.add.text(m+96,h-90,"▶",style).setScrollFactor(0).setInteractive();
  const jumpBtn=this.add.text(this.scale.width-96,h-90,"⤒",style).setScrollFactor(0).setInteractive();

  leftBtn.on("pointerdown",()=>touch.left=true);
  leftBtn.on("pointerup",()=>touch.left=false);
  leftBtn.on("pointerout",()=>touch.left=false);

  rightBtn.on("pointerdown",()=>touch.right=true);
  rightBtn.on("pointerup",()=>touch.right=false);
  rightBtn.on("pointerout",()=>touch.right=false);

  jumpBtn.on("pointerdown",()=>touch.jump=true);
}

function applyZoom(){
  const h=this.scale.height;
  camZoom=Phaser.Math.Clamp((h*0.75)/WORLD_H,1,1.8);
  this.cameras.main.setZoom(camZoom);
}

function setZoom(d){
  camZoom=Phaser.Math.Clamp(camZoom+d,0.8,2.2);
  this.cameras.main.setZoom(camZoom);
}
