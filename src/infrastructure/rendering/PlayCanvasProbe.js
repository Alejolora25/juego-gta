import * as pc from 'playcanvas';
import {createStage4Character} from './Stage4CharacterFactory.js';
import {createStage4World} from './Stage4WorldFactory.js';
import {Stage4Environment} from './Stage4Environment.js';
import {configureStage4Lighting,createStage4Sky} from './Stage4Lighting.js';
import {Stage4AssetPipeline} from './Stage4AssetPipeline.js';
import {Stage4CharacterSystem} from './Stage4CharacterSystem.js';
import {STAGE4_ASSETS} from './Stage4AssetCatalog.js';
import {Stage4LodManager} from './Stage4LodManager.js';
import {Stage4PerformanceBudget} from './Stage4PerformanceBudget.js';
import {STAGE4_CHARACTER_PROFILES as profiles} from './Stage4CharacterProfiles.js';

export class PlayCanvasProbe {
 constructor(canvas){this.canvas=canvas;this.app=null;this.backend='uninitialized';}
 async init(){
  const device=await pc.createGraphicsDevice(this.canvas,{deviceTypes:['webgpu','webgl2'],antialias:true,alpha:false,powerPreference:'high-performance'});
  this.backend=device.isWebGPU?'webgpu':'webgl2';
  this.app=new pc.AppBase(this.canvas);
  this.app.init({graphicsDevice:device,componentSystems:[pc.RenderComponentSystem,pc.CameraComponentSystem,pc.LightComponentSystem],resourceHandlers:[pc.TextureHandler,pc.ContainerHandler]});
  this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
  return this;
 }
 async start(){
  if(!this.app)throw new Error('PlayCanvasProbe.init() must complete before start()');
  const camera=new pc.Entity('Stage4Camera');camera.addComponent('camera',{clearColor:new pc.Color(.055,.085,.12)});camera.setPosition(0,2.2,5);this.app.root.addChild(camera);
  const lighting=configureStage4Lighting(this.app,{mobile:matchMedia('(max-width: 800px)').matches});
  const sky=createStage4Sky(this.app);
  const world=createStage4World(this.app);
  const environment=new Stage4Environment(this.app).build();
  environment.addBuilding({name:'PastoHQ',x:-14,z:-22,w:11,d:9,h:18});
  environment.addBuilding({name:'TechTower',x:14,z:-22,w:9,d:9,h:24,material:'glass'});
  for(const [x,z,s] of [[-18,18,1],[18,18,1.15],[-28,-5,.9],[28,-5,.9]])environment.addTree(x,z,s);
  const pipeline=new Stage4AssetPipeline(this.app);
  const characters=new Stage4CharacterSystem({pipeline,root:this.app.root});
  const cfg=STAGE4_ASSETS.humanoid;
  const actorRecord=await characters.spawn({id:'stage4-player',name:'Stage4ActorProbe',url:cfg.url,assetId:cfg.id,role:'player',position:[0,0,0],scale:[1,1,1],profile:profiles.player});
  const npcRecords=[];
  for(const [id,name,position,profile] of [['stage4-juan','Juan',[-2.4,0,-1],profiles.juan],['stage4-sara','Sara',[0,0,-2.8],profiles.sara],['stage4-david','David',[2.4,0,-1],profiles.david]])npcRecords.push(await characters.spawn({id,name,url:cfg.url,assetId:cfg.id,role:'npc',position,profile}));
  const wardenRecord=await characters.spawn({id:'stage4-warden',name:'Stage4WardenProbe',url:cfg.url,assetId:cfg.id,role:'boss',position:[2.2,0,-4.2],scale:[1.15,1.15,1.15],profile:profiles.warden});
  const mobile=matchMedia('(max-width: 800px)').matches;
  const lod=new Stage4LodManager(mobile?{near:20,mid:48,far:90}:{near:32,mid:75,far:140});
  const performance=new Stage4PerformanceBudget({mobile});
  const dynamicEntities=[actorRecord.entity,...npcRecords.map(r=>r.entity),wardenRecord.entity];
  this.app.on('update',dt=>{performance.frame(dt);lod.update(camera.getPosition(),dynamicEntities);});
  this.app.start();return {backend:this.backend,actor:actorRecord.entity,warden:wardenRecord.entity,npcs:npcRecords.map(r=>r.entity),characters,lod,performance,world,environment,lighting,sky};
 }
 destroy(){this.app?.destroy();this.app=null;}
}
