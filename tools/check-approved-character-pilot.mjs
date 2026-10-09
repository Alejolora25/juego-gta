// Capture the real approved-human pilot with existing controls, HUD and city.
// Review harness only: no production debug globals or model files are changed.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'docs/character-renewal/evidence/approved-pilot');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--ignore-certificate-errors']});
try{
 const context=await browser.newContext({viewport:{width:640,height:1024},ignoreHTTPSErrors:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/Stage4Bootstrap.js*',route=>route.abort());
 await page.route('https://cdn.jsdelivr.net/npm/playcanvas@2.23.0/build/playcanvas.mjs',route=>route.fulfill({path:path.join(root,'node_modules/playcanvas/build/playcanvas.mjs'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto('http://127.0.0.1:4173/?pilot=1&characters=approved',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const [{PlayCanvasProbe},{TouchControls},{HudController}]=await Promise.all([
   import('/src/infrastructure/rendering/PlayCanvasProbe.js'),
   import('/src/infrastructure/input/TouchControls.js'),import('/src/presentation/HudController.js')
  ]);
  const $=id=>document.getElementById(id);
  const controls=new TouchControls({joy:$('joy'),stick:$('stick'),camPad:$('camPad'),run:$('run'),action:$('action'),shoot:$('shoot'),lock:$('lock')});
  const hud=new HudController($),probe=new PlayCanvasProbe($('game'),{controls,hud});
  await probe.init();const session=await probe.start();
  const deadline=Date.now()+15000;
  while(!session.physics.ready&&Date.now()<deadline)await new Promise(r=>setTimeout(r,25));
  if(!session.physics.ready)throw new Error('Pilot physics unavailable');
  session.actor.setEulerAngles(0,180,0);session.thirdPersonCamera.update(session.actor,1);
  hud.sync(session.state);$('intro').style.display='none';$('loading').style.display='none';
  $('cont').onclick=()=>{$('dialog').style.display='none';};
  window.approvedPilotReview={probe,session,controls,hud};
 });
 const captures=[];
 const capture=async name=>{
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(output,name+'.png')});
  captures.push(await page.evaluate(name=>{
   const {session:s}=window.approvedPilotReview,p=s.actor.getPosition();
   return {name,playerPosition:Array.from(p.toArray()),playerClip:s.characters.get('stage4-player').skeletal.current,surface:s.approvedPresentation.heightAt(p.x,p.z),stage:s.state.stage};
  },name));
 };
 await capture('alejandro-idle');
 // Drive the real joystick element rather than replacing movement semantics.
 const joy=await page.locator('#joy').boundingBox();
 await page.mouse.move(joy.x+joy.width/2,joy.y+joy.height/2);await page.mouse.down();
 await page.mouse.move(joy.x+joy.width/2,joy.y+joy.height/2-joy.width*.34);
 await page.waitForTimeout(900);await capture('alejandro-walk');await page.mouse.up();
 for(const [id,name] of [['stage4-juan','juan'],['stage4-sara','sara'],['stage4-david','david']]){
  await page.evaluate(id=>{
   const {session:s}=window.approvedPilotReview,p=s.characters.get(id).entity.getPosition();
   s.actor.setPosition(p.x+.3,0,p.z+2.5);s.actor.setEulerAngles(0,180,0);
   s.thirdPersonCamera.yaw=.2;s.thirdPersonCamera.update(s.actor,1);s.approvedPresentation.update();
  },id);
  await capture(name+'-in-city');
  await page.locator('#action').dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch'});
  await page.locator('#cont').click();
 }
 const result=await page.evaluate(()=>{
  const {session:s}=window.approvedPilotReview;
  return {engine:'PlayCanvas 2.23.0',cast:[...s.characters.characters.values()].map(c=>({id:c.id,url:c.assetUrl,approved:c.approvedVisual,clip:c.skeletal.current,position:Array.from(c.entity.getPosition().toArray())})),buildings:s.urbanPilot.buildings.length,districts:s.urbanPilot.districts.length,stage:s.state.stage,xp:s.state.xp,groundSurfaces:s.approvedPresentation.surfaces.length};
 });
 if(errors.length||result.stage!==3||result.xp!==300)throw new Error('Pilot review failed: '+JSON.stringify({errors,result}));
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify({...result,captures,errors,samsungValidated:false,warden:'Existing pilot robot retained; selected Vanguard official source pending'},null,2)+'\n');
 await page.evaluate(()=>window.approvedPilotReview.probe.destroy());await context.close();
 console.log('APPROVED_CHARACTER_PILOT_CAPTURED',captures.map(c=>c.name));
}finally{await browser.close();}
