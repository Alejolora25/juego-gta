import * as pc from 'playcanvas';

async function lightmap(app){
 const asset=new pc.Asset('PilotLightmap','texture',{url:'./assets/pilot/lightmap.png'},{srgb:false});
 app.assets.add(asset);
 return new Promise((resolve,reject)=>{asset.once('load',()=>resolve(asset.resource));asset.once('error',reject);app.assets.load(asset);});
}

function applyBakedLighting(entity,texture){
 const materials=new Map();
 for(const render of entity.findComponents('render')){
  render.castShadows=false;
  for(const mesh of render.meshInstances){
   if(!materials.has(mesh.material)){
    const m=mesh.material.clone();m.lightMap=texture;m.lightMapUv=1;m.lightMapChannel='rgb';m.aoMap=null;m.ambient.set(0,0,0);m.update();materials.set(mesh.material,m);
   }
   // Static meshes receive the baked atlas, not the dynamic sun a second time.
   mesh.material=materials.get(mesh.material);mesh.mask=pc.MASK_AFFECT_LIGHTMAPPED;
  }
 }
}

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
 pc.dracoInitialize({jsUrl:'./assets/vendor/draco/decoder.js',wasmUrl:'./assets/vendor/draco/decoder.wasm',numWorkers:1,lazyInit:true});
 const texture=await lightmap(app);
 const root=await pipeline.loadAndInstantiate('street-pilot','./assets/pilot/street-baked.glb',{position:[0,0,0]});
 applyBakedLighting(root,texture);
 const chunks=await Promise.all(layout.buildings.map(async(b,i)=>{
  const [high,low]=await Promise.all([
   pipeline.loadAndInstantiate('pilot-building-high-'+i,`./assets/pilot/building-high-${i}.glb`,{parent:root}),
   pipeline.loadAndInstantiate('pilot-building-low-'+i,`./assets/pilot/building-low-${i}.glb`,{parent:root})
  ]);
  applyBakedLighting(high,texture);applyBakedLighting(low,texture);
  low.enabled=false;
  return {high,low,x:b.x,z:b.z,tier:'high'};
 }));
 const updateLOD=camera=>{
  for(const c of chunks){
   const distance=Math.hypot(camera.x-c.x,camera.z-c.z);
   const tier=distance<35?'high':distance<120?'low':'culled';
   c.high.enabled=tier==='high';c.low.enabled=tier==='low';c.tier=tier;
  }
 };
 // Same footprint data feeds physics; no controller/mission changes.
 world.obstacles=world.obstacles.filter(o=>!(Math.abs(o.x)<30&&o.z>80&&o.z<130));
 for(const b of layout.buildings)world.obstacles.push({x:b.x,z:b.z,hw:b.width/2,hd:b.depth/2});
 return {root,buildings:layout.buildings,footprints:world.obstacles,chunks,lightmap:texture,updateLOD};
}
