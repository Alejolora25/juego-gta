// Isolated source inspection. Never starts or integrates models into the game.
import {chromium} from 'playwright';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.join(repo,'assets/character-library');
const inspection=JSON.parse(await fs.readFile(root+'/inspection.json','utf8'));
const models=inspection.results.filter(x=>!x.source.includes('Hairstyles'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--ignore-certificate-errors']});
try{
 const page=await browser.newPage({viewport:{width:1500,height:650},ignoreHTTPSErrors:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(/shader|WebGL|Failed to resolve/.test(m.text())&&m.type()==='error')errors.push(m.text());});
 page.on('requestfailed',r=>{if(!r.url().includes('Stage4Bootstrap.js'))errors.push(r.url()+': '+r.failure()?.errorText);});
 await page.route('**/Stage4Bootstrap.js*',r=>r.abort());
 await page.goto('http://127.0.0.1:4174/juego-gta/',{waitUntil:'networkidle'});
 const results=await page.evaluate(async models=>{
  const pc=await import('playcanvas');
  const {PlayCanvasProbe}=await import('/juego-gta/src/infrastructure/rendering/PlayCanvasProbe.js');
  const {Stage4AssetPipeline}=await import('/juego-gta/src/infrastructure/rendering/Stage4AssetPipeline.js');
  const {Stage4SkeletalAnimation}=await import('/juego-gta/src/infrastructure/rendering/Stage4SkeletalAnimation.js');
  const canvas=document.createElement('canvas');document.body.append(canvas);Object.assign(canvas.style,{position:'fixed',inset:0,zIndex:1000});
  const probe=new PlayCanvasProbe(canvas);await probe.init();const app=probe.app;
  const pipeline=new Stage4AssetPipeline(app);const records=[];
  app.scene.ambientLight.set(.65,.65,.65);
  const light=new pc.Entity();light.addComponent('light',{type:'directional',intensity:1.4});light.setEulerAngles(35,135,0);app.root.addChild(light);
  const camera=new pc.Entity();camera.addComponent('camera',{clearColor:new pc.Color(.22,.25,.28)});app.root.addChild(camera);camera.setPosition(6,3.1,11);camera.lookAt(6,.9,0);
  for(const [index,model] of models.entries()){
   const id='validation-'+index;
   await pipeline.loadGlb(id,model.inspectionFile.replace('/workspace',''));
   const entity=pipeline.instantiate(id,{position:[index*2.6,0,0]});
   const meshes=entity.findComponents('render').flatMap(x=>x.meshInstances);
   const skeletal=new Stage4SkeletalAnimation(entity);
   const originalClips=pipeline.animations(id);
   const clips=model.source.includes('universal-animation')?originalClips.filter(c=>['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop'].includes(c.resource?.name??c.name)):originalClips;
   skeletal.configure(clips);if(skeletal.ready)skeletal.playSemantic('idle');
   records.push({id,entity,skeletal,model,meshes});
  }
  // Base characters have no clips: validate external library binding separately.
  records[0].skeletal.configure(pipeline.animations('validation-1').filter(c=>['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop'].includes(c.resource?.name??c.name)));
  records[0].skeletal.playSemantic('idle');
  app.start();await new Promise(r=>setTimeout(r,1200));
  const output=records.map(r=>({source:r.model.source,meshInstances:r.meshes.length,
   skinInstances:r.meshes.filter(m=>m.skinInstance).length,animationReady:r.skeletal.ready,
   clips:r.skeletal.available(),active:r.skeletal.current,rootPosition:Array.from(r.entity.getPosition().toArray()),
   bounds:r.meshes.map(m=>({center:Array.from(m.aabb.center.toArray()),halfExtents:Array.from(m.aabb.halfExtents.toArray())}))}));
  const base=records[0];base.skeletal.playSemantic('walk');await new Promise(r=>setTimeout(r,1000));
  output[0].walkClip=base.skeletal.current;output[0].rootAfterWalk=Array.from(base.entity.getPosition().toArray());
  base.skeletal.playSemantic('idle');return output;
 },models);
 await page.screenshot({path:'/workspace/artifacts/lora25-phase2/quaternius-source-validation.png'});
 const report={date:'2026-10-09',engine:'PlayCanvas 2.23.0',scene:'isolated source validation, not gameplay integration',results,errors};
 await fs.writeFile(root+'/playcanvas-inspection.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({models:results.length,errors,baseAnimated:results[0].animationReady,baseWalk:results[0].walkClip}));
 if(errors.length)throw new Error('Browser inspection errors');
 if(results[0].active!=='Idle_Loop'||results[0].walkClip!=='Walk_Loop')throw new Error('Incorrect locomotion mapping');
 if(!results.every(r=>r.animationReady&&r.meshInstances>0&&r.skinInstances>0))throw new Error('Unusable skeletal source');
}finally{await browser.close();}
