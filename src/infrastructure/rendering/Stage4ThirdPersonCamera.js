import * as pc from 'playcanvas';

export class Stage4ThirdPersonCamera {
 constructor(camera,{yaw=0,height=5.4,distance=8.5,targetHeight=2.2,smoothing=.001}={}){this.camera=camera;this.yaw=yaw;this.height=height;this.distance=distance;this.targetHeight=targetHeight;this.smoothing=smoothing;}
 drag(deltaX){this.yaw-=deltaX*.008;return this.yaw;}
 update(target,dt){
  const p=target.getPosition(),s=Math.sin(this.yaw),c=Math.cos(this.yaw);
  const desired=new pc.Vec3(p.x+s*this.distance,p.y+this.height,p.z+c*this.distance);
  const current=this.camera.getPosition(),alpha=1-Math.pow(this.smoothing,Math.max(0,dt));
  this.camera.setPosition(current.x+(desired.x-current.x)*alpha,current.y+(desired.y-current.y)*alpha,current.z+(desired.z-current.z)*alpha);
  this.camera.lookAt(p.x,p.y+this.targetHeight,p.z);
 }
 lockTarget(player,boss,weight=.34){
  const a=player.getPosition(),b=boss.getPosition(),w=Math.max(0,Math.min(1,weight));
  this.camera.lookAt(a.x+(b.x-a.x)*w,2.15,a.z+(b.z-a.z)*w);
 }
}
