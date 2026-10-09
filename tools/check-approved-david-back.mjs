// Read-only visual verification of approved David; never alters model resources.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output='/workspace/artifacts/david-back-review';
const model=path.join(root,'assets/characters/npc-phase4/david/david.glb');
const checksum=createHash('sha256').update(await fs.readFile(model)).digest('hex');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1000,height:1100}});
 const page=await context.newPage(),errors=[],captures=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',route=>route.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto('http://127.0.0.1:4173/assets/characters/npc-phase4/review/');
 await page.waitForFunction(()=>window.npcReview?.ready,{timeout:30000});
 await page.evaluate(()=>{window.npcReview.setCharacter('david');window.npcReview.setView('back');});
 for(const clip of ['Idle','Interact','Wave']){
  for(const seconds of [.6,1.2]){
   const pose=await page.evaluate(async({clip,seconds})=>{
    const review=window.npcReview,actor=review.characters.get('david');
    const index=actor.clips.indexOf(clip);
    if(index<0)throw new Error('Missing David clip: '+clip);
    const layer=actor.visual.anim.baseLayer;
    layer.play('clip'+index);layer.pause();layer.activeStateCurrentTime=seconds;
    review.app.renderNextFrame=true;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {clip,seconds,animationTime:layer.activeStateCurrentTime,activeState:layer.activeState,root:Array.from(actor.entity.getPosition().toArray())};
   },{clip,seconds});
   const filename='david-back-'+clip.toLowerCase()+'-'+Math.round(seconds*1000)+'ms.png';
   await page.locator('#character').screenshot({path:path.join(output,filename)});
   captures.push({...pose,file:filename});
  }
 }
 const after=createHash('sha256').update(await fs.readFile(model)).digest('hex');
 if(after!==checksum)throw new Error('Approved model changed during inspection');
 if(errors.length)throw new Error(errors.join('\n'));
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify({engine:'PlayCanvas 2.23.0',modelSha256:checksum,modelUnchanged:true,captures,errors},null,2)+'\n');
 console.log('DAVID_BACK_REVIEW_CAPTURED',captures.map(c=>c.file));
 await context.close();
}finally{await browser.close();}
