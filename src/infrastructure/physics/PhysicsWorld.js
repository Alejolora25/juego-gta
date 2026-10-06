const RAPIER_URL='https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.19.3/+esm';

export class PhysicsWorld{
 constructor(){this.ready=false;this.rapier=null;this.world=null;this.playerBody=null;this.playerCollider=null;this.staticColliders=[];this.bossBody=null;this.bossCollider=null}
 async init(){
  if(this.ready)return this;
  const RAPIER=await import(RAPIER_URL);
  if(typeof RAPIER.init==='function')await RAPIER.init();
  this.rapier=RAPIER;
  this.world=new RAPIER.World({x:0,y:-9.81,z:0});
  this.ready=true;
  return this;
 }
 addFloor(size=420){
  if(!this.ready)throw new Error('PhysicsWorld no inicializado');
  const R=this.rapier,body=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0,-.05,0));
  this.world.createCollider(R.ColliderDesc.cuboid(size/2,.05,size/2),body);
  return body;
 }
 addPlayer(position={x:0,y:0,z:108}){
  if(!this.ready)throw new Error('PhysicsWorld no inicializado');
  const R=this.rapier;
  this.playerBody=this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x,position.y+1,position.z));
  this.playerCollider=this.world.createCollider(R.ColliderDesc.capsule(.85,.55),this.playerBody);
  return this.playerBody;
 }
 addBoss(position={x:0,y:0,z:-150}){if(!this.ready)throw new Error('PhysicsWorld no inicializado');const R=this.rapier;this.bossBody=this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x,position.y+1.4,position.z));this.bossCollider=this.world.createCollider(R.ColliderDesc.capsule(1.05,.8),this.bossBody);return this.bossBody}
 syncBoss(position){if(this.bossBody)this.bossBody.setNextKinematicTranslation({x:position.x,y:position.y+1.4,z:position.z})}
 bossCanMoveTo(position,bounds=185){if(!this.ready)return null;if(Math.abs(position.x)>bounds||Math.abs(position.z)>bounds)return false;const radius=.8;for(const c of this.staticColliders){const p=c.parent()?.translation?.();if(!p)continue;const h=c.halfExtents?.();if(!h)continue;if(Math.abs(position.x-p.x)<h.x+radius&&Math.abs(position.z-p.z)<h.z+radius)return false}return true}
 addObstacle({x,z,hw,hd},height=30){
  if(!this.ready)throw new Error('PhysicsWorld no inicializado');
  const R=this.rapier,body=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x,height/2,z));
  const collider=this.world.createCollider(R.ColliderDesc.cuboid(hw,height/2,hd),body);
  this.staticColliders.push(collider);return collider;
 }
 addObstacles(obstacles=[]){obstacles.forEach(o=>this.addObstacle(o));return this.staticColliders}
 resolveMovement(current,desired,bounds=185){if(!this.ready)return null;const radius=.55,clamp=v=>Math.max(-bounds,Math.min(bounds,v));const blocked=(x,z)=>{for(const c of this.staticColliders){const p=c.parent()?.translation?.();if(!p)continue;const h=c.halfExtents?.();if(!h)continue;if(Math.abs(x-p.x)<h.x+radius&&Math.abs(z-p.z)<h.z+radius)return true}return false};let x=clamp(desired.x),z=clamp(desired.z);if(!blocked(x,z))return{x,z};if(!blocked(x,current.z))return{x,z:current.z};if(!blocked(current.x,z))return{x:current.x,z};return{x:current.x,z:current.z}}
 canMoveTo(position,bounds=185){const r=this.resolveMovement(position,position,bounds);return r===null?null:r.x===position.x&&r.z===position.z}
 syncPlayer(position){if(this.playerBody)this.playerBody.setNextKinematicTranslation({x:position.x,y:position.y+1,z:position.z})}
 step(dt){if(!this.ready)return;this.world.timestep=Math.min(Math.max(dt,1/120),1/30);this.world.step()}
}
