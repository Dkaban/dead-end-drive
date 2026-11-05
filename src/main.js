import Phaser from 'phaser';
import './style.css';
const points=[{x:1150,y:350,name:'GAS STATION'},{x:2450,y:1050,name:'REPAIR YARD'},{x:3540,y:1810,name:'EVACUATION POINT'}];
const upgrades=[['turret','TRIGGER HAPPY','Fire 20% faster'],['damage','HEAVY ROUNDS','Increase bullet damage'],['engine','TURBO CHARGER','Faster driving'],['armor','WELDED ARMOR','More health and repairs'],['magnet','SCRAP MAGNET','Collect scrap from farther away'],['barrel','EXTRA BARREL','Fire additional bullets'],['bumper','SPIKED BUMPER','Do more ramming damage']];
const rand=(a,b)=>a+Math.random()*(b-a);
class Drive extends Phaser.Scene{
constructor(){super('Drive');}
create(){
 this.g=this.add.graphics();this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
 this.x=190;this.y=190;this.a=0;this.speed=0;this.hp=100;this.maxHp=100;this.xp=0;this.xpGoal=8;this.level=1;this.kills=0;this.leg=0;
 this.maxSpeed=300;this.accel=450;this.shotTimer=0;this.shotDelay=.5;this.damage=2;this.barrels=1;this.pickup=65;this.ram=2;
 this.z=[];this.b=[];this.scrap=[];this.spawnTimer=0;this.invuln=0;this.age=0;this.state='intro';
 this.cameras.main.setBounds(0,0,3900,2400);
 this.overlay('DEAD END DRIVE','THE HIGHWAY IS LOST','Drive your car through the zombie horde. Your turret fires automatically. Collect green scrap to upgrade and reach three yellow destinations.','START ENGINE',()=>{this.state='play';this.hide();});
}
el(id){return document.getElementById(id);}
overlay(title,kicker,copy,label,callback){
 this.el('overlay').classList.add('visible');this.el('overlay-title').textContent=title;this.el('overlay-kicker').textContent=kicker;
 this.el('overlay-copy').textContent=copy;this.el('upgrade-options').replaceChildren();
 const btn=this.el('overlay-button');btn.hidden=false;btn.textContent=label;btn.onclick=callback;
}
hide(){this.el('overlay').classList.remove('visible');}
upgrade(){
 this.state='upgrade';
 this.overlay('CHOOSE AN UPGRADE','LEVEL '+this.level,'Improve your ride before the horde catches up.','','');
 this.el('overlay-button').hidden=true;
 const options=[...upgrades].sort(()=>Math.random()-.5).slice(0,3);
 for(const [id,name,description] of options){
  const btn=document.createElement('button');btn.className='upgrade';btn.textContent=name+' — '+description;
  btn.onclick=()=>{this.apply(id);this.hide();this.state='play';};
  this.el('upgrade-options').append(btn);
 }
}
apply(id){
 if(id==='turret')this.shotDelay=Math.max(.12,this.shotDelay*.8);
 if(id==='damage')this.damage++;
 if(id==='engine'){this.maxSpeed+=45;this.accel+=55;}
 if(id==='armor'){this.maxHp+=25;this.hp=Math.min(this.maxHp,this.hp+45);}
 if(id==='magnet')this.pickup+=50;
 if(id==='barrel')this.barrels=Math.min(5,this.barrels+1);
 if(id==='bumper')this.ram+=3;
}
spawn(){
 if(this.z.length>140)return;
 const a=rand(0,Math.PI*2),r=rand(480,680);
 this.z.push({x:Phaser.Math.Clamp(this.x+Math.cos(a)*r,12,3888),y:Phaser.Math.Clamp(this.y+Math.sin(a)*r,12,2388),hp:3+this.leg*2,s:rand(55,85)+this.leg*15});
}
shoot(){
 let best=null,dd=450**2;
 for(const z of this.z){const d=(z.x-this.x)**2+(z.y-this.y)**2;if(d<dd){best=z;dd=d;}}
 if(!best)return;
 const a=Math.atan2(best.y-this.y,best.x-this.x);
 for(let i=0;i<this.barrels;i++){const v=a+(i-(this.barrels-1)/2)*.15;this.b.push({x:this.x,y:this.y,vx:Math.cos(v)*750,vy:Math.sin(v)*750,t:.8});}
}
kill(index){const z=this.z[index];this.scrap.push({x:z.x,y:z.y});this.z.splice(index,1);this.kills++;}
update(_,ms){
 const dt=Math.min(ms/1000,.05);
 if(this.state==='play'){
  this.age+=dt;this.spawnTimer+=dt;this.shotTimer+=dt;this.invuln=Math.max(0,this.invuln-dt);
  const f=this.keys.W.isDown||this.keys.UP.isDown,r=this.keys.S.isDown||this.keys.DOWN.isDown;
  if(f)this.speed=Math.min(this.maxSpeed,this.speed+this.accel*dt);
  else if(r)this.speed=Math.max(-this.maxSpeed*.55,this.speed-this.accel*dt);
  else this.speed*=Math.pow(.09,dt);
  const turn=(this.keys.D.isDown||this.keys.RIGHT.isDown?1:0)-(this.keys.A.isDown||this.keys.LEFT.isDown?1:0);
  if(Math.abs(this.speed)>10)this.a+=turn*2.7*dt*Math.sign(this.speed);
  this.x=Phaser.Math.Clamp(this.x+Math.cos(this.a)*this.speed*dt,25,3875);
  this.y=Phaser.Math.Clamp(this.y+Math.sin(this.a)*this.speed*dt,25,2375);
  if(this.spawnTimer>.48-Math.min(.24,this.age/250)){this.spawnTimer=0;this.spawn();}
  if(this.shotTimer>this.shotDelay){this.shotTimer=0;this.shoot();}
  for(let i=this.z.length-1;i>=0;i--){
   const z=this.z[i],d=Math.hypot(z.x-this.x,z.y-this.y)||1;
   z.x+=(this.x-z.x)/d*z.s*dt;z.y+=(this.y-z.y)/d*z.s*dt;
   if(d<25){
    if(Math.abs(this.speed)>70){z.hp-=this.ram*dt*8;if(z.hp<=0){this.kill(i);continue;}}
    if(this.invuln<=0){this.hp-=8;this.invuln=.45;if(this.hp<=0){this.state='lost';this.overlay('CAR DESTROYED','THE HORDE GOT YOU','Zombies eliminated: '+this.kills,'RETRY',()=>this.scene.restart());}}
   }
  }
  for(let i=this.b.length-1;i>=0;i--){
   const b=this.b[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.t-=dt;let hit=false;
   for(let j=this.z.length-1;j>=0;j--){const z=this.z[j];if((b.x-z.x)**2+(b.y-z.y)**2<200){z.hp-=this.damage;if(z.hp<=0)this.kill(j);hit=true;break;}}
   if(hit||b.t<=0)this.b.splice(i,1);
  }
  for(let i=this.scrap.length-1;i>=0;i--){const p=this.scrap[i];if(Math.hypot(p.x-this.x,p.y-this.y)<this.pickup){this.scrap.splice(i,1);this.xp++;if(this.xp>=this.xpGoal){this.xp=0;this.level++;this.xpGoal=Math.ceil(this.xpGoal*1.3);this.upgrade();break;}}}
  if(this.state==='play'&&Math.hypot(this.x-points[this.leg].x,this.y-points[this.leg].y)<80){
   this.leg++;this.hp=Math.min(this.maxHp,this.hp+35);
   if(this.leg===3){this.state='won';this.overlay('YOU SURVIVED','EVACUATION COMPLETE','You reached all three destinations and eliminated '+this.kills+' zombies.','PLAY AGAIN',()=>this.scene.restart());}
   else {this.level++;this.upgrade();}
  }
 }
 this.cameras.main.scrollX=Phaser.Math.Clamp(this.x-this.cameras.main.width/2,0,Math.max(0,3900-this.cameras.main.width));
 this.cameras.main.scrollY=Phaser.Math.Clamp(this.y-this.cameras.main.height/2,0,Math.max(0,2400-this.cameras.main.height));
 this.draw();this.hud();
}
draw(){
 const g=this.g;g.clear();g.fillStyle(0x1c2927);g.fillRect(0,0,3900,2400);
 g.lineStyle(1,0x32433d,.65);for(let x=0;x<3900;x+=140)g.lineBetween(x,0,x,2400);for(let y=0;y<2400;y+=140)g.lineBetween(0,y,3900,y);
 g.lineStyle(170,0x303b3c,.9);g.beginPath();g.moveTo(190,190);for(const p of points)g.lineTo(p.x,p.y);g.strokePath();
 g.lineStyle(3,0xd2bf88,.65);g.beginPath();g.moveTo(190,190);for(const p of points)g.lineTo(p.x,p.y);g.strokePath();
 for(let i=this.leg;i<points.length;i++){const p=points[i];g.lineStyle(3,i===this.leg?0xeabd64:0x778574);g.strokeCircle(p.x,p.y,60);g.strokeCircle(p.x,p.y,42);}
 for(const p of this.scrap){g.fillStyle(0x9ce86b);g.fillCircle(p.x,p.y,5);}
 for(const z of this.z){g.fillStyle(0x698b62);g.fillCircle(z.x,z.y,11);g.fillStyle(0xddf9ba);g.fillCircle(z.x-3,z.y-2,2);g.fillCircle(z.x+3,z.y-2,2);}
 for(const b of this.b){g.fillStyle(0xffd27e);g.fillCircle(b.x,b.y,4);}
 const c=Math.cos(this.a),s=Math.sin(this.a),v=[[-24,-14],[24,-14],[24,14],[-24,14]].map(([px,py])=>({x:this.x+px*c-py*s,y:this.y+px*s+py*c}));
 g.fillStyle(this.invuln>0?0xf27c60:0xd9ac60);g.fillPoints(v,true);g.lineStyle(3,0x101d20);g.strokePoints(v,true);
 g.fillStyle(0x2c4142);g.fillCircle(this.x,this.y,9);
 g.lineStyle(4,0xf5d68a);g.lineBetween(this.x,this.y,this.x+c*32,this.y+s*32);
}
hud(){
 const p=points[Math.min(this.leg,2)];
 this.el('hp-fill').style.width=Math.max(0,this.hp)*100/this.maxHp+'%';
 this.el('hp-label').textContent=Math.max(0,Math.ceil(this.hp))+' / '+this.maxHp;
 this.el('xp-fill').style.width=100*this.xp/this.xpGoal+'%';
 this.el('xp-label').textContent=this.xp+' / '+this.xpGoal;
 this.el('level-label').textContent='LVL '+this.level;
 this.el('kill-label').textContent=this.kills+' ELIMINATED';
 this.el('stage-label').textContent='LEG '+Math.min(3,this.leg+1)+' / 3';
 this.el('distance-label').textContent=Math.round(Math.hypot(this.x-p.x,this.y-p.y)/10)+' m';
 this.el('heading-label').style.transform='rotate('+(90+Math.atan2(p.y-this.y,p.x-this.x)*180/Math.PI)+'deg)';
 this.el('weapon-label').textContent='AUTO TURRET · '+this.barrels+' BARREL'+(this.barrels===1?'':'S');
}
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#172425',scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},scene:[Drive]});
