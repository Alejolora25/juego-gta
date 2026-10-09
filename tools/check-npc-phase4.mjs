// Real Chromium validation and recording of isolated NPC review assets.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'assets/characters/npc-phase4'),art='/workspace/artifacts/npc-phase4';
await fs.mkdir(art,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:900,height:960},recordVideo:{dir:art,size:{width:900,height:960}}});
 const page=await context.newPage(),errors=[],results=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',r=>r.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto('http://127.0.0.1:4173/assets/characters/npc-phase4/review/');
 await page.waitForFunction(()=>window.npcReview?.ready,{timeout:30000});
 for(const id of ['juan','sara','david']){
  await page.evaluate(id=>{window.npcReview.setCharacter(id);window.npcReview.setView('quarter');},id);
  await page.waitForTimeout(650);await page.screenshot({path:dir+'/review/chromium-'+id+'.png'});
  const result=await page.evaluate(async id=>{
   const r=window.npcReview,actor=r.characters.get(id),samples=[];
   for(const clip of actor.clips){
    r.setClip(clip);await new Promise(resolve=>setTimeout(resolve,900));
    const meshes=actor.visual.findComponents('render').flatMap(x=>x.meshInstances);
    const bounds=meshes.map(x=>({min:x.aabb.center.y-x.aabb.halfExtents.y,max:x.aabb.center.y+x.aabb.halfExtents.y}));
    const hands=['Wrist.L','Wrist.R'].map(name=>{
     const bone=actor.visual.findByName(name);if(!bone)throw new Error('Missing animated wrist: '+name);
     return Array.from(bone.getPosition().toArray());
    });
    samples.push({clip,root:Array.from(actor.entity.getPosition().toArray()),bounds,hands});
   }
   r.setClip('Idle');return {id,clips:actor.clips,ready:actor.skeletal.ready,samples};
  },id);
  if(!result.ready||result.clips.length!==3||!['Idle','Interact','Wave'].every(c=>result.clips.includes(c)))throw new Error('NPC animation contract failed: '+id);
  for(const sample of result.samples){
   if(sample.root.some(v=>Math.abs(v)>1e-6)||sample.bounds.some(b=>!Number.isFinite(b.min+b.max)))throw new Error('Invalid NPC root/bounds: '+id);
  }
  const idle=result.samples.find(s=>s.clip==='Idle');
  for(const sample of result.samples.filter(s=>s.clip!=='Idle')){
   sample.handDistanceFromIdleMetres=Math.max(...sample.hands.map((p,i)=>Math.hypot(...p.map((value,k)=>value-idle.hands[i][k]))));
   if(sample.handDistanceFromIdleMetres<.02)throw new Error('Gesture did not change actual skeletal pose: '+id+'/'+sample.clip);
  }
  results.push(result);
 }
 await page.evaluate(()=>{window.npcReview.setCharacter('sara');window.npcReview.setView('back');});await page.waitForTimeout(700);
 const video=page.video();await context.close();await video.saveAs(art+'/npc-motion.webm');
 await fs.writeFile(dir+'/chromium-report.json',JSON.stringify({engine:'PlayCanvas 2.23.0',results,errors,gameplayChanged:false,samsungValidated:false},null,2)+'\n');
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('NPC_PHASE4_CHROMIUM_OK',results.map(x=>x.id));
}finally{await browser.close();}
