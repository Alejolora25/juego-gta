import * as pc from 'playcanvas';
import {createUrbanDistrictLayout} from './UrbanDistrictLayout.js';
import {buildUrbanDistrictSurfaces} from './UrbanDistrictSurfaces.js';
import {addUrbanBuildingContactShadows} from './UrbanBuildingContactShadows.js';

async function lightmap(app){
 const asset=new pc.Asset('PilotLightmap','texture',{url:'./assets/pilot/lightmap.png'},{srgb:false});
 app.assets.add(asset);
 return new Promise((resolve,reject)=>{asset.once('load',()=>resolve(asset.resource));asset.once('error',reject);app.assets.load(asset);});
}

const districtPalette={pasto:[1,.86,.72],canales:[.87,.92,.94],industrial:[.88,.88,.83],mirador:[1,.97,.88]};
function applyBakedLighting(entity,texture,materials=new Map(),district='pasto'){
 for(const render of entity.findComponents('render')){
  render.castShadows=false;
  for(const mesh of render.meshInstances){
   if(!materials.has(mesh.material)){
    const m=mesh.material.clone();m.lightMap=texture;m.lightMapUv=1;m.lightMapChannel='rgb';m.aoMap=null;m.ambient.set(0,0,0);
    if(/Facade|Wall/.test(m.name)){const t=districtPalette[district];m.diffuse.set(m.diffuse.r*t[0],m.diffuse.g*t[1],m.diffuse.b*t[2]);}
    m.update();materials.set(mesh.material,m);
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
 const city=createUrbanDistrictLayout(layout.buildings);
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
 const streetRenders=root.findComponents('render');
 applyBakedLighting(root,texture);
 const materialCache=new Map();
 const districtMaterials=new Map([['pasto',materialCache],...['canales','industrial','mirador'].map(id=>[id,new Map()])]);
 const prototypes=await Promise.all(layout.buildings.map(async(b,i)=>{
  const [high,low]=await Promise.all([
   pipeline.loadAndInstantiate('pilot-building-high-'+i,`./assets/pilot/building-high-${i}.glb`,{parent:root}),
   pipeline.loadAndInstantiate('pilot-building-low-'+i,`./assets/pilot/building-low-${i}.glb`,{parent:root})
  ]);
  applyBakedLighting(high,texture,materialCache);applyBakedLighting(low,texture,materialCache);
  low.enabled=false;
  return {high,low,x:b.x,z:b.z,tier:'high'};
 }));
 const chunks=[...prototypes];
 for(const b of city.buildings.slice(layout.buildings.length)){
  const prototype=layout.buildings[b.archetype];
  const position=[b.x-prototype.x,0,b.z-prototype.z];
  const high=pipeline.instantiate('pilot-building-high-'+b.archetype,{parent:root,position});
  const low=pipeline.instantiate('pilot-building-low-'+b.archetype,{parent:root,position});
  applyBakedLighting(high,texture,districtMaterials.get(b.district),b.district);applyBakedLighting(low,texture,districtMaterials.get(b.district),b.district);
  low.enabled=false;chunks.push({high,low,x:b.x,z:b.z,tier:'high'});
 }
 const surfaces=await buildUrbanDistrictSurfaces({app,root,world,pipeline,buildings:city.buildings});
 const contactShadows=addUrbanBuildingContactShadows(app,root,city.buildings);
 // Full-map surfaces replace the old pilot ground; do not leave coplanar
 // asphalt/grass layers underneath that cause flicker and duplicate lanes.
 for(const render of streetRenders)render.enabled=false;
 const updateLOD=camera=>{
  for(const c of chunks){
   const distance=Math.hypot(camera.x-c.x,camera.z-c.z);
   const tier=distance<35?'high':distance<180?'low':'culled';
   c.high.enabled=tier==='high';c.low.enabled=tier==='low';c.tier=tier;
  }
  for(const tree of surfaces.trees)tree.entity.enabled=Math.hypot(camera.x-tree.x,camera.z-tree.z)<110;
  for(const fixture of surfaces.fixtures)fixture.entity.enabled=Math.hypot(camera.x-fixture.x,camera.z-fixture.z)<110;
  for(const shadow of contactShadows)shadow.entity.enabled=Math.hypot(camera.x-shadow.x,camera.z-shadow.z)<60;
 };
 // Same footprint data feeds physics; no controller/mission changes.
 // Preserve approved arena obstacles only; every replaced district collider
 // is rebuilt from its exact visual placement, not the legacy district grid.
 world.obstacles=world.obstacles.filter(o=>Math.hypot(o.x,o.z+150)<40);
 for(const b of city.buildings)world.obstacles.push({x:b.x,z:b.z,hw:b.width/2,hd:b.depth/2});
 updateLOD({x:0,z:108});
 return {root,buildings:city.buildings,districts:city.districts,surfaces,footprints:world.obstacles,chunks,lightmap:texture,updateLOD};
}
