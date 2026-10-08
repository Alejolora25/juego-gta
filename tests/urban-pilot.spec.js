import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,800));});
test.afterAll(()=>server?.kill());

test('urban pilot preserves human scale, idle NPCs, locomotion and clear road collisions',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/Stage4Bootstrap.js*',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/?pilot=1',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const {PlayCanvasProbe}=await import('/src/infrastructure/rendering/PlayCanvasProbe.js');
  const canvas=document.createElement('canvas');document.body.appendChild(canvas);
  const probe=new PlayCanvasProbe(canvas);
  try{
   await probe.init();const s=await probe.start();
   const deadline=Date.now()+15000;
   while(!s.physics.ready&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
   if(!s.physics.ready)throw new Error('Rapier unavailable');
   const c=s.characters.get('stage4-player');
   const bounds=()=>{let lo=Infinity,hi=-Infinity;for(const r of c.visual.findComponents('render'))for(const m of r.meshInstances){lo=Math.min(lo,m.aabb.center.y-m.aabb.halfExtents.y);hi=Math.max(hi,m.aabb.center.y+m.aabb.halfExtents.y);}return {lo,hi};};
   await new Promise(r=>setTimeout(r,180));const idle=bounds();
   s.playerController.update({joy:{x:0,y:-1},dt:1/60});await new Promise(r=>setTimeout(r,200));const walk=c.skeletal.current,walkBounds=bounds();
   s.playerController.update({joy:{x:0,y:-1},running:true,dt:1/60});await new Promise(r=>setTimeout(r,200));
   return {idle,walkBounds,runBounds:bounds(),walk,run:c.skeletal.current,rootY:c.entity.getPosition().y,npcs:['stage4-juan','stage4-sara','stage4-david'].map(id=>s.characters.get(id).skeletal.current),blocked:s.physics.resolveMovement({x:9,z:94},{x:13,z:94}),road:s.physics.resolveMovement({x:0,z:108},{x:0,z:98}),cast:[...s.characters.characters.values()].map(r=>r.source)};
  }finally{probe.destroy();canvas.remove();}
 });
 expect(result.cast).toEqual(['glb','glb','glb','glb','glb']);
 expect(result.npcs).toEqual(['Idle','Idle','Idle']);
 expect(result.walk).toBe('Walk');expect(result.run).toBe('Run');expect(result.rootY).toBe(0);
 for(const b of [result.idle,result.walkBounds,result.runBounds]){expect(b.lo).toBeGreaterThan(-.04);expect(b.hi).toBeGreaterThan(1.4);expect(b.hi).toBeLessThan(2.1);}
 expect(result.blocked.x).toBe(9);expect(result.road.z).toBe(98);expect(errors).toEqual([]);
});
