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
  try{await probe.init();const started=probe.start();await new Promise(r=>setTimeout(r,120));return {ok:true,backend:started.backend,actor:started.actor.name};}
  catch(e){return {ok:false,error:e?.message||String(e)};}finally{probe.destroy();canvas.remove();}
 });
 expect(result.ok,result.error).toBe(true);expect(['webgpu','webgl2']).toContain(result.backend);expect(result.actor).toBe('Stage4ActorProbe');expect(errors).toEqual([]);
});


test('stage 4 loads a licensed rigged humanoid GLB in Chromium',async({page})=>{await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});const result=await page.evaluate(async()=>{const [{PlayCanvasProbe},{Stage4AssetPipeline},{STAGE4_ASSETS}]=await Promise.all([import('./src/infrastructure/rendering/PlayCanvasProbe.js?v=stage4-glb'),import('./src/infrastructure/rendering/Stage4AssetPipeline.js'),import('./src/infrastructure/rendering/Stage4AssetCatalog.js')]);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;document.body.appendChild(canvas);const probe=new PlayCanvasProbe(canvas);try{await probe.init();const pipeline=new Stage4AssetPipeline(probe.app);const cfg=STAGE4_ASSETS.humanoid;const entity=await pipeline.loadAndInstantiate(cfg.id,cfg.url,{position:[0,0,0]});return {ok:!!entity,loaded:pipeline.has(cfg.id),name:entity.name};}catch(e){return {ok:false,error:e?.message||String(e)};}finally{probe.destroy();canvas.remove();}});expect(result.ok,result.error).toBe(true);expect(result.loaded).toBe(true);expect(result.name).toBe('cesium-man');});
