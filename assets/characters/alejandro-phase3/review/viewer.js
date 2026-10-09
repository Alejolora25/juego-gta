// Standalone art review. It never creates a game world or changes its actors.
import * as pc from 'playcanvas';
import {PlayCanvasProbe} from '../../../../src/infrastructure/rendering/PlayCanvasProbe.js';
import {Stage4AssetPipeline} from '../../../../src/infrastructure/rendering/Stage4AssetPipeline.js';
import {Stage4SkeletalAnimation} from '../../../../src/infrastructure/rendering/Stage4SkeletalAnimation.js';

const canvas=document.querySelector('#character');
try{
 const probe=new PlayCanvasProbe(canvas);await probe.init();const app=probe.app;
 app.setCanvasFillMode(pc.FILLMODE_NONE);app.setCanvasResolution(pc.RESOLUTION_AUTO);
 canvas.style.width='100%';canvas.style.height='100%';
 const resize=()=>app.resizeCanvas(canvas.clientWidth,canvas.clientHeight);
 new ResizeObserver(resize).observe(canvas);resize();
 app.scene.ambientLight.set(.65,.67,.69);app.scene.toneMapping=pc.TONEMAP_ACES;
 const camera=new pc.Entity('ReviewCamera');camera.addComponent('camera',{clearColor:new pc.Color(.72,.77,.80),farClip:30});app.root.addChild(camera);
 for(const [name,rotation,color,intensity] of [
  ['Key',[40,-30,0],[1,.96,.89],1.6],['Fill',[20,140,0],[.80,.88,1],.8],['Rim',[35,190,0],[1,1,1],.3]]){
  const light=new pc.Entity(name);light.addComponent('light',{type:'directional',color:new pc.Color(...color),intensity,castShadows:name==='Key',shadowResolution:1024,shadowDistance:10,shadowBias:.04,normalOffsetBias:.02});light.setEulerAngles(...rotation);app.root.addChild(light);
 }
 const groundMaterial=new pc.StandardMaterial();groundMaterial.diffuse.set(.50,.54,.56);groundMaterial.gloss=.1;groundMaterial.update();
 const floor=new pc.Entity('ReviewFloor');floor.addComponent('render',{type:'plane',material:groundMaterial});floor.setLocalScale(8,1,8);floor.setPosition(0,-.002,0);app.root.addChild(floor);
 const pipeline=new Stage4AssetPipeline(app);await pipeline.loadGlb('alejandro-review','../alejandro.glb');
 const entity=new pc.Entity('StableGameplayRoot');app.root.addChild(entity);
 const facing=new pc.Entity('ExistingModelFacing');facing.setLocalEulerAngles(0,180,0);entity.addChild(facing);
 const visual=pipeline.instantiate('alejandro-review',{parent:facing});
 const skeletal=new Stage4SkeletalAnimation(visual);skeletal.configure(pipeline.animations('alejandro-review'));
 const clips=skeletal.available();let current='Idle',yaw=.52,pitch=.1;
 const moveCamera=()=>{camera.setPosition(3.1*Math.sin(yaw),1+3.1*Math.sin(pitch),3.1*Math.cos(yaw));camera.lookAt(0,.95,0);};moveCamera();
 const setView=view=>{yaw={front:0,quarter:.52,side:Math.PI/2,back:Math.PI}[view]??.52;pitch=.1;moveCamera();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));};
 const setClip=name=>{
  const i=clips.indexOf(name);if(i<0)throw new Error('Clip not available: '+name);
  visual.anim.baseLayer.transition('clip'+i,.14);current=name;skeletal.current=name;
  document.querySelectorAll('[data-clip]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clip===name)));
 };
 setClip('Idle');
 document.querySelectorAll('[data-clip]').forEach(b=>b.onclick=()=>setClip(b.dataset.clip));
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
 let dragging=false,last=0;
 canvas.onpointerdown=e=>{dragging=true;last=e.clientX;canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!dragging)return;yaw-=(e.clientX-last)*.01;last=e.clientX;moveCamera();};
 canvas.onpointerup=()=>dragging=false;canvas.style.touchAction='none';
 window.alejandroReview={app,probe,pipeline,entity,facing,visual,skeletal,clips,setView,setClip,get current(){return current;},ready:true};
 app.start();document.querySelector('#loading').remove();
}catch(error){document.querySelector('#loading').textContent='No se pudo cargar el personaje: '+error.message;throw error;}
