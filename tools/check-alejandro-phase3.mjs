// Isolated review with the installed PlayCanvas version; no public game changes.
import {chromium} from 'playwright';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'assets/characters/alejandro-phase3');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',r=>r.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto('http://127.0.0.1:4173/assets/characters/alejandro-phase3/review/');
 await page.waitForFunction(()=>window.alejandroReview?.ready,{timeout:30000});
 await page.waitForTimeout(500);
 for(const view of ['front','quarter','side','back']){
  await page.evaluate(v=>window.alejandroReview.setView(v),view);
  await page.waitForTimeout(350);
  await page.screenshot({path:dir+'/review/chromium-'+view+'.png'});
 }
 const report=await page.evaluate(async()=>{
  const r=window.alejandroReview,output={clips:r.clips,meshes:r.visual.findComponents('render').flatMap(x=>x.meshInstances).length,root:Array.from(r.entity.getPosition().toArray()),samples:[]};
  for(const clip of r.clips){
   r.setClip(clip);await new Promise(resolve=>setTimeout(resolve,550));
   const meshes=r.visual.findComponents('render').flatMap(x=>x.meshInstances);
   const min=Math.min(...meshes.map(m=>m.aabb.center.y-m.aabb.halfExtents.y));
   const max=Math.max(...meshes.map(m=>m.aabb.center.y+m.aabb.halfExtents.y));
   output.samples.push({clip,min,max,root:Array.from(r.entity.getPosition().toArray())});
  }
  r.setClip('Idle');r.setView('quarter');return output;
 });
 if(report.clips.length!==10||!report.clips.includes('Run'))throw new Error('Required animations missing');
 for(const sample of report.samples)if(sample.root.some(v=>Math.abs(v)>1e-6)||!Number.isFinite(sample.min+sample.max))throw new Error('Invalid animated geometry or moving gameplay root');
 report.errors=errors;report.engine='PlayCanvas 2.23.0 (installed package, offline Chromium)';
 await fs.writeFile(dir+'/chromium-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
