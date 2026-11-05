// Use Phaser's browser build so GitHub Pages can serve the source directly.
const Phaser = window.Phaser;
if (!Phaser) {
  document.getElementById('overlay').classList.add('visible');
  document.getElementById('overlay-title').textContent = 'UNABLE TO LOAD GAME';
  document.getElementById('overlay-kicker').textContent = 'PHASER LIBRARY NOT AVAILABLE';
  document.getElementById('overlay-copy').textContent = 'Please check your internet connection or browser extensions and refresh this page.';
  document.getElementById('overlay-button').hidden = true;
  throw new Error('Phaser did not load from the CDN');
}
const points=[{x:1150,y:350,name:'GAS STATION'},{x:2450,y:1050,name:'REPAIR YARD'},{x:3540,y:1810,name:'EVACUATION POINT'}];
const upgrades=[['turret','TRIGGER HAPPY','Fire 20% faster'],['damage','HEAVY ROUNDS','Increase bullet damage'],['engine','TURBO CHARGER','Faster driving'],['armor','WELDED ARMOR','More health and repairs'],['magnet','SCRAP MAGNET','Collect scrap from farther away'],['barrel','EXTRA BARREL','Fire additional bullets'],['bumper','SPIKED BUMPER','Do more ramming damage']];
const rand=(a,b)=>a+Math.random()*(b-a);
class Drive extends Phaser.Scene{
constructor(){super('Drive');}
create(){
 this.g=this.add.graphics();this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
 this.x=190;this.y=190;this.a=0;this.speed=0;this.hp=100;this.maxHp=100;this.xp=0;this.xpGoal=8;this.level=1;this.kills=0;this.leg=0;
 this.maxSpeed=300;this.accel=450;this.shotTimer=0;this.shotDelay=.5;this.damage=2;this.barrels=1;this.pickup=65;this.ram=2;
 this.visual={turret:0,damage:0,engine:0,armor:0,magnet:0,barrel:0,bumper:0};
 this.turretAim=0;
 this.z=[];this.b=[];this.scrap=[];this.spawnTimer=0;this.invuln=0;this.age=0;this.state='intro';
 this.cameras.main.setBounds(0,0,3900,2400);
 this.setupTouchControls();
 this.overlay('DEAD END DRIVE','THE HIGHWAY IS LOST','Drive your car through the zombie horde. Your turret fires automatically. Collect green scrap to upgrade and reach three yellow destinations.','START ENGINE',()=>{this.state='play';this.hide();});
}
el(id){return document.getElementById(id);}
setupTouchControls(){
 // A floating joystick: begin anywhere on the playfield and drag to drive.
 // Pointer capture keeps steering alive even if the finger leaves the canvas.
 this.touch=null;
 const canvas=this.game.canvas;
 const stick=this.el('touch-stick');
 const begin=(event)=>{
  if(this.state!=='play'||this.touch||(event.pointerType!=='touch'&&event.pointerType!=='pen'))return;
  event.preventDefault();
  this.touch={id:event.pointerId,originX:event.clientX,originY:event.clientY,dx:0,dy:0};
  stick.style.left=event.clientX+'px';
  stick.style.top=event.clientY+'px';
  stick.style.setProperty('--stick-x','0px');
  stick.style.setProperty('--stick-y','0px');
  stick.classList.add('active');
  if(canvas.setPointerCapture)canvas.setPointerCapture(event.pointerId);
 };
 const move=(event)=>{
  if(!this.touch||this.touch.id!==event.pointerId)return;
  event.preventDefault();
  this.touch.dx=event.clientX-this.touch.originX;
  this.touch.dy=event.clientY-this.touch.originY;
  const length=Math.hypot(this.touch.dx,this.touch.dy);
  const scale=length>55?55/length:1;
  stick.style.setProperty('--stick-x',this.touch.dx*scale+'px');
  stick.style.setProperty('--stick-y',this.touch.dy*scale+'px');
 };
 const end=(event)=>{
  if(this.touch&&this.touch.id===event.pointerId)this.clearTouch();
 };
 canvas.addEventListener('pointerdown',begin);
 canvas.addEventListener('pointermove',move);
 canvas.addEventListener('pointerup',end);
 canvas.addEventListener('pointercancel',end);
 canvas.addEventListener('lostpointercapture',end);
 this.events.once('shutdown',()=>{
  canvas.removeEventListener('pointerdown',begin);
  canvas.removeEventListener('pointermove',move);
  canvas.removeEventListener('pointerup',end);
  canvas.removeEventListener('pointercancel',end);
  canvas.removeEventListener('lostpointercapture',end);
  this.clearTouch();
 });
}
clearTouch(){
 this.touch=null;
 this.el('touch-stick').classList.remove('active');
}
overlay(title,kicker,copy,label,callback){
 this.clearTouch();
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
 // Keep a visual level for each upgrade so every choice changes the car.
 if(Object.prototype.hasOwnProperty.call(this.visual,id))this.visual[id]++;
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
 this.turretAim=a;
 for(let i=0;i<this.barrels;i++){const v=a+(i-(this.barrels-1)/2)*.15;this.b.push({x:this.x,y:this.y,vx:Math.cos(v)*750,vy:Math.sin(v)*750,t:.8});}
}
kill(index){const z=this.z[index];this.scrap.push({x:z.x,y:z.y});this.z.splice(index,1);this.kills++;}
update(_,ms){
 const dt=Math.min(ms/1000,.05);
 if(this.state==='play'){
  this.age+=dt;this.spawnTimer+=dt;this.shotTimer+=dt;this.invuln=Math.max(0,this.invuln-dt);
  const finger=this.touch;
  const drag=finger?Math.hypot(finger.dx,finger.dy):0;
  if(drag>12){
   // Finger displacement controls heading and automatic acceleration.
   const desired=Math.atan2(finger.dy,finger.dx);
   const delta=Math.atan2(Math.sin(desired-this.a),Math.cos(desired-this.a));
   const turnLimit=4.8*dt;
   this.a+=Phaser.Math.Clamp(delta,-turnLimit,turnLimit);
   const throttle=Phaser.Math.Clamp((drag-12)/68,.25,1);
   this.speed=Math.max(0,Math.min(this.maxSpeed,this.speed+this.accel*throttle*dt));
  }else{
   // Keyboard driving stays unchanged, including reversing.
   const f=this.keys.W.isDown||this.keys.UP.isDown,r=this.keys.S.isDown||this.keys.DOWN.isDown;
   if(f)this.speed=Math.min(this.maxSpeed,this.speed+this.accel*dt);
   else if(r)this.speed=Math.max(-this.maxSpeed*.55,this.speed-this.accel*dt);
   else this.speed*=Math.pow(.09,dt);
   const turn=(this.keys.D.isDown||this.keys.RIGHT.isDown?1:0)-(this.keys.A.isDown||this.keys.LEFT.isDown?1:0);
   if(Math.abs(this.speed)>10)this.a+=turn*2.7*dt*Math.sign(this.speed);
  }
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
 this.drawCar(g);
}

drawCar(g){
 // Car components are built from simple rotated shapes. Every upgrade adds
 // something to the existing car, rather than replacing its appearance.
 const v=this.visual,ca=Math.cos(this.a),sa=Math.sin(this.a);
 const pt=(x,y)=>({x:this.x+x*ca-y*sa,y:this.y+x*sa+y*ca});
 const poly=(vertices,color,outline=null,weight=1,alpha=1)=>{
  const p=vertices.map(([x,y])=>pt(x,y));
  g.fillStyle(color,alpha);g.fillPoints(p,true);
  if(outline!==null){g.lineStyle(weight,outline,1);g.strokePoints(p,true);}
 };
 const box=(x,y,w,h,color,outline=null,weight=1,alpha=1)=>
  poly([[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]],color,outline,weight,alpha);
 const dot=(x,y,r,color,alpha=1)=>{const p=pt(x,y);g.fillStyle(color,alpha);g.fillCircle(p.x,p.y,r);};
 const line=(x1,y1,x2,y2,color,width=2,alpha=1)=>{
  const a=pt(x1,y1),b=pt(x2,y2);g.lineStyle(width,color,alpha);g.lineBetween(a.x,a.y,b.x,b.y);
 };
 const lvl=(id)=>Math.min(v[id],5);

 // Dark chassis, four wheels and permanent front/rear bumpers.
 box(2,3,56,34,0x090f11,null,1,.35); // short ground shadow
 for(const x of [-16,17])for(const y of [-18,18]){
  box(x,y,15,9,0x121819,0x344444,1);
  line(x-5,y,x+5,y,0x526062,1);
 }
 if(v.engine){
  const turbo=lvl('engine');
  for(const y of [-11,11]){
   box(-32,y,15,5,0x768a91,0x27383d,1);
   const flame=Math.abs(this.speed)>45?6+turbo*3+Math.sin(this.age*35+y)*2:3;
   poly([[-37,y-3],[-37-flame,y],[-37,y+3]],turbo>2?0x65d7fb:0xf19a43);
   dot(-34,y,2,0xf9df8c);
  }
 }
 box(0,0,52,29,this.invuln>0?0xf07862:0xd9ac60,0x121c1e,2);
 // Hood, canopy, windscreen, headlights and tail lights.
 box(17,0,13,24,0xb78647);
 box(-6,0,27,20,0x4a6160,0x253336,1.5);
 box(7,0,5,19,0x9bc5b8);
 box(-19,0,4,21,0x2b3b40);
 line(-15,-10,-15,10,0xd7bb75,1.5);
 for(const y of [-10,10]){box(26,y,4,6,0xf8df9f);box(-26,y,4,6,0xe66b54);}
 // Paint striping makes the original car recognizable even after upgrades.
 line(-20,-6,21,-6,0xf2ce84,1.4,.65);

 // Armour adds broad steel plates, stronger roof plating and visible bolts.
 if(v.armor){
  const n=lvl('armor');
  for(const y of [-15,15]){
   box(0,y,33,5+n*.8,0x7e939b,0x2a3c41,1.3);
   for(const x of [-13,0,13])dot(x,y,1.4,0xd1dadd);
  }
  box(23,0,6+n,23,0x8ba0a6,0x23333a,1.5);
  for(const y of [-8,8])dot(23,y,1.5,0xe5e3ca);
  if(n>=2)for(const x of [-12,12]){box(x,0,5+n,16,0x677f87,0x26393c,1);}
  if(n>=3)for(const y of [-9,9])box(-18,y,13,5,0x9ca9a8,0x31454b,1);
 }

 // Engine upgrade: visible hood scoops, side vents and rear exhaust stacks.
 if(v.engine){
  const n=lvl('engine');
  box(17,0,10,12,0x334951,0x12242b,1.5);
  for(let k=0;k<Math.min(n+1,4);k++){
   const y=(k-(Math.min(n+1,4)-1)/2)*3.3;
   line(13,y,21,y,0x99c5d2,1.7);
  }
  if(n>=2)for(const y of [-12,12])box(-20,y,12,4,0xa0bcc1,0x23343a,1);
 }

 // Magnetic pickup upgrade adds electric coil units outside both doors.
 if(v.magnet){
  const n=lvl('magnet');
  for(const y of [-21,21]){
   box(-4,y,16,7,0x173d48,0x60e4e6,1.5);
   for(const x of [-10,-5,0,5])line(x,y-3,x+1,y+3,0x93f2ee,1.2);
   dot(8,y,2.4,0x8cfaff);
   if(n>=2)dot(-12,y,2,0x8cfaff);
  }
  // Subtle pulsing field shows the magnet is powered.
  if(this.state==='play'){
   g.lineStyle(1.4,0x5de2da,.15+.12*(1+Math.sin(this.age*6))/2);
   g.strokeCircle(this.x,this.y,this.pickup);
  }
 }

 // Spiked bumper is deliberately forward of the headlights so it reads at speed.
 if(v.bumper){
  const n=lvl('bumper');
  box(28,0,8,31,0x6a7f83,0x24353d,1.5);
  const count=Math.min(3+n,7);
  for(let i=0;i<count;i++){
   const y=(i-(count-1)/2)*Math.min(7,27/(count-1));
   poly([[31,y-2.6],[37+Math.min(n,4)*2,y],[31,y+2.6]],0xd5d9c8,0x3c4b4f,.8);
  }
  if(n>=3)for(const y of [-15,15]){
   poly([[5,y],[11,y+Math.sign(y)*10],[19,y]],0xc4d1d0,0x354e56,1);
  }
 }

 // Heavy ammunition is carried externally on the rear deck.
 if(v.damage){
  const n=lvl('damage');
  for(const y of [-9,9]){
   box(-10,y,13,6,0x684b28,0x221e18,1);
   for(let j=0;j<Math.min(n+1,4);j++){
    box(-14+j*3,y,2.1,4,0xffd371);
   }
  }
  if(n>=3)box(-20,0,7,12,0xe1ac50,0x49382a,1);
 }

 // Upgraded fire control adds an optic and exposed equipment to the turret.
 if(v.turret){
  const n=lvl('turret');
  box(-2,-9,9,5,0x3d6c72,0x0e262c,1);
  dot(-2,-9,2,0x55f3ef);
  if(n>=2){
   box(-2,9,9,5,0x3d6c72,0x0e262c,1);
   dot(-2,9,2,0x55f3ef);
  }
  if(n>=3)for(const x of [-8,8])dot(x,0,2,0x7ee8ed);
 }

 // Roof turret tracks enemies independently of the car's heading.
 dot(0,0,11,0x172a2c);
 dot(0,0,8,v.turret?0x607c88:0x3c5359);
 const aim=this.turretAim,ux=Math.cos(aim),uy=Math.sin(aim),px=-uy,py=ux;
 const barrels=Math.max(1,this.barrels);
 for(let i=0;i<barrels;i++){
  const o=(i-(barrels-1)/2)*5;
  const start=3,end=22+(v.damage?Math.min(v.damage,3)*3:0);
  const x1=this.x+ux*start+px*o,y1=this.y+uy*start+py*o;
  const x2=this.x+ux*end+px*o,y2=this.y+uy*end+py*o;
  g.lineStyle(v.damage?5:3.4,0x1a292d);g.lineBetween(x1,y1,x2,y2);
  g.lineStyle(v.damage?2.7:1.8,v.damage?0xe8bb60:0xa4c4bd);g.lineBetween(x1,y1,x2,y2);
  g.fillStyle(0xffd694);g.fillCircle(x2,y2,v.damage?2.5:1.8);
 }
 dot(0,0,4,0xb3c6b8);
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
