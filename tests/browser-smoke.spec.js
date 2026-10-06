import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';

let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,800));});
test.afterAll(()=>server?.kill());

test('game loads and starts in a real browser without engine errors',async({page})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await expect(page.locator('#play')).toBeVisible();
 await page.locator('#play').click();
 await expect(page.locator('#intro')).toBeHidden();
 await page.waitForTimeout(700);
 await expect(page.locator('#loading')).toBeHidden();
 expect(errors).toEqual([]);
 await expect(page.locator('#targetName')).toContainText('Juan');
});


test('stage 3 physics loads without blocking gameplay',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('#play').click();await page.waitForTimeout(1800);await expect(page.locator('#intro')).toBeHidden();await expect(page.locator('#loading')).toBeHidden();expect(errors).toEqual([]);const physicsLoaded=await page.evaluate(async()=>{const m=await import('./src/infrastructure/physics/PhysicsWorld.js?v=stage3-final');const p=new m.PhysicsWorld();try{await p.init();p.addFloor(20);p.addPlayer({x:0,y:0,z:0});p.addBoss({x:4,y:0,z:0});p.addObstacle({x:2,z:0,hw:.5,hd:2},3);return p.ready&&p.projectileBlocked({x:2,z:0})===true&&p.playerBossOverlap({x:0,z:0},{x:0,z:0})===true}catch(e){return false}});expect(physicsLoaded).toBe(true);});


test('stage 4 PlayCanvas engine initializes in a real browser',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const m=await import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage4');
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;document.body.appendChild(canvas);
  const probe=new m.PlayCanvasProbe(canvas);
  try{await probe.init();const started=await probe.start();await new Promise(r=>setTimeout(r,120));return {ok:true,backend:started.backend,actor:started.actor.name};}
  catch(e){return {ok:false,error:e?.message||String(e)};}finally{probe.destroy();canvas.remove();}
 });
 expect(result.ok,result.error).toBe(true);expect(['webgpu','webgl2']).toContain(result.backend);expect(result.actor).toBe('Stage4ActorProbe');expect(errors).toEqual([]);
});


test('stage 4 loads a licensed rigged humanoid GLB in Chromium',async({page})=>{await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});const result=await page.evaluate(async()=>{const [{PlayCanvasProbe},{Stage4AssetPipeline},{STAGE4_ASSETS}]=await Promise.all([import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage4-glb'),import('./src/infrastructure/rendering/Stage4AssetPipeline.js'),import('./src/infrastructure/rendering/Stage4AssetCatalog.js')]);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;document.body.appendChild(canvas);const probe=new PlayCanvasProbe(canvas);try{await probe.init();const pipeline=new Stage4AssetPipeline(probe.app);const cfg=STAGE4_ASSETS.humanoid;const entity=await pipeline.loadAndInstantiate(cfg.id,cfg.url,{position:[0,0,0]});return {ok:!!entity,loaded:pipeline.has(cfg.id),name:entity.name};}catch(e){return {ok:false,error:e?.message||String(e)};}finally{probe.destroy();canvas.remove();}});expect(result.ok,result.error).toBe(true);expect(result.loaded).toBe(true);expect(result.name).toBe('cesium-man');});


test('stage 4 scene spawns player NPCs and Warden through character system',async({page})=>{await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});const result=await page.evaluate(async()=>{const {PlayCanvasProbe}=await import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage4-cast');const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;document.body.appendChild(canvas);const probe=new PlayCanvasProbe(canvas);try{await probe.init();const s=await probe.start();return {player:s.actor.name,npcs:s.npcs.map(n=>n.name),boss:s.warden.name,count:s.characters.characters.size,assetCount:s.characters.pipeline.assets.size};}catch(e){return {error:e?.message||String(e)}}finally{probe.destroy();canvas.remove();}});expect(result.error).toBeUndefined();expect(result.player).toBe('Stage4ActorProbe');expect(result.npcs).toEqual(['Juan','Sara','David']);expect(result.boss).toBe('Stage4WardenProbe');expect(result.count).toBe(5);expect(result.assetCount).toBe(1);});


test('stage 4 rigged GLB exposes skinning and animation resources in Chromium',async({page})=>{await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});const result=await page.evaluate(async()=>{const [{PlayCanvasProbe},{Stage4AssetPipeline},{STAGE4_ASSETS}]=await Promise.all([import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage4-rig'),import('./src/infrastructure/rendering/Stage4AssetPipeline.js'),import('./src/infrastructure/rendering/Stage4AssetCatalog.js')]);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;document.body.appendChild(canvas);const probe=new PlayCanvasProbe(canvas);try{await probe.init();const pipeline=new Stage4AssetPipeline(probe.app),cfg=STAGE4_ASSETS.humanoid;await pipeline.loadGlb(cfg.id,cfg.url);const asset=pipeline.assets.get(cfg.id),resource=asset.resource,entity=pipeline.instantiate(cfg.id);const renders=entity.findComponents('render');const meshes=renders.flatMap(r=>r.meshInstances??[]);const skins=meshes.filter(mi=>!!mi.skinInstance).length;const animationCount=(resource.animations?.length??0)+(resource.assets?.filter?.(a=>a.type==='animation').length??0);return {ok:true,animations:animationCount,skins,renderCount:renders.length,meshCount:meshes.length,hasSkinMeshes:meshes.some(mi=>!!mi.skinInstance)};}catch(e){return {ok:false,error:e?.message||String(e)}}finally{probe.destroy();canvas.remove();}});expect(result.ok,result.error).toBe(true);expect(result.renderCount).toBeGreaterThan(0);expect(result.skins).toBeGreaterThan(0);expect(result.animations).toBeGreaterThan(0);});


test('stage 4 rigged humanoid animation advances its skeleton across frames',async({page})=>{await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});const result=await page.evaluate(async()=>{const [{PlayCanvasProbe},{Stage4AssetPipeline},{STAGE4_ASSETS}]=await Promise.all([import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage4-motion'),import('./src/infrastructure/rendering/Stage4AssetPipeline.js'),import('./src/infrastructure/rendering/Stage4AssetCatalog.js')]);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;document.body.appendChild(canvas);const probe=new PlayCanvasProbe(canvas);try{await probe.init();const pipeline=new Stage4AssetPipeline(probe.app),cfg=STAGE4_ASSETS.humanoid;await pipeline.loadGlb(cfg.id,cfg.url);const asset=pipeline.assets.get(cfg.id),entity=pipeline.instantiate(cfg.id),clips=asset.resource.animations??[];if(!clips.length)return {ok:false,error:'GLB has no animations'};entity.addComponent('anim',{activate:true});const anim=entity.anim??entity.c?.anim??entity.findComponent?.('anim');if(!anim)return {ok:false,error:'AnimComponent not registered',animProp:!!entity.anim,componentKeys:Object.keys(entity.c??{})};const stateGraph={layers:[{name:'base',states:[{name:'START'},{name:'motion',speed:1,loop:true}],transitions:[{from:'START',to:'motion'}]}],parameters:{}};anim.loadStateGraph(stateGraph);anim.assignAnimation('motion',clips[0].resource??clips[0],'base');probe.app.start();const joints=entity.findComponents('render').flatMap(r=>r.meshInstances??[]).map(mi=>mi.skinInstance?.bones??[]).flat().filter(Boolean);const bone=joints.find(b=>b.name&&b.name!=='Scene')??joints[0];if(!bone)return {ok:false,error:'No skinned bone found'};const before=bone.getWorldTransform().data.slice();await new Promise(r=>setTimeout(r,450));const after=bone.getWorldTransform().data.slice();const delta=after.reduce((sum,v,i)=>sum+Math.abs(v-before[i]),0);return {ok:true,clipCount:clips.length,bone:bone.name,delta};}catch(e){return {ok:false,error:e?.message||String(e)}}finally{probe.destroy();canvas.remove();}});expect(result.ok,result.error).toBe(true);expect(result.clipCount).toBeGreaterThan(0);expect(result.delta).toBeGreaterThan(0.0001);});


test('stage 4 CharacterSystem binds skeletal animation and accepts locomotion semantics',async({page})=>{await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});const result=await page.evaluate(async()=>{const {PlayCanvasProbe}=await import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage4-character-motion');const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;document.body.appendChild(canvas);const probe=new PlayCanvasProbe(canvas);try{await probe.init();const s=await probe.start(),character=s.characters.get('stage4-player');const state=s.characters.setLocomotion('stage4-player',1,true);await new Promise(r=>setTimeout(r,120));return {ok:true,source:character.source,ready:character.skeletal.ready,state,current:character.skeletal.current,playing:character.entity.anim?.playing??false};}catch(e){return {ok:false,error:e?.message||String(e)}}finally{probe.destroy();canvas.remove();}});expect(result.ok,result.error).toBe(true);expect(result.source).toBe('glb');expect(result.ready).toBe(true);expect(result.state).toBe('run');expect(result.current).toBeTruthy();expect(result.playing).toBe(true);});
