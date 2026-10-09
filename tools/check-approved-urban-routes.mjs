// Read-only review of the approved city with the five optimized characters.
// Walk the existing Rapier resolver in quarter-metre increments. This is a
// route/collision check, not a replacement for Samsung or visual approval.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'docs/character-renewal/evidence/five-character-routes');
const base=process.env.LORA25_REVIEW_URL??'http://127.0.0.1:4173';
const executablePath=process.env.LORA25_CHROMIUM??'/usr/bin/chromium';
const routes=[
 {name:'centro-to-juan',district:'pasto',target:'stage4-juan',points:[
  [0,108],[0,82],[55,82],[55,132],[0,132],[0,70],[-28,70],[-28,72.5]]},
 {name:'industrial-to-sara',district:'industrial',target:'stage4-sara',points:[
  [-28,72.5],[-28,70],[86,70],[150,70],[150,-12],[96.5,-12]]},
 {name:'canales-to-david',district:'canales',target:'stage4-david',points:[
  [96.5,-12],[86,-12],[86,0],[-150,0],[-150,54],[-106.5,54]]},
 {name:'mirador-to-arena',district:'mirador',target:null,points:[
  [-106.5,54],[-86,54],[-86,-70],[-58,-70],[-58,-116],[58,-116],
  [58,-70],[0,-70],[0,-116],[4,-116],[4,-132]]}
];
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,
 args:['--no-sandbox','--ignore-certificate-errors']});
try{
 const context=await browser.newContext({viewport:{width:640,height:1024},ignoreHTTPSErrors:true});
 const page=await context.newPage(),pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 // Create one real world, without the public bootstrap creating a second.
 await page.route('**/Stage4Bootstrap.js*',route=>route.abort());
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',route=>
  route.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),
   contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto(base+'/?pilot=1&characters=approved&quality=optimized',{waitUntil:'networkidle'});
 const result=await page.evaluate(async routes=>{
  const [{PlayCanvasProbe},{validateUrbanDistrictLayout,clearUrbanPlacement}]=await Promise.all([
   import('/src/infrastructure/rendering/PlayCanvasProbe.js'),
   import('/src/infrastructure/rendering/UrbanDistrictLayout.js')]);
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const close=(a,b)=>Math.abs(a-b)<1e-5;
  const point=entity=>{const p=entity.getPosition();return {x:p.x,y:p.y,z:p.z};};
  const controls={move:{x:0,y:0},running:false,locked:false,cameraDelta:0,
   consumeCamera(){return 0;},setCombat(value){this.combat=value;}};
  const dialogs=[];
  const hud={dialog:(name,text)=>dialogs.push({name,text}),objective(){},sync(){},combat(){}};
  const canvas=document.getElementById('game'),probe=new PlayCanvasProbe(canvas,{controls,hud});
  try{
   await probe.init();const s=await probe.start();
   const deadline=Date.now()+15000;
   while(!s.physics.ready&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,25));
   assert(s.physics.ready,'Rapier did not initialize');
   assert(s.approvedPresentation,'Approved visual support adapter missing');
   // All following samples are deterministic, synchronous evaluations of the
   // existing scene, skeleton and collision resolver; no extra GPU frames.
   probe.app.autoRender=false;
   const before=JSON.stringify(s.world.obstacles);
   const originalNpcs=s.npcs.map(point);
   const footprints=s.world.obstacles.map(obstacle=>({...obstacle}));
   const colliders=s.physics.staticColliders.map(collider=>{
    const p=collider.parent().translation(),h=collider.halfExtents();
    return {x:p.x,z:p.z,hw:h.x,hd:h.z};
   });
   const city=s.urbanPilot.buildings;
   assert(city.length===83,'Approved building count changed');
   assert(s.urbanPilot.districts.length===4,'Approved district count changed');
   assert(validateUrbanDistrictLayout(city),'Approved layout violates a protected corridor');
   assert(colliders.length===footprints.length,'Collider/footprint count mismatch');
   for(const footprint of footprints)assert(colliders.some(collider=>
    ['x','z','hw','hd'].every(key=>close(collider[key],footprint[key]))),
    'Collider differs from its approved footprint: '+JSON.stringify(footprint));
   for(const building of city)assert(footprints.some(footprint=>
    close(footprint.x,building.x)&&close(footprint.z,building.z)&&
    close(footprint.hw,building.width/2)&&close(footprint.hd,building.depth/2)),
    'Building has no matching physics footprint: '+building.id);
   const radius=.55;
   const contains=(p,footprint,padding=0)=>Math.abs(p.x-footprint.x)<footprint.hw+padding&&
    Math.abs(p.z-footprint.z)<footprint.hd+padding;
   const clearance=p=>Math.min(...footprints.map(footprint=>Math.hypot(
    Math.max(Math.abs(p.x-footprint.x)-footprint.hw,0),
    Math.max(Math.abs(p.z-footprint.z)-footprint.hd,0))));
   const npcPlacement=s.npcs.map(entity=>{
    const p=point(entity),record=s.characters.get('stage4-'+entity.name.toLowerCase());
    assert(!footprints.some(footprint=>contains(p,footprint,radius)),entity.name+' is inside a physics footprint');
    assert(p.y===0,entity.name+' gameplay root changed height');
    assert(record.skeletal.current==='Idle',entity.name+' has locomotion animation while stationary');
    s.approvedPresentation.update();
    const support=s.approvedPresentation.heightAt(p.x,p.z);
    assert(close(record.facing.getLocalPosition().y,support),entity.name+' visual support does not match its forecourt');
    return {name:entity.name,position:p,clearance:clearance(p),support,clip:record.skeletal.current};
   });
   const trees=s.urbanPilot.surfaces.trees.map(tree=>{
    assert(clearUrbanPlacement({x:tree.x,z:tree.z,width:6,depth:6}),'Tree occupies protected road/mission corridor');
    assert(!city.some(building=>Math.abs(tree.x-building.x)<6&&Math.abs(tree.z-building.z)<7),
     'Tree occupies approved building: '+JSON.stringify({x:tree.x,z:tree.z}));
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(const render of tree.entity.findComponents('render'))for(const mesh of render.meshInstances){
     const {center,halfExtents}=mesh.aabb;
     minX=Math.min(minX,center.x-halfExtents.x);maxX=Math.max(maxX,center.x+halfExtents.x);
     minZ=Math.min(minZ,center.z-halfExtents.z);maxZ=Math.max(maxZ,center.z+halfExtents.z);
    }
    assert(Number.isFinite(minX+maxX+minZ+maxZ),'Invalid tree visual bounds');
    return {x:tree.x,z:tree.z,visualFootprint:{x:(minX+maxX)/2,z:(minZ+maxZ)/2,
     hw:(maxX-minX)/2,hd:(maxZ-minZ)/2}};
   });
   // Check every existing building and arena column, from all four sides.
   // Do not use canMoveTo(p): a stationary blocked request can return p again.
   let blockedApproaches=0;
   for(const footprint of footprints)for(const side of ['west','east','north','south']){
    const axis=side==='west'||side==='east'?'x':'z';
    const sign=side==='west'||side==='north'?-1:1;
    const half=axis==='x'?footprint.hw:footprint.hd;
    const from={x:footprint.x,z:footprint.z};from[axis]+=sign*(half+radius+.25);
    const desired={x:footprint.x,z:footprint.z};desired[axis]+=sign*(half-.1);
    const resolved=s.physics.resolveMovement(from,desired);
    assert(close(resolved.x,from.x)&&close(resolved.z,from.z),
     'Expected obstacle to block '+side+' approach: '+JSON.stringify(footprint));
    blockedApproaches++;
   }
   const cast=['stage4-player','stage4-juan','stage4-sara','stage4-david','stage4-warden'].map(id=>{
    const character=s.characters.get(id);assert(character.approvedVisual&&character.skeletal.ready,'Approved rig unavailable: '+id);
    return {id,url:character.assetUrl,clips:character.skeletal.available()};
   });
   assert(cast[4].url.includes('/warden-vanguard/warden.glb'),'Selected Vanguard is not integrated');
   const player=s.characters.get('stage4-player');
   let matrixIndex=1000000;
   const sample=()=>{
    const p=point(s.actor),support=s.approvedPresentation.heightAt(p.x,p.z);
    assert(p.y===0,'Player gameplay root changed height on route');
    assert(close(player.facing.getLocalPosition().y,support),'Player visual support failed on route');
    const wasEnabled=player.entity.enabled;player.entity.enabled=true;
    let minY=Infinity,maxY=-Infinity;
    try{
     for(const render of player.visual.findComponents('render'))for(const mesh of render.meshInstances){
      mesh.skinInstance?.updateMatrices(mesh.node,++matrixIndex);
      minY=Math.min(minY,mesh.aabb.center.y-mesh.aabb.halfExtents.y);
      maxY=Math.max(maxY,mesh.aabb.center.y+mesh.aabb.halfExtents.y);
     }
    }finally{player.entity.enabled=wasEnabled;}
    assert(Number.isFinite(minY+maxY),'Invalid deformed player bounds');
    assert(minY>=support-.05,'Player mesh penetrates route support: '+JSON.stringify({p,minY,support}));
    assert(maxY-support>1.4&&maxY-support<2.1,'Invalid player scale on route');
    return {position:p,support,visualY:player.facing.getLocalPosition().y,minY,maxY};
   };
   const traversed=[];
   for(const route of routes){
    const start=point(s.actor);
    assert(close(start.x,route.points[0][0])&&close(start.z,route.points[0][1]),'Route is not continuous: '+route.name);
    let steps=0,distance=0,minimumClearance=Infinity;
    const waypoints=[sample()];
    for(let index=1;index<route.points.length;index++){
     const [x,z]=route.points[index],from=point(s.actor);
     const length=Math.hypot(x-from.x,z-from.z),count=Math.ceil(length/.25);
     distance+=length;
     for(let step=1;step<=count;step++){
      const current=point(s.actor),desired={x:from.x+(x-from.x)*step/count,z:from.z+(z-from.z)*step/count};
      const resolved=s.physics.resolveMovement(current,desired);
      assert(resolved&&close(resolved.x,desired.x)&&close(resolved.z,desired.z),
       'Route unexpectedly blocked: '+JSON.stringify({route:route.name,desired,resolved}));
      assert(!footprints.some(footprint=>contains(resolved,footprint,radius)),
       'Route entered a player-expanded physics footprint');
      assert(!trees.some(tree=>contains(resolved,tree.visualFootprint,radius)),
       'Route intersects a tree visual footprint: '+JSON.stringify(resolved));
      s.actor.setPosition(resolved.x,current.y,resolved.z);
      s.actor.setEulerAngles(0,Math.atan2(x-from.x,z-from.z)*180/Math.PI,0);
      s.approvedPresentation.update();s.physics.syncPlayer(s.actor.getPosition());s.physics.step(1/60);
      assert(s.actor.getPosition().y===0,'Movement changed the player root height');
      assert(close(player.facing.getLocalPosition().y,s.approvedPresentation.heightAt(resolved.x,resolved.z)),
       'Movement detached visual model from the sampled support');
      minimumClearance=Math.min(minimumClearance,clearance(resolved));steps++;
     }
     waypoints.push(sample());
    }
    let mission=null;
    if(route.target){
     const target=s.characters.get(route.target),range=s.missions.distance(s.actor,target.entity);
     assert(range<s.missions.range,route.name+' cannot reach mission interaction range');
     const interaction=controls.onAction();
     assert(interaction.completed,'Mission did not complete through the existing callback: '+route.name);
     mission={...interaction,distance:range,range:s.missions.range};
    }
    traversed.push({...route,steps,distance,minimumClearance,waypoints,mission});
   }
   assert(s.state.stage===3&&s.state.xp===300,'Existing mission progression changed');
   assert(dialogs.length===3,'Existing mission dialogs were not invoked');
   // Advance the unmodified encounter once at the end of the real entrance
   // route with the adapted Vanguard and the unchanged encounter rules.
   probe.app.update(1/60);s.approvedPresentation.update();
   const arena={position:point(s.actor),distance:s.bossEncounter.distance(s.actor,s.warden),
    active:s.state.bossActive,locked:s.bossEncounter.locked,rootY:s.actor.getPosition().y};
   assert(arena.active&&arena.locked,'Approved arena entrance no longer activates the existing encounter');
   assert(before===JSON.stringify(s.world.obstacles),'Route review mutated the approved footprints');
   assert(JSON.stringify(originalNpcs)===JSON.stringify(s.npcs.map(point)),'Route review moved a mission NPC');
   return {engine:'PlayCanvas 2.23.0',buildings:city.length,districts:s.urbanPilot.districts.map(d=>({id:d.id,name:d.name})),
    cast,footprints,colliders,blockedApproaches,npcPlacement,trees,routes:traversed,
    totalDistance:traversed.reduce((sum,route)=>sum+route.distance,0),
    totalSteps:traversed.reduce((sum,route)=>sum+route.steps,0),
    unchangedFootprints:true,unchangedNpcRoots:true,gameplayRootsY:0,
    state:{stage:s.state.stage,xp:s.state.xp},dialogs:dialogs.map(dialog=>dialog.name),arena};
  }finally{probe.destroy();}
 },routes);
 if(pageErrors.length)throw new Error('Page errors: '+JSON.stringify(pageErrors));
 const footprintSha256=crypto.createHash('sha256').update(JSON.stringify(result.footprints)).digest('hex');
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify({...result,footprintSha256,pageErrors,
  checkedAt:new Date().toISOString(),samsungValidated:false,
  limitations:[
   'Five optimized characters including the officially supplied Vanguard; Samsung validation remains pending.',
   'Routes sample the existing movement resolver at 0.25 metres; they do not test touch ergonomics or user-controlled camera occlusion.',
   'Visual support uses the existing static flat surfaces; raised arena decorations are excluded.',
   'No navigation graph, gameplay logic, approved building, collider, original model or city layout was changed.'
  ]},null,2)+'\n');
 await context.close();
 console.log('APPROVED_URBAN_ROUTES_VERIFIED',JSON.stringify({districts:result.districts.length,
  buildings:result.buildings,distance:result.totalDistance,steps:result.totalSteps,
  blockedApproaches:result.blockedApproaches,stage:result.state.stage,xp:result.state.xp,footprintSha256}));
}finally{await browser.close();}
