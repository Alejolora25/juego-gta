export class Stage4LodManager {
 constructor({near=28,mid=65,far=120}={}){this.base={near,mid,far};this.near=near;this.mid=mid;this.far=far;this.qualityScale=1;}
 setQualityScale(scale=1){this.qualityScale=Math.max(.45,Math.min(1,scale));this.near=this.base.near*this.qualityScale;this.mid=this.base.mid*this.qualityScale;this.far=this.base.far*this.qualityScale;return this.qualityScale;}
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
