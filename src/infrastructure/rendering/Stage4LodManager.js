export class Stage4LodManager {
 constructor({near=28,mid=65,far=120}={}){this.near=near;this.mid=mid;this.far=far;}
 tier(distance){return distance<this.near?'high':distance<this.mid?'medium':distance<this.far?'low':'culled';}
 apply(entity,distance){
  const tier=this.tier(distance),renders=entity.findComponents?.('render')??[];
  const enabled=tier!=='culled';entity.enabled=enabled;
  for(const render of renders){render.castShadows=tier==='high';render.receiveShadows=tier!=='culled';}
  return tier;
 }
 update(cameraPosition,entities){
  return entities.map(entity=>{const p=entity.getPosition();const dx=p.x-cameraPosition.x,dz=p.z-cameraPosition.z;return this.apply(entity,Math.hypot(dx,dz));});
 }
}
