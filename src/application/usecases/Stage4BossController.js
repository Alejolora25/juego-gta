export class Stage4BossController {
 constructor(entity,physics,{speed=2.3,stopDistance=9}={}){this.entity=entity;this.physics=physics;this.speed=speed;this.stopDistance=stopDistance;}
 update(player,dt,state){
  if(!state.bossActive||state.finished)return {moved:false,distance:Infinity};
  const a=this.entity.getPosition(),b=player.getPosition(),dx=b.x-a.x,dz=b.z-a.z,distance=Math.hypot(dx,dz);
  if(distance>0)this.entity.setEulerAngles(0,Math.atan2(-dx,-dz)*180/Math.PI,0);
  if(distance<=this.stopDistance||!distance)return {moved:false,distance};
  const desired={x:a.x+dx/distance*this.speed*dt,z:a.z+dz/distance*this.speed*dt};
  const allowed=this.physics.ready?this.physics.bossCanMoveTo(desired):true;
  if(allowed===null||allowed){this.entity.setPosition(desired.x,a.y,desired.z);return {moved:true,distance};}
  return {moved:false,distance};
 }
}
