import {test,expect} from '@playwright/test';

test('approved human pilot preserves ground contact, facing, missions and combat in the existing city',async({page})=>{
 test.setTimeout(90000);
 const errors=[],loadedAssets=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{
  // Aborting the public bootstrap deliberately prevents a second world.
  if(message.type()==='error'&&!message.text().includes('net::ERR_FAILED'))errors.push(message.text());
 });
 page.on('response',response=>{
  if(response.url().includes('/assets/characters/')&&response.url().endsWith('.glb'))loadedAssets.push({url:new URL(response.url()).pathname,status:response.status()});
 });
 await page.route('**/Stage4Bootstrap.js*',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/?pilot=1&characters=approved',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const {PlayCanvasProbe}=await import('/src/infrastructure/rendering/PlayCanvasProbe.js');
  const pc=await import('playcanvas');
  const previousAction=()=>{},previousShoot=()=>{},previousLock=()=>{};
  const controls={move:{x:0,y:0},running:false,locked:false,cameraDelta:0,onAction:previousAction,onShoot:previousShoot,onLock:previousLock,
   consumeCamera(){const delta=this.cameraDelta;this.cameraDelta=0;return delta;},
   setCombat(active){this.combat=active;if(!active)this.locked=false;}};
  const hudEvents={objectives:[],dialogs:[],finish:[],combat:[],syncs:0};
  const hud={objective:(distance,angle,name)=>hudEvents.objectives.push({distance,angle,name}),
   dialog:(name,text)=>hudEvents.dialogs.push({name,text}),finish:win=>hudEvents.finish.push(win),
   combat:active=>hudEvents.combat.push(active),sync:()=>hudEvents.syncs++};
  const canvas=document.createElement('canvas');canvas.width=360;canvas.height=240;document.body.appendChild(canvas);
  const probe=new PlayCanvasProbe(canvas,{controls,hud});
  let result;
  try{
   await probe.init();const s=await probe.start();
   const deadline=Date.now()+15000;
   while(!s.physics.ready&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,25));
   if(!s.physics.ready)throw new Error('Rapier did not initialize in the approved pilot');
   if(!s.approvedPresentation)throw new Error('Approved character ground presentation is unavailable');
   // Advance the real systems synchronously. Software WebGL needs only one
   // initial world; animation and gameplay assertions do not need new renders.
   probe.app.autoRender=false;
   const advance=(frames=1)=>{for(let i=0;i<frames;i++){probe.app.update(1/60);s.approvedPresentation.update();}};
   let skinIndex=1000000;
   const bounds=character=>{
    let min=Infinity,max=-Infinity;
    for(const render of character.visual.findComponents('render'))for(const mesh of render.meshInstances){
     // The renderer normally refreshes these matrices before culling. Do the
     // same for each sampled skeletal pose without another expensive frame.
     mesh.skinInstance?.updateMatrices(mesh.node,++skinIndex);
     min=Math.min(min,mesh.aabb.center.y-mesh.aabb.halfExtents.y);
     max=Math.max(max,mesh.aabb.center.y+mesh.aabb.halfExtents.y);
    }
    return {min,max};
   };
   const position=entity=>Array.from(entity.getPosition().toArray());
   const front=character=>{
    const direction=character.facing.getWorldTransform().transformVector(new pc.Vec3(0,0,-1));
    direction.normalize();return Array.from(direction.toArray());
   };
   const feet=character=>['Foot.L','Foot.R'].map(name=>{
    const bone=character.visual.findByName(name);if(!bone)throw new Error('Missing stationary foot joint: '+character.name+'/'+name);
    return position(bone);
   });
   const player=s.characters.get('stage4-player'),warden=s.characters.get('stage4-warden');
   const npcs=['stage4-juan','stage4-sara','stage4-david'].map(id=>s.characters.get(id));
   const cast=[player,...npcs,warden].map(character=>({name:character.name,url:character.assetUrl,approved:character.approvedVisual,ready:character.skeletal.ready,
    bones:new Set(character.visual.findComponents('render').flatMap(render=>render.meshInstances.flatMap(mesh=>mesh.skinInstance?.bones??[]))).size}));
   const obstaclesBefore=JSON.stringify(s.world.obstacles);
   const physicsColliders=s.physics.staticColliders.length;
   advance(18);
   const idle={clip:player.skeletal.current,bounds:bounds(player),root:position(player.entity),surface:s.approvedPresentation.heightAt(0,108),front:front(player)};
   const npcBefore=npcs.map(character=>({root:position(character.entity),feet:feet(character)}));
   advance(60);
   const stationaryNpcs=npcs.map((character,index)=>{
    const afterFeet=feet(character);
    const p=character.entity.getPosition();
    return {name:character.name,clip:character.skeletal.current,clips:character.skeletal.available(),before:npcBefore[index].root,after:position(character.entity),
     footDrift:Math.max(...afterFeet.map((foot,i)=>Math.hypot(foot[0]-npcBefore[index].feet[i][0],foot[2]-npcBefore[index].feet[i][2]))),
     bounds:bounds(character),surface:s.approvedPresentation.heightAt(p.x,p.z)};
   });
   // Forward on the joystick follows the camera, and the visible front follows
   // that movement, including the approved model's authored -Z forward axis.
   s.thirdPersonCamera.yaw=Math.PI/2;
   const moveBefore=position(player.entity);
   controls.move.y=-1;advance(12);
   const walk={clip:player.skeletal.current,root:position(player.entity),bounds:bounds(player),front:front(player)};
   controls.running=true;advance(12);
   const run={clip:player.skeletal.current,root:position(player.entity),bounds:bounds(player),front:front(player)};
   controls.move.y=0;controls.running=false;advance(18);
   const stopped=player.skeletal.current;
   const yawBefore=s.thirdPersonCamera.yaw;controls.cameraDelta=40;advance();
   const camera={before:yawBefore,after:s.thirdPersonCamera.yaw,remaining:controls.cameraDelta};
   const surfacePoints=[['road',0,108,.05],['sidewalk',8.65,108,.16],['grass',70,100,-.08],
    ['Juan',-28,74,.06],['Sara',98,-12,.055],['David',-108,54,.055],['arena',4,-150,.14]];
   const surfaces=surfacePoints.map(([name,x,z,expected])=>{
    player.entity.setPosition(x,0,z);s.approvedPresentation.update();
    const support=s.approvedPresentation.heightAt(x,z);
    return {name,expected,support,facingY:player.facing.getLocalPosition().y,root:position(player.entity),bounds:bounds(player)};
   });
   const blocked=s.physics.resolveMovement({x:9,z:94},{x:13,z:94});
   const clearRoad=s.physics.resolveMovement({x:0,z:108},{x:0,z:98});
   const missions=[];
   for(const character of npcs){
    const p=character.entity.getPosition();player.entity.setPosition(p.x+1.5,0,p.z);s.approvedPresentation.update();
    const interaction=controls.onAction();advance();
    missions.push({...interaction,clip:character.skeletal.current});
   }
   const completedState={stage:s.state.stage,xp:s.state.xp};
   // Exercise the existing encounter and projectile callbacks with the new
   // humans. The current Warden remains the original pilot asset.
   player.entity.setPosition(0,0,-130);warden.entity.setPosition(0,0,-150);advance();
   const encounter={active:s.state.bossActive,locked:s.bossEncounter.locked,visible:warden.entity.enabled};
   s.projectiles.clear();s.combat.playerCooldown=0;s.combat.enemyCooldown=10;controls.onLock(true);
   const bossHPBefore=s.state.bossHP;
   const playerShot=controls.onShoot();
   for(let i=0;i<120&&s.state.bossHP===bossHPBefore;i++){s.projectiles.update(1/60,warden.entity,player.entity);s.physics.step(1/60);}
   const bossHPAfter=s.state.bossHP;
   const playerHPBefore=s.state.playerHP;s.combat.enemyCooldown=0;
   const enemyShot=s.projectiles.shootEnemy(warden.entity,player.entity);
   for(let i=0;i<120&&s.state.playerHP===playerHPBefore;i++){s.projectiles.update(1/60,warden.entity,player.entity);s.physics.step(1/60);}
   const playerHPAfter=s.state.playerHP;
   s.state.bossHP=12;s.combat.playerCooldown=0;controls.onShoot();
   for(let i=0;i<120&&!s.state.finished;i++){s.projectiles.update(1/60,warden.entity,player.entity);s.physics.step(1/60);}
   advance();
   const victory={finished:s.state.finished,bossHP:s.state.bossHP,visible:warden.entity.enabled,locked:s.bossEncounter.locked,combat:controls.combat,finish:hudEvents.finish.at(-1)};
   s.resetSession();advance();
   const reset={stage:s.state.stage,xp:s.state.xp,hp:s.state.playerHP,bossHP:s.state.bossHP,bossActive:s.state.bossActive,finished:s.state.finished,
    root:position(player.entity),bounds:bounds(player),surface:s.approvedPresentation.heightAt(0,108),clip:player.skeletal.current,
    bossVisible:warden.entity.enabled,physicsY:s.physics.playerBody.translation().y,npcs:npcs.map(character=>character.skeletal.current)};
   result={ok:true,cast,idle,stationaryNpcs,moveBefore,walk,run,stopped,camera,surfaces,blocked,clearRoad,missions,completedState,
    encounter,playerShot,enemyShot,bossHPBefore,bossHPAfter,playerHPBefore,playerHPAfter,victory,reset,hudEvents,physicsColliders,
    obstacleCount:s.world.obstacles.length,obstaclesUnchanged:obstaclesBefore===JSON.stringify(s.world.obstacles)};
  }catch(error){result={ok:false,error:error?.message??String(error),stack:error?.stack};}
  finally{
   probe.destroy();canvas.remove();
   result.callbacksRestored=controls.onAction===previousAction&&controls.onShoot===previousShoot&&controls.onLock===previousLock;
  }
  return result;
 });
 expect(result.ok,result.error+'\n'+result.stack).toBe(true);
 const expectedPaths=['/assets/characters/alejandro-explorer/alejandro.glb','/assets/characters/npc-phase4/juan/juan.glb',
  '/assets/characters/npc-phase4/sara/sara.glb','/assets/characters/npc-phase4/david/david.glb'];
 expect(result.cast.map(character=>new URL(character.url,'http://127.0.0.1:4173/').pathname)).toEqual([...expectedPaths,'/assets/pilot/source/robot.glb']);
 expect(result.cast.map(character=>character.approved)).toEqual([true,true,true,true,false]);
 expect(result.cast.every(character=>character.ready)).toBe(true);
 for(const path of expectedPaths)expect(loadedAssets).toContainEqual({url:path,status:200});
 for(const npc of result.cast.slice(1,4))expect(npc.bones,npc.name+' skeleton').toBe(62);
 const expectGrounded=(sample,label)=>{
  expect(Number.isFinite(sample.bounds.min+sample.bounds.max),label+' finite bounds').toBe(true);
  expect(sample.bounds.min,label+' feet').toBeGreaterThanOrEqual(sample.surface-.05);
  expect(sample.bounds.max-sample.surface,label+' human height').toBeGreaterThan(1.4);
  expect(sample.bounds.max-sample.surface,label+' human height').toBeLessThan(2.1);
 };
 expect(result.idle.clip).toBe('Idle');expectGrounded(result.idle,'Idle');expect(result.idle.front[2]).toBeGreaterThan(.99);
 for(const npc of result.stationaryNpcs){
  expect(npc.clip,npc.name).toBe('Idle');expect(npc.clips).toEqual(expect.arrayContaining(['Idle','Interact','Wave']));
  expect(npc.after,npc.name+' stationary root').toEqual(npc.before);expect(npc.after[1]).toBe(0);
  expect(npc.footDrift,npc.name+' stationary feet').toBeLessThan(.005);expectGrounded(npc,npc.name);
 }
 expect(result.walk.clip).toBe('Walk');expect(result.run.clip).toBe('Run');expect(result.stopped).toBe('Idle');
 expect(result.walk.root[0]-result.moveBefore[0]).toBeCloseTo(-1.4,2);expect(result.walk.root[2]).toBeCloseTo(result.moveBefore[2],4);
 expect(result.run.root[0]-result.walk.root[0]).toBeCloseTo(-2.6,2);
 for(const movement of [result.walk,result.run]){
  expect(movement.root[1]).toBe(0);expect(movement.front[0]).toBeLessThan(-.99);expectGrounded({...movement,surface:.05},movement.clip);
 }
 expect(result.camera.after).toBeLessThan(result.camera.before);expect(result.camera.remaining).toBe(0);
 for(const sample of result.surfaces){
  expect(sample.support,sample.name+' surface').toBeCloseTo(sample.expected,4);
  expect(sample.facingY,sample.name+' visual lift').toBeCloseTo(sample.support,5);
  expect(sample.root[1],sample.name+' gameplay root').toBe(0);expectGrounded({...sample,surface:sample.support},sample.name);
 }
 expect(result.blocked).toEqual({x:9,z:94});expect(result.clearRoad).toEqual({x:0,z:98});
 expect(result.obstaclesUnchanged).toBe(true);expect(result.physicsColliders).toBe(result.obstacleCount);
 expect(result.missions.map(mission=>mission.character)).toEqual(['Juan','Sara','David']);
 expect(result.missions.map(mission=>mission.xp)).toEqual([100,200,300]);expect(result.missions.every(mission=>mission.completed&&mission.clip==='Idle')).toBe(true);
 expect(result.completedState).toEqual({stage:3,xp:300});
 expect(result.hudEvents.dialogs.map(dialog=>dialog.name.split(' · ')[0])).toEqual(['Juan','Sara','David']);
 expect(result.hudEvents.dialogs.every(dialog=>dialog.text.length>20)).toBe(true);expect(result.hudEvents.objectives.length).toBeGreaterThan(0);
 expect(result.encounter).toEqual({active:true,locked:true,visible:true});expect(result.playerShot).toBe(true);expect(result.enemyShot).toBe(true);
 expect(result.bossHPAfter).toBe(result.bossHPBefore-12);expect(result.playerHPAfter).toBe(result.playerHPBefore-1);
 expect(result.victory).toEqual({finished:true,bossHP:0,visible:false,locked:false,combat:false,finish:true});
 expect([result.reset.stage,result.reset.xp,result.reset.hp,result.reset.bossHP,result.reset.bossActive,result.reset.finished]).toEqual([0,0,3,100,false,false]);
 expect(result.reset.root).toEqual([0,0,108]);expect(result.reset.physicsY).toBeCloseTo(1,5);expect(result.reset.bossVisible).toBe(false);
 expect(result.reset.clip).toBe('Idle');expect(result.reset.npcs).toEqual(['Idle','Idle','Idle']);expectGrounded(result.reset,'Reset');
 expect(result.callbacksRestored).toBe(true);expect(errors).toEqual([]);
});
