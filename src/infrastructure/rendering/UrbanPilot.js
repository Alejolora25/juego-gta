export async function buildUrbanPilot({world,stage5Slice,stage6City,environment,pipeline,app}) {
 const response=await fetch('./assets/pilot/layout.json');
 if(!response.ok)throw new Error('Pilot layout failed to load');
 const layout=await response.json();
 // One visual source per area. The old layers stay available in the backup.
 stage5Slice.root.enabled=false;stage6City.root.enabled=false;
 environment.root.enabled=false;
 for(const child of world.root.children){
  if(child.name.startsWith('Pasto'))child.enabled=false;
  const p=child.getPosition();
  if(child.name==='RoadLineV'&&Math.abs(p.x)<1&&p.z>82&&p.z<134)child.enabled=false;
 }
 const root=await pipeline.loadAndInstantiate('street-pilot','./assets/pilot/street-pilot.glb',{position:[0,0,0]});
 // Same footprint data feeds physics; no controller/mission changes.
 world.obstacles=world.obstacles.filter(o=>!(Math.abs(o.x)<30&&o.z>80&&o.z<130));
 for(const b of layout.buildings)world.obstacles.push({x:b.x,z:b.z,hw:b.width/2,hd:b.depth/2});
 return {root,buildings:layout.buildings,footprints:world.obstacles};
}
