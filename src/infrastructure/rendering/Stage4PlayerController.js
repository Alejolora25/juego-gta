export class Stage4PlayerController {
 constructor(entity,characters,{characterId='stage4-player',walkSpeed=7,runSpeed=13,resolveMovement=null}={}){this.entity=entity;this.characters=characters;this.characterId=characterId;this.walkSpeed=walkSpeed;this.runSpeed=runSpeed;this.resolveMovement=resolveMovement;}
 movement(joy,cameraYaw){
  const x=joy?.x??0,y=joy?.y??0,s=Math.sin(cameraYaw),c=Math.cos(cameraYaw);
  const mx=c*x+s*y,mz=-s*x+c*y,length=Math.hypot(mx,mz);
  return length>1?{x:mx/length,z:mz/length,magnitude:1}:{x:mx,z:mz,magnitude:length};
 }
 update({joy={x:0,y:0},cameraYaw=0,running=false,dt=0}={}){
  const move=this.movement(joy,cameraYaw),speed=running?this.runSpeed:this.walkSpeed,p=this.entity.getPosition();
  if(move.magnitude>.001){
   const desired={x:p.x+move.x*speed*dt,z:p.z+move.z*speed*dt},resolved=this.resolveMovement?.({x:p.x,z:p.z},desired)??desired;
   if(resolved)this.entity.setPosition(resolved.x,p.y,resolved.z);
   this.entity.setEulerAngles(0,Math.atan2(move.x,move.z)*180/Math.PI,0);
  }
  this.characters?.setLocomotion(this.characterId,move.magnitude*speed,running&&move.magnitude>.001);
  return {move,speed,state:move.magnitude>.001?(running?'run':'walk'):'idle'};
 }
}
