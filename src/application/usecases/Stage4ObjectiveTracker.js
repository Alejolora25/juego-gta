export class Stage4ObjectiveTracker {
 constructor(missions){this.missions=missions;}
 measure(player,cameraYaw){
  const target=this.missions.target();if(!target)return null;
  const a=player.getPosition(),b=target.entity.getPosition(),dx=b.x-a.x,dz=b.z-a.z,distance=Math.hypot(dx,dz);
  if(!distance)return {distance:0,angle:0,name:target.name};
  const fx=-Math.sin(cameraYaw),fz=-Math.cos(cameraYaw),tx=dx/distance,tz=dz/distance;
  const dot=Math.max(-1,Math.min(1,fx*tx+fz*tz)),cross=fx*tz-fz*tx;
  return {distance,angle:Math.atan2(cross,dot),name:target.name};
 }
 direction(angle){
  const q=Math.PI/4;if(angle>=-q&&angle<q)return '↑';if(angle>=q&&angle<3*q)return '→';if(angle<=-q&&angle>-3*q)return '←';return '↓';
 }
}
