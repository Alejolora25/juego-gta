// Isolated review of the three mission NPCs; never starts the game world.
import * as pc from 'playcanvas';
import {PlayCanvasProbe} from '../../../../src/infrastructure/rendering/PlayCanvasProbe.js';
import {Stage4AssetPipeline} from '../../../../src/infrastructure/rendering/Stage4AssetPipeline.js';
import {Stage4SkeletalAnimation} from '../../../../src/infrastructure/rendering/Stage4SkeletalAnimation.js';
const canvas=document.querySelector('#character');
try{
 const probe=new PlayCanvasProbe(canvas);await probe.init();const app=probe.app;
 app.setCanvasFillMode(pc.FILLMODE_NONE);app.setCanvasResolution(pc.RESOLUTION_AUTO);canvas.style.width='100%';canvas.style.height='100%';
 const resize=()=>app.resizeCanvas(canvas.clientWidth,canvas.clientHeight);new ResizeObserver(resize).observe(canvas);resize();
 app.scene.ambientLight.set(.65,.67,.69);app.scene.toneMapping=pc.TONEMAP_ACES;
 const camera=new pc.Entity('NPCReviewCamera');camera.addComponent('camera',{clearColor:new pc.Color(.72,.77,.80),farClip:30});app.root.addChild(camera);
 for(const [name,rotation,color,intensity] of [['Key',[40,-30,0],[1,.96,.89],1.6],['Fill',[20,140,0],[.8,.88,1],.8],['Rim',[35,190,0],[1,1,1],.3]]){
  const light=new pc.Entity(name);light.addComponent('light',{type:'directional',color:new pc.Color(...color),intensity,castShadows:name==='Key',shadowResolution:1024,shadowDistance:10,shadowBias:.04,normalOffsetBias:.02});light.setEulerAngles(...rotation);app.root.addChild(light);
 }
 const material=new pc.StandardMaterial();material.diffuse.set(.50,.54,.56);material.gloss=.1;material.update();
 const floor=new pc.Entity('ReviewFloor');floor.addComponent('render',{type:'plane',material});floor.setLocalScale(8,1,8);floor.setPosition(0,-.002,0);app.root.addChild(floor);
 const pipeline=new Stage4AssetPipeline(app),characters=new Map();
 for(const [id,label] of [['juan','Juan · DevOps'],['sara','Sara · Backend'],['david','David · LAB']]){
  await pipeline.loadGlb(id,`../${id}/${id}.glb`);
  const entity=new pc.Entity('StableRoot-'+id);app.root.addChild(entity);
  const facing=new pc.Entity('ExistingModelFacing');facing.setLocalEulerAngles(0,180,0);entity.addChild(facing);
  const visual=pipeline.instantiate(id,{parent:facing});
  const skeletal=new Stage4SkeletalAnimation(visual);skeletal.configure(pipeline.animations(id));entity.enabled=false;
  characters.set(id,{id,label,entity,facing,visual,skeletal,clips:skeletal.available()});
 }
 let current='juan',yaw=.45,pitch=.1;
 const moveCamera=()=>{camera.setPosition(3.1*Math.sin(yaw),1+3.1*Math.sin(pitch),3.1*Math.cos(yaw));camera.lookAt(0,.95,0);};moveCamera();
 const setView=view=>{yaw={front:0,quarter:.45,side:Math.PI/2,back:Math.PI}[view]??.45;pitch=.1;moveCamera();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));};
 const setClip=name=>{
  const actor=characters.get(current),index=actor.clips.indexOf(name);if(index<0)throw new Error('Missing stationary NPC clip: '+name);
  actor.visual.anim.baseLayer.transition('clip'+index,.14);actor.skeletal.current=name;
  document.querySelectorAll('[data-clip]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clip===name)));
 };
 const setCharacter=id=>{
  if(!characters.has(id))throw new Error('Unknown NPC: '+id);
  current=id;for(const [key,actor] of characters)actor.entity.enabled=key===id;
  document.querySelector('#name').textContent=characters.get(id).label;
  document.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===id)));
  setClip('Idle');
 };
 setCharacter('juan');
 document.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>setCharacter(b.dataset.character));
 document.querySelectorAll('[data-clip]').forEach(b=>b.onclick=()=>setClip(b.dataset.clip));
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
 let dragging=false,last=0;
 canvas.onpointerdown=e=>{dragging=true;last=e.clientX;canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!dragging)return;yaw-=(e.clientX-last)*.01;last=e.clientX;moveCamera();};canvas.onpointerup=()=>dragging=false;canvas.style.touchAction='none';
 window.npcReview={app,probe,pipeline,characters,setCharacter,setView,setClip,get current(){return current;},ready:true};
 app.start();document.querySelector('#loading').remove();
}catch(error){document.querySelector('#loading').textContent='No se pudieron cargar los modelos: '+error.message;throw error;}
