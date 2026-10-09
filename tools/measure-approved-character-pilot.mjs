// Measure the real pilot with one browser/world at a time. Local software
// WebGL timings are diagnostic values, never a proxy for Samsung performance.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const quality=process.argv[2]??'source';
if(!['source','optimized'].includes(quality))throw new Error('Expected source or optimized');
const output=process.argv[3]??`/workspace/artifacts/approved-character-performance-${quality}.json`;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--ignore-certificate-errors']});
try{
 const context=await browser.newContext({viewport:{width:360,height:640},ignoreHTTPSErrors:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/Stage4Bootstrap.js*',route=>route.abort());
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',route=>route.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto(`http://127.0.0.1:4173/?pilot=1&characters=approved&quality=${quality}`,{waitUntil:'networkidle'});
 const report=await page.evaluate(async quality=>{
  const {PlayCanvasProbe}=await import('/src/infrastructure/rendering/PlayCanvasProbe.js');
  const probe=new PlayCanvasProbe(document.getElementById('game'));
  const start=performance.now();await probe.init();const session=await probe.start();
  const readyMs=performance.now()-start;
  try{
   const app=probe.app,device=app.graphicsDevice,gl=device.gl;
   const renderer=gl?.getExtension('WEBGL_debug_renderer_info');
   const gpu=renderer?gl.getParameter(renderer.UNMASKED_RENDERER_WEBGL):device.deviceType;
   const frame=()=>new Promise((resolve,reject)=>{
    const ready=()=>{clearTimeout(timeout);resolve();};
    const timeout=setTimeout(()=>{app.off('frameend',ready);reject(new Error('Renderer stopped producing frames'));},10000);
    app.once('frameend',ready);
   });
   const quantile=(values,q)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor((sorted.length-1)*q)];};
   const views=[];
   for(const [label,x,z] of [['start',0,108],['juan',-28,76.5],['sara',98,-9.5],['david',-108,56.5]]){
    session.actor.setPosition(x,0,z);session.actor.setEulerAngles(0,180,0);
    session.thirdPersonCamera.yaw=.2;session.thirdPersonCamera.update(session.actor,1);
    session.approvedPresentation.update();
    for(let i=0;i<10;i++)await frame();
    const samples=[],drawCalls=[],updateMs=[];
    let before=performance.now();
    for(let i=0;i<45;i++){
     await frame();const now=performance.now();samples.push(now-before);before=now;
     drawCalls.push(app.stats.drawCallCount);updateMs.push(app.stats.cpuUpdateTime);
    }
    const mean=samples.reduce((a,b)=>a+b,0)/samples.length;
    views.push({label,frames:samples.length,meanFrameMs:mean,medianFrameMs:quantile(samples,.5),p95FrameMs:quantile(samples,.95),observedFps:1000/mean,
     meanDrawCalls:drawCalls.reduce((a,b)=>a+b,0)/drawCalls.length,
     meanUpdateCpuMs:updateMs.reduce((a,b)=>a+b,0)/updateMs.length});
   }
   const cast=[...session.characters.characters.values()].filter(c=>c.approvedVisual).map(character=>{
    const asset=session.characters.pipeline.assets.get(character.assetId);
    const textures=(asset.resource.textures??[]).map(a=>a.resource).filter(Boolean);
    return {id:character.id,url:character.assetUrl,textures:textures.map(texture=>({name:texture.name,width:texture.width,height:texture.height,format:texture.format,gpuBytes:texture.gpuSize,mipmaps:texture.mipmaps})),
     primitives:character.visual.findComponents('render').reduce((sum,r)=>sum+r.meshInstances.length,0),clips:character.skeletal.available()};
   });
   const resources=performance.getEntriesByType('resource').filter(entry=>entry.name.includes('/assets/characters/')&&entry.name.endsWith('.glb')).map(entry=>({path:new URL(entry.name).pathname,encodedBodySize:entry.encodedBodySize,transferSize:entry.transferSize,durationMs:entry.duration}));
   return {quality,engine:'PlayCanvas 2.23.0',viewport:[360,640],renderer:gpu,readyMs,views,cast,resources,
    vram:{textureBytes:app.stats.vramTextureBytes,vertexBytes:app.stats.vramVertexBufferBytes,indexBytes:app.stats.vramIndexBufferBytes,totalBytes:app.stats.vramTotalBytes},
    jsHeap:performance.memory?{usedBytes:performance.memory.usedJSHeapSize,totalBytes:performance.memory.totalJSHeapSize}:null,
    city:{buildings:session.urbanPilot.buildings.length,districts:session.urbanPilot.districts.length,obstacles:session.world.obstacles.length},
    limitations:['Single run on local software WebGL; wall times include scheduler and shader compilation variability','Local HTTP and intercepted engine module do not represent mobile-network loading','GPU/heap counters are engine/browser estimates, not total process memory','Skin CPU time is unavailable: the pinned engine does not update its skinTime counter','Samsung FPS, thermals, memory and load times remain unmeasured'],samsungValidated:false};
  }finally{probe.destroy();}
 },quality);
 if(errors.length)throw new Error(errors.join('\n'));
 if(quality==='optimized'&&report.cast.some(c=>!c.url.includes('/runtime-optimized/')))throw new Error('Optimized mode did not load runtime derivatives');
 await fs.mkdir(path.dirname(output),{recursive:true});
 await fs.writeFile(output,JSON.stringify({...report,errors},null,2)+'\n');
 console.log(JSON.stringify({quality,readyMs:report.readyMs,textureBytes:report.vram.textureBytes,views:report.views.map(v=>({label:v.label,drawCalls:v.meanDrawCalls,fps:v.observedFps})),output}));
 await context.close();
}finally{await browser.close();}
