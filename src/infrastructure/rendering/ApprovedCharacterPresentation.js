// Visual ground contact for the partial, approved-human pilot. This never
// moves gameplay roots, physics bodies or the current Warden. Its selected
// Vanguard source remains pending; this helper does not substitute a villain.
const GROUND_NAMES=new Set([
 'CityGround','DistrictPaving','CityRoadV','CityRoadH',
 'SidewalkV','SidewalkH','CurbV','CurbH','MissionForecourt','TreeGarden',
 'FirewallArenaFloor'
]);

export function createApprovedCharacterPresentation({characters,surfaceRoots,app}) {
 const surfaces=[],seen=new Set();
 for(const root of surfaceRoots)for(const render of root.findComponents('render')){
  if(seen.has(render))continue;
  seen.add(render);
  if(!GROUND_NAMES.has(render.entity.name)||!render.enabled||!render.entity.enabled)continue;
  for(const mesh of render.meshInstances){
   const {center,halfExtents}=mesh.aabb;
   const surface={name:render.entity.name,entity:render.entity,render,
    minX:center.x-halfExtents.x,maxX:center.x+halfExtents.x,
    minZ:center.z-halfExtents.z,maxZ:center.z+halfExtents.z,
    topY:center.y+halfExtents.y};
   if([surface.minX,surface.maxX,surface.minZ,surface.maxZ,surface.topY].every(Number.isFinite))surfaces.push(surface);
  }
 }
 // These named floors are static, axis-aligned meshes in the approved city.
 // Decorations, building roofs, trees and raised arena details are excluded.
 const heightAt=(x,z)=>{
  let highest=-Infinity;
  for(const surface of surfaces){
   if(!surface.entity.enabled||!surface.render.enabled)continue;
   if(x>=surface.minX-1e-6&&x<=surface.maxX+1e-6&&z>=surface.minZ-1e-6&&z<=surface.maxZ+1e-6)highest=Math.max(highest,surface.topY);
  }
  return Number.isFinite(highest)?highest:0;
 };
 let disposed=false;
 const update=()=>{
  if(disposed)return;
  for(const record of characters.characters.values()){
   if(!record.approvedVisual)continue;
   const position=record.entity.getPosition(),ground=heightAt(position.x,position.z)-position.y;
   // Keep the authored 3–4 mm sole clearance and animated hierarchy intact.
   record.facing.setLocalPosition(0,ground,0);
   record.entity.findByName('ContactShadow')?.setLocalPosition(0,ground+.002,0);
  }
 };
 const dispose=()=>{
  if(disposed)return;
  disposed=true;
  app.off('prerender',update);app.off('destroy',dispose);
 };
 // Run after the controller's movement update; roots and collision heights
 // remain unchanged when the visual moves from streets onto sidewalks.
 // PlayCanvas 2.23.0 emits app.prerender after app.update; it has no
 // app.postupdate event (systems.postUpdate precedes gameplay movement).
 app.on('prerender',update);app.once('destroy',dispose);update();
 return {heightAt,update,surfaces,dispose};
}
