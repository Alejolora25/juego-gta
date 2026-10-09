// Record the real isolated PlayCanvas model, without altering the game.
import {chromium} from 'playwright';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const variant=process.env.LORA25_ALEJANDRO_VARIANT??'alejandro-phase3';
if(!['alejandro-phase3','alejandro-explorer'].includes(variant))throw new Error('Unsupported isolated character variant');
const dir=path.join(root,'assets/characters',variant,'review');
await fs.mkdir(`/workspace/artifacts/${variant}/video`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:720,height:900},recordVideo:{dir:`/workspace/artifacts/${variant}/video`,size:{width:720,height:900}}});
 const recordingStarted=Date.now();
 const page=await context.newPage();
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',r=>r.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto(`http://127.0.0.1:4173/assets/characters/${variant}/review/`);
 await page.waitForFunction(()=>window.alejandroReview?.ready,{timeout:30000});
 await page.waitForTimeout(500);
 const reviewStartSeconds=(Date.now()-recordingStarted)/1000;
 for(const [clip,view,ms] of [['Idle','quarter',2000],['Walk','quarter',3000],['Run','quarter',3000],['Interact','front',2400],['Combat','quarter',1500],['TurnLeft','front',1200],['Walk','back',2500],['Idle','quarter',1000]]){
  await page.evaluate(({clip,view})=>{window.alejandroReview.setView(view);window.alejandroReview.setClip(clip);},{clip,view});
  await page.waitForTimeout(ms);
  if(clip==='Run')await page.screenshot({path:dir+'/chromium-run.png'});
 }
 const video=page.video();await context.close();await video.saveAs(`/workspace/artifacts/${variant}/alejandro-motion.webm`);
 await fs.writeFile(`/workspace/artifacts/${variant}/recording-timeline.json`,JSON.stringify({variant,reviewStartSeconds},null,2)+'\n');
 console.log('LORA25_PHASE3_VIDEO_RECORDED');
}finally{await browser.close();}
