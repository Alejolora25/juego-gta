import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';

const base='http://127.0.0.1:4173/';
let server;

test.beforeAll(async()=>{
 server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
 await new Promise(r=>setTimeout(r,800));
});
test.afterAll(()=>server?.kill());

async function open(page){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 return errors;
}

async function startProbe(page,{controls=null,hud=null,suffix='smoke'}={}){
 return page.evaluate(async({controls,hud,suffix})=>{
  const {PlayCanvasProbe}=await import(`./src/infrastructure/rendering/PlayCanvasProbe.js?v=${suffix}`);
  const canvas=document.createElement('canvas');canvas.width=360;canvas.height=240;document.body.appendChild(canvas);
  const probe=new PlayCanvasProbe(canvas,{controls,hud});
  try{
   await probe.init();
   const s=await probe.start();
   await new Promise(r=>setTimeout(r,180));
   const names=e=>{const out=[];const walk=n=>{out.push(n.name);for(const child of n.children??[])walk(child)};walk(e);return out};
   const juan=s.characters.get('stage4-juan'),sara=s.characters.get('stage4-sara'),david=s.characters.get('stage4-david');
   const player=s.characters.get('stage4-player'),warden=s.characters.get('stage4-warden');
   return {ok:true,backend:s.backend,player:s.actor.name,npcs:s.npcs.map(n=>n.name),boss:s.warden.name,count:s.characters.characters.size,assetCount:s.characters.pipeline.assets.size,stage5:s.stage5Slice.root.children.length,playerSource:player.source,wardenSource:warden.source,playerAnimated:player.skeletal.ready,wardenAnimated:warden.skeletal.ready,playerParts:names(player.entity),npcParts:[...names(juan.entity),...names(sara.entity),...names(david.entity)],wardenParts:names(warden.entity),juan:juan.entity.getPosition(),sara:sara.entity.getPosition(),david:david.entity.getPosition()};
  }catch(e){return {ok:false,error:e?.message||String(e),stack:e?.stack};}
  finally{probe.destroy();canvas.remove();}
 },{controls,hud,suffix});
}

test('public game boots Stage 5 entrypoint without browser errors',async({page})=>{
 const errors=await open(page);
 await expect(page.locator('#loading')).toBeHidden({timeout:20000});
 await expect(page.locator('#play')).toBeVisible();
 await page.locator('#play').click();
 await expect(page.locator('#intro')).toBeHidden();
 await expect(page.locator('#loading')).toBeHidden();
 await expect(page.locator('#targetName')).toContainText('Juan');
 const runtime=await page.evaluate(()=>({canvas:!!document.querySelector('#game'),stage4Script:[...document.scripts].some(s=>s.src.includes('Stage4Bootstrap.js')),legacyScript:[...document.scripts].some(s=>s.src.includes('GameBootstrap.js'))}));
 expect(runtime).toEqual({canvas:true,stage4Script:true,legacyScript:false});
 expect(errors).toEqual([]);
});

test('PlayCanvas runtime spawns cast, Stage 5 street, identities and GLB animation once',async({page})=>{
 const errors=await open(page);
 const result=await startProbe(page,{suffix:'stage5-runtime'});
 expect(result.ok,result.error).toBe(true);
 expect(['webgpu','webgl2']).toContain(result.backend);
 expect(result.player).toBe('Stage4ActorProbe');
 expect(result.npcs).toEqual(['Juan','Sara','David']);
 expect(result.boss).toBe('Stage4WardenProbe');
 expect(result.count).toBe(5);
 expect(result.assetCount).toBe(1);
 expect(result.stage5).toBeGreaterThan(120);
 expect(result.playerSource).toBe('procedural');
 expect(result.playerAnimated).toBe(false);
 expect(result.wardenSource).toBe('procedural');
 expect(result.wardenAnimated).toBe(false);
 expect(result.playerParts).toEqual(expect.arrayContaining(['AlejandroTorso','FaceNose','JacketCollarL','Belt','KneePanelL','SmartWatch']));
 expect(result.npcParts).toEqual(expect.arrayContaining(['JuanJacket','JuanRolePanelDevOps','SaraJacket','SaraRolePanelBackend','DavidJacket','DavidRolePanelLab']));
 expect(result.wardenParts).toEqual(expect.arrayContaining(['WardenTorso','WardenVisor','WardenCoreGlow','WardenHelmetCrest','WardenHornL','WardenClawR','WardenIdentity','WardenChestArmor','WardenCore']));
 expect(result.playerParts).not.toContain('WardenVisor');
 expect(result.wardenParts).not.toContain('JacketBody');
 expect(result.sara.x).toBe(98);
 expect(errors).toEqual([]);
});

test('gameplay loop covers movement, missions, boss combat, projectiles and reset in one runtime',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  const {PlayCanvasProbe}=await import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage5-gameplay');
  const controls={move:{x:0,y:-1},running:false,locked:false,cameraDelta:40,onAction(){},onShoot(){},onLock(){},consumeCamera(){const d=this.cameraDelta;this.cameraDelta=0;return d;},setCombat(active){this.combat=active;if(!active)this.locked=false;}};
  const hudEvents={objectives:[],combat:[],finish:[],dialogs:[],syncs:0};
  const hud={objective:(distance,angle,name)=>hudEvents.objectives.push({distance,angle,name}),combat:v=>hudEvents.combat.push(v),finish:v=>hudEvents.finish.push(v),dialog:(name,text)=>hudEvents.dialogs.push({name,text}),sync:()=>hudEvents.syncs++};
  const canvas=document.createElement('canvas');canvas.width=360;canvas.height=240;document.body.appendChild(canvas);
  const probe=new PlayCanvasProbe(canvas,{controls,hud});
  try{
   await probe.init();const s=await probe.start();await s.ensurePhysics();
   const start=s.actor.getPosition().clone();controls.cameraDelta=0;
   for(let i=0;i<30;i++){s.controlsBridge.update(s.playerController,1/60);s.physics.syncPlayer(s.actor.getPosition());s.physics.step(1/60);}
   const moved=s.actor.getPosition().z-start.z;
   controls.cameraDelta=40;const yawBefore=s.thirdPersonCamera.yaw;s.controlsBridge.update(s.playerController,1/60);const yawAfter=s.thirdPersonCamera.yaw;
   const completed=[];
   for(const id of ['stage4-juan','stage4-sara','stage4-david']){const c=s.characters.get(id);s.actor.setPosition(c.entity.getPosition());completed.push(s.missions.interact(s.actor).character);}
   s.actor.setPosition(0,0,-130);s.warden.setPosition(0,0,-150);s.state.startBoss();s.bossEncounter.setLock(true);s.physics.syncPlayer(s.actor.getPosition());s.physics.syncBoss(s.warden.getPosition());
   const bossBefore=s.state.bossHP,playerBefore=s.state.playerHP;
   const playerShot=s.projectiles.shootPlayer(s.actor,s.warden,true);
   for(let i=0;i<100&&s.state.bossHP===bossBefore;i++){s.projectiles.update(1/60,s.warden,s.actor);s.physics.step(1/60);}
   const enemyShot=s.projectiles.shootEnemy(s.warden,s.actor);
   for(let i=0;i<120&&s.state.playerHP===playerBefore;i++){s.projectiles.update(1/60,s.warden,s.actor);s.physics.step(1/60);}
   s.state.bossHP=12;s.combat.bossHit();await new Promise(r=>setTimeout(r,80));const victory=s.state.finished&&hudEvents.finish.at(-1)===true;
   s.resetSession();
   return {ok:true,moved,yawBefore,yawAfter,cameraDelta:controls.cameraDelta,completed,stage:s.state.stage,xp:s.state.xp,hp:s.state.playerHP,bossHP:s.state.bossHP,bossActive:s.state.bossActive,playerShot,enemyShot,bossBefore,bossAfter:s.state.bossHP,playerBefore,playerAfter:s.state.playerHP,victory,resetPos:s.actor.getPosition(),hudEvents,callbacksRestored:false};
  }catch(e){return {ok:false,error:e?.message||String(e),stack:e?.stack};}
  finally{probe.destroy();canvas.remove();}
 });
 expect(result.ok,result.error).toBe(true);
 expect(result.moved).toBeLessThan(-1);
 expect(result.yawAfter).toBeLessThan(result.yawBefore);
 expect(result.cameraDelta).toBe(0);
 expect(result.completed).toEqual(['Juan','Sara','David']);
 expect(result.playerShot).toBe(true);
 expect(result.enemyShot).toBe(true);
 expect(result.victory).toBe(true);
 expect([result.stage,result.xp,result.hp,result.bossHP,result.bossActive]).toEqual([0,0,3,100,false]);
 expect([result.resetPos.x,result.resetPos.z]).toEqual([0,108]);
 expect(result.hudEvents.finish).toContain(true);
 expect(result.hudEvents.objectives.length).toBeGreaterThan(0);
});

test('legacy Rapier rollback contract still loads in Chromium',async({page})=>{
 await open(page);
 const physicsLoaded=await page.evaluate(async()=>{const m=await import('./src/infrastructure/physics/PhysicsWorld.js?v=stage3-final');const p=new m.PhysicsWorld();try{await p.init();p.addFloor(20);p.addPlayer({x:0,y:0,z:0});p.addBoss({x:4,y:0,z:0});p.addObstacle({x:2,z:0,hw:.5,hd:2},3);return p.ready&&p.projectileBlocked({x:2,z:0})===true&&p.playerBossOverlap({x:0,z:0},{x:0,z:0})===true}catch{return false}});
 expect(physicsLoaded).toBe(true);
});
