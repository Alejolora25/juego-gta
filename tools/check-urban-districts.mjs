import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--ignore-certificate-errors']});
try{
 const page=await browser.newPage({viewport:{width:590,height:1100},ignoreHTTPSErrors:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error'&&/shader|compile|WebGL/i.test(msg.text()))errors.push(msg.text());});
 await page.route('**/Stage4Bootstrap.js*',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/?pilot=1',{waitUntil:'networkidle'});
 const report=await page.evaluate(async()=>{
  const {PlayCanvasProbe}=await import('/src/infrastructure/rendering/PlayCanvasProbe.js');
  const canvas=document.createElement('canvas');document.body.appendChild(canvas);
  Object.assign(canvas.style,{position:'fixed',inset:'0',zIndex:1000});
  const probe=new PlayCanvasProbe(canvas);await probe.init();const s=await probe.start();window.city={probe,s};
  const deadline=Date.now()+15000;while(!s.physics.ready&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
  if(!s.physics.ready)throw new Error('Rapier unavailable');
  const protectedRoads=[...[-86,0,86].map(x=>s.physics.resolveMovement({x,z:180},{x,z:-105})),...[-70,0,70,138].map(z=>s.physics.resolveMovement({x:-180,z},{x:180,z}))];
  return {buildings:s.urbanPilot.buildings.length,districts:s.urbanPilot.districts.length,trees:s.urbanPilot.surfaces.trees.length,lamps:s.urbanPilot.surfaces.fixtures.length,assets:s.characters.pipeline.assets.size,protectedRoads};
 });
 for(const [name,x,z,yaw] of [['centro',0,108,.65],['canales',-108,40,.9],['industrial',98,-12,1.1],['mirador',0,-92,.65]]){
  await page.evaluate(({x,z,yaw})=>{const {s}=window.city;s.actor.setPosition(x,0,z);s.thirdPersonCamera.yaw=yaw;s.actor.setEulerAngles(0,yaw*180/Math.PI+180,0);},{x,z,yaw});
  await page.waitForTimeout(900);await page.screenshot({path:`/tmp/urban-district-${name}.png`});
 }
 console.log(JSON.stringify({report,errors},null,2));assert.equal(errors.length,0);assert.ok(report.buildings>60);
 for(const r of report.protectedRoads.slice(0,3))assert.equal(r.z,-105);
 for(const r of report.protectedRoads.slice(3))assert.equal(r.x,180);
}finally{await browser.close();}
