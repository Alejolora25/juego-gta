import * as pc from 'playcanvas';

export class Stage4ProjectileSystem {
 constructor(app,physics,combat,state){this.app=app;this.physics=physics;this.combat=combat;this.state=state;this.playerShots=[];this.enemyShots=[];}
 spawn(from,dir,{enemy=false}={}){
  const entity=new pc.Entity(enemy?'EnemyShot':'PlayerShot');entity.addComponent('render',{type:'sphere'});entity.setLocalScale(enemy?.32:.26,enemy?.32:.26,enemy?.32:.26);entity.setPosition(from.x,from.y,from.z);this.app.root.addChild(entity);
  const speed=enemy?16:28;const shot={entity,v:{x:dir.x*speed,y:dir.y*speed,z:dir.z*speed},life:3};(enemy?this.enemyShots:this.playerShots).push(shot);return shot;
 }
 shootPlayer(player,boss,locked=false){
  if(!this.combat.canPlayerShoot())return false;this.combat.registerPlayerShot();const p=player.getPosition(),b=boss.getPosition(),from={x:p.x,y:p.y+2.2,z:p.z};
  let dx,dz,dy;if(locked&&this.state.bossActive){dx=b.x-from.x;dy=b.y+2-from.y;dz=b.z-from.z;}else{const yaw=player.getEulerAngles().y*Math.PI/180;dx=-Math.sin(yaw);dy=0;dz=-Math.cos(yaw);}
  const length=Math.hypot(dx,dy,dz)||1;this.spawn(from,{x:dx/length,y:dy/length,z:dz/length});return true;
 }
 shootEnemy(boss,player){
  const b=boss.getPosition(),p=player.getPosition(),distance=Math.hypot(p.x-b.x,p.z-b.z);if(!this.combat.canBossShoot(distance))return false;this.combat.registerBossShot();const from={x:b.x,y:b.y+2.4,z:b.z},dx=p.x-from.x,dy=p.y+1.7-from.y,dz=p.z-from.z,length=Math.hypot(dx,dy,dz)||1;this.spawn(from,{x:dx/length,y:dy/length,z:dz/length},{enemy:true});return true;
 }
 update(dt,boss,player=null){
  for(let i=this.playerShots.length-1;i>=0;i--){const s=this.playerShots[i],p=s.entity.getPosition(),previous={x:p.x,y:p.y,z:p.z},next={x:p.x+s.v.x*dt,y:p.y+s.v.y*dt,z:p.z+s.v.z*dt};s.entity.setPosition(next.x,next.y,next.z);s.life-=dt;
   const blocked=this.physics.ready?this.physics.segmentBlocked(previous,next):false;if(blocked===true){this.remove(this.playerShots,i);continue;}
   const b=boss.getPosition(),hit=this.state.bossActive&&(this.physics.ready?this.physics.segmentHitsTarget(previous,next,{x:b.x,y:b.y+1.9,z:b.z},1.8):Math.hypot(next.x-b.x,next.y-(b.y+1.9),next.z-b.z)<1.8);
   if(hit){this.remove(this.playerShots,i);const defeated=this.combat.bossHit();continue;}
   if(s.life<=0)this.remove(this.playerShots,i);
  }
  if(player)for(let i=this.enemyShots.length-1;i>=0;i--){const s=this.enemyShots[i],p=s.entity.getPosition(),previous={x:p.x,y:p.y,z:p.z},next={x:p.x+s.v.x*dt,y:p.y+s.v.y*dt,z:p.z+s.v.z*dt};s.entity.setPosition(next.x,next.y,next.z);s.life-=dt;const blocked=this.physics.ready?this.physics.segmentBlocked(previous,next):false;if(blocked===true){this.remove(this.enemyShots,i);continue;}const a=player.getPosition(),hit=this.physics.ready?this.physics.segmentHitsTarget(previous,next,{x:a.x,y:a.y+1.6,z:a.z},1.1):Math.hypot(next.x-a.x,next.y-(a.y+1.6),next.z-a.z)<1.1;if(hit){this.remove(this.enemyShots,i);this.combat.playerHit();continue;}if(s.life<=0)this.remove(this.enemyShots,i);}
 }
 remove(list,index){list[index].entity.destroy();list.splice(index,1);}
 clear(){for(const list of [this.playerShots,this.enemyShots])while(list.length)this.remove(list,list.length-1);}
}
