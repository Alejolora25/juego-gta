// Compare the engine's texture-size estimates for the official and runtime
// Vanguard containers. One actual WebGL world, no mobile FPS claim.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--ignore-certificate-errors']});
try{
 const page=await browser.newPage({viewport:{width:360,height:640},ignoreHTTPSErrors:true});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/Stage4Bootstrap.js*',r=>r.abort());
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',r=>r.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto('http://127.0.0.1:4173/?pilot=1&characters=approved&quality=optimized',{waitUntil:'networkidle'});
 const data=await page.evaluate(async()=>{
  const {PlayCanvasProbe}=await import('/src/infrastructure/rendering/PlayCanvasProbe.js');
  const probe=new PlayCanvasProbe(document.getElementById('game'));await probe.init();const s=await probe.start();probe.app.autoRender=false;
  try{
   const original=await s.characters.pipeline.loadGlb('vanguard-original-reference','./assets/characters/warden-vanguard/original/vanguard.glb');
   const optimized=s.characters.pipeline.assets.get(s.characters.get('stage4-warden').assetId);
   const read=asset=>{
    const textures=[...new Set(asset.resource.textures.map(a=>a.resource))];
    return {textureCount:textures.length,textureGpuBytes:textures.reduce((n,t)=>n+t.gpuSize,0),textures:textures.map(t=>({width:t.width,height:t.height,format:t.format,mipmaps:t.mipmaps,gpuBytes:t.gpuSize}))};
   };
   return {engine:'PlayCanvas 2.23.0',original:read(original),optimized:read(optimized),scope:'Engine texture estimates, not total GPU/process residency or Samsung performance',samsungValidated:false};
  }finally{probe.destroy();}
 });
 if(errors.length)throw new Error(errors.join('\n'));
 data.textureSavedPercent=100*(1-data.optimized.textureGpuBytes/data.original.textureGpuBytes);data.errors=errors;
 const out=path.join(root,'docs/character-renewal/evidence/vanguard/texture-comparison.json');await fs.writeFile(out,JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify({original:data.original.textureGpuBytes,optimized:data.optimized.textureGpuBytes,savedPercent:data.textureSavedPercent}));
}finally{await browser.close();}
