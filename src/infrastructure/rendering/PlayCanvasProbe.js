import * as pc from 'playcanvas';
import {createStage4Character} from './Stage4CharacterFactory.js';
import {createStage4World} from './Stage4WorldFactory.js';
import {Stage4Environment} from './Stage4Environment.js';
import {configureStage4Lighting,createStage4Sky} from './Stage4Lighting.js';
import {Stage4AssetPipeline} from './Stage4AssetPipeline.js';
import {Stage4CharacterSystem} from './Stage4CharacterSystem.js';
import {Stage5VerticalSlice} from './Stage5VerticalSlice.js';
import {Stage6UrbanOverhaul} from './Stage6UrbanOverhaul.js';
import {PilotCharacterSystem} from './PilotCharacterSystem.js';
import {buildUrbanPilot} from './UrbanPilot.js';
import {stage4AssetFor} from './Stage4AssetCatalog.js';
import {Stage4LodManager} from './Stage4LodManager.js';
import {Stage4PerformanceBudget} from './Stage4PerformanceBudget.js';
import {Stage4ThirdPersonCamera} from './Stage4ThirdPersonCamera.js';
import {Stage4PlayerController} from './Stage4PlayerController.js';
import {PhysicsWorld} from '../physics/PhysicsWorld.js?v=20261006-1';
import {Stage4ControlsBridge} from '../input/Stage4ControlsBridge.js';
import {STAGE4_CHARACTER_PROFILES as profiles} from './Stage4CharacterProfiles.js';
import {GameState} from '../../domain/entities/GameState.js';
import {Stage4MissionCoordinator} from '../../application/usecases/Stage4MissionCoordinator.js';
import {Stage4ObjectiveTracker} from '../../application/usecases/Stage4ObjectiveTracker.js';
import {CombatService} from '../../application/usecases/CombatService.js';
import {Stage4BossEncounter} from '../../application/usecases/Stage4BossEncounter.js';
import {Stage4BossController} from '../../application/usecases/Stage4BossController.js';
import {Stage4ProjectileSystem} from '../../application/usecases/Stage4ProjectileSystem.js';
import {Stage4Session} from '../../application/usecases/Stage4Session.js';

export class PlayCanvasProbe {
 constructor(canvas,{controls=null,hud=null,onMissionInteraction=null}={}){this.canvas=canvas;this.controls=controls;this.hud=hud;this.onMissionInteraction=onMissionInteraction;this.previousAction=undefined;this.previousShoot=undefined;this.previousLock=undefined;this.projectiles=null;this.finishedHandled=false;this.app=null;this.backend='uninitialized';}
 async init(){
  const device=await pc.createGraphicsDevice(this.canvas,{deviceTypes:['webgpu','webgl2'],antialias:true,alpha:false,powerPreference:'high-performance'});
  this.backend=device.isWebGPU?'webgpu':'webgl2';
  this.app=new pc.AppBase(this.canvas);
  this.app.init({graphicsDevice:device,componentSystems:[pc.RenderComponentSystem,pc.CameraComponentSystem,pc.LightComponentSystem,pc.AnimComponentSystem],resourceHandlers:[pc.TextureHandler,pc.ContainerHandler]});
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
  const stage5Slice=new Stage5VerticalSlice(this.app,{materials:world.materials}).build();
  const stage6City=new Stage6UrbanOverhaul(this.app,{materials:world.materials}).build({baseWorld:world.root});
  const environment=new Stage4Environment(this.app,{materials:world.materials}).build();
  environment.addBuilding({name:'PastoHQ',x:-14,z:-22,w:11,d:9,h:18,material:'pasto'});
  environment.addBuilding({name:'TechTower',x:14,z:-22,w:9,d:9,h:24,material:'industrial'});
  for(const [x,z,s] of [[-18,18,1],[18,18,1.15],[-28,-5,.9],[28,-5,.9]])environment.addTree(x,z,s);
  const pipeline=new Stage4AssetPipeline(this.app);
  const pilotEnabled=new URLSearchParams(location.search).get('pilot')==='1';
  const urbanPilot=pilotEnabled?await buildUrbanPilot({world,stage5Slice,stage6City,environment,pipeline,app:this.app}):null;
  const characters=new (pilotEnabled?PilotCharacterSystem:Stage4CharacterSystem)({pipeline,root:this.app.root});
  const playerAsset=stage4AssetFor('player'),npcAsset=stage4AssetFor('npc'),wardenAsset=stage4AssetFor('boss');
  const actorRecord=await characters.spawn({id:'stage4-player',name:'Stage4ActorProbe',url:playerAsset.url,assetId:playerAsset.id,role:'player',position:[0,0,108],scale:[1,1,1],profile:profiles.player});
  const npcRecords=[];
  for(const [id,name,position,profile] of [['stage4-juan','Juan',[-28,0,74],profiles.juan],['stage4-sara','Sara',[98,0,-12],profiles.sara],['stage4-david','David',[-108,0,54],profiles.david]])npcRecords.push(await characters.spawn({id,name,url:npcAsset.url,assetId:npcAsset.id,role:'npc',position,profile}));
  const wardenRecord=await characters.spawn({id:'stage4-warden',name:'Stage4WardenProbe',url:wardenAsset.url,assetId:wardenAsset.id,role:'boss',position:[0,0,-150],scale:[1.15,1.15,1.15],profile:profiles.warden});
  const mobile=matchMedia('(max-width: 800px)').matches;
  const lod=new Stage4LodManager(mobile?{near:20,mid:48,far:90}:{near:32,mid:75,far:140});
  const performance=new Stage4PerformanceBudget({mobile});
  const dynamicEntities=[actorRecord.entity,...npcRecords.map(r=>r.entity),wardenRecord.entity];
const thirdPersonCamera=new Stage4ThirdPersonCamera(camera);
if(pilotEnabled){thirdPersonCamera.height=3.3;thirdPersonCamera.distance=6;thirdPersonCamera.targetHeight=1.4;lighting.sun.light.color=new pc.Color(1,.95,.87);lighting.sun.light.intensity=1.5;lighting.rim.light.intensity=.1;this.app.root.findByName('Stage4HorizonGlow').enabled=false;}
if(urbanPilot)this.app.on('update',()=>urbanPilot.updateLOD(camera.getPosition()));
const physics=new PhysicsWorld();
const state=new GameState();
const missions=new Stage4MissionCoordinator(state,characters);
const objectives=new Stage4ObjectiveTracker(missions);
const combat=new CombatService(state);
const bossEncounter=new Stage4BossEncounter(state,combat);
const bossController=new Stage4BossController(wardenRecord.entity,physics);
const projectiles=new Stage4ProjectileSystem(this.app,physics,combat,state);
const session=new Stage4Session({state,actor:actorRecord.entity,warden:wardenRecord.entity,combat,bossEncounter,projectiles,controls:this.controls,hud:this.hud});
const resetSession=()=>{this.finishedHandled=false;thirdPersonCamera.yaw=0;const result=session.reset();if(this.controls)this.controls.cameraDelta=0;return result;};
wardenRecord.entity.enabled=false;
const playerController=new Stage4PlayerController(actorRecord.entity,characters,{resolveMovement:(from,to)=>physics.ready?physics.resolveMovement(from,to):to});
const ensurePhysics=async()=>{try{await physics.init();physics.addFloor(420);physics.addPlayer(actorRecord.entity.getPosition());physics.addBoss(wardenRecord.entity.getPosition());physics.addObstacles(world.obstacles);return true;}catch(error){console.warn('Stage 4 Rapier unavailable; using renderer movement fallback.',error);return false;}};
void ensurePhysics();
const controlsBridge=this.controls?new Stage4ControlsBridge(this.controls,thirdPersonCamera):null;
if(this.controls){this.previousLock=this.controls.onLock;this.previousShoot=this.controls.onShoot;this.controls.onLock=locked=>bossEncounter.setLock(locked);this.controls.onShoot=()=>projectiles.shootPlayer(actorRecord.entity,wardenRecord.entity,bossEncounter.locked);}
this.projectiles=projectiles;
if(this.controls){this.previousAction=this.controls.onAction;this.controls.onAction=()=>{const result=missions.interact(actorRecord.entity);if(result.completed)session.missionDialog(result);this.onMissionInteraction?.(result,state);return result;};}
  let budgetTimer=0,npcShadowLimit=npcRecords.length;this.app.on('update',dt=>{performance.frame(dt);budgetTimer+=dt;if(budgetTimer>=1){const rec=performance.recommendations();lod.setQualityScale(rec.shadowScale);const baseShadow=mobile?1024:2048;const shadowResolution=Math.max(512,Math.round(baseShadow*rec.shadowScale));if(lighting.sun.light.shadowResolution!==shadowResolution)lighting.sun.light.shadowResolution=shadowResolution;npcShadowLimit=Math.floor(npcRecords.length*rec.npcScale);budgetTimer=0;}lod.update(camera.getPosition(),dynamicEntities);npcRecords.forEach((record,index)=>{if(index>=npcShadowLimit)for(const render of record.entity.findComponents?.('render')??[])render.castShadows=false;});wardenRecord.entity.enabled=state.bossActive&&!state.finished;if(controlsBridge){const cameraDelta=this.controls?.cameraDelta??0;if(bossEncounter.manualCamera(cameraDelta)&&this.controls){if(this.controls.setLocked)this.controls.setLocked(false);else this.controls.locked=false;}controlsBridge.update(playerController,dt);}const encounter=bossEncounter.update(actorRecord.entity,wardenRecord.entity,dt);if(encounter.started){session.activateBoss();if(this.controls){if(this.controls.setLocked)this.controls.setLocked(true);else this.controls.locked=true;this.controls.setCombat(true);}this.hud?.combat(true);this.hud?.sync(state);}const bossStep=bossController.update(actorRecord.entity,dt,state);if(state.bossActive&&!state.finished)projectiles.shootEnemy(wardenRecord.entity,actorRecord.entity);const hpBefore=state.playerHP,bossHpBefore=state.bossHP;projectiles.update(dt,wardenRecord.entity,actorRecord.entity);if(state.playerHP!==hpBefore||state.bossHP!==bossHpBefore)this.hud?.sync(state);if(state.finished&&!this.finishedHandled){this.finishedHandled=true;session.finish(state.bossHP<=0);}thirdPersonCamera.update(actorRecord.entity,dt);if(bossEncounter.locked&&state.bossActive)thirdPersonCamera.lockTarget(actorRecord.entity,wardenRecord.entity,.34);const objective=objectives.measure(actorRecord.entity,thirdPersonCamera.yaw);if(objective)this.hud?.objective(objective.distance,objective.angle,objective.name);if(physics.ready){physics.syncPlayer(actorRecord.entity.getPosition());physics.syncBoss(wardenRecord.entity.getPosition());physics.step(dt);}});
  this.app.start();return {backend:this.backend,actor:actorRecord.entity,warden:wardenRecord.entity,npcs:npcRecords.map(r=>r.entity),characters,lod,performance,thirdPersonCamera,playerController,controlsBridge,state,missions,objectives,combat,bossEncounter,bossController,projectiles,session,resetSession,physics,ensurePhysics,world,environment,stage5Slice,stage6City,urbanPilot,lighting,sky};
 }
 destroy(){this.projectiles?.clear();if(this.controls){this.controls.onAction=this.previousAction;this.controls.onShoot=this.previousShoot;this.controls.onLock=this.previousLock;}this.app?.destroy();this.app=null;}
}
