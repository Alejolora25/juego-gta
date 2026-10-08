import {createStage4Character} from './Stage4CharacterFactory.js';
import {Stage4AnimationController} from './Stage4AnimationController.js';
import {applyCharacterProfile} from './Stage4CharacterProfiles.js';
import {Stage4SkeletalAnimation} from './Stage4SkeletalAnimation.js';
import {applyStage4Identity} from './Stage4CharacterIdentity.js';

export class Stage4CharacterSystem {
 constructor({pipeline,root}){this.pipeline=pipeline;this.root=root;this.characters=new Map();}
 async spawn({id,name,url,assetId=id,role='npc',position=[0,0,0],scale=[1,1,1],profile=null}){
  let entity,source='procedural';
  if(role==='player'||role==='boss'){entity=createStage4Character({name,villain:role==='boss'});entity.setPosition(...position);entity.setLocalScale(...scale);this.root.addChild(entity);}
  else try{entity=await this.pipeline.loadAndInstantiate(assetId,url,{parent:this.root,position,scale});source='glb';}
  catch(error){entity=createStage4Character({name,villain:false});entity.setPosition(...position);entity.setLocalScale(...scale);this.root.addChild(entity);}
  if(source==='glb'){const lift=role==='player'?1.02:(role==='npc'?0.92:(role==='boss'?1.08:0));entity.setPosition(position[0],position[1]+lift,position[2]);entity.__stage4GroundLift=lift;}
  entity.name=name;entity.tags.add(role);if(profile)applyCharacterProfile(entity,{...profile,scale:profile.scale??scale});applyStage4Identity(entity,role,name);
  const animation=new Stage4AnimationController(entity);
  const skeletal=new Stage4SkeletalAnimation(entity);if(source==='glb'&&role!=='npc'){skeletal.configure(this.pipeline.animations(assetId));skeletal.playSemantic('idle');}
  const character={id,name,role,entity,animation,skeletal,source};this.characters.set(id,character);return character;
 }
 get(id){return this.characters.get(id);}
 setLocomotion(id,speed,running=false){const c=this.get(id);if(!c)return;const state=c.animation.setLocomotion(speed,running);c.skeletal.playSemantic(state);const rig=c.entity.__alejandroRig;if(rig){const moving=speed>.05,t=performance.now()*.009*(running?1.65:1),swing=moving?Math.sin(t)*(running?34:22):0;rig.leftArm?.setLocalEulerAngles(swing,0,0);rig.rightArm?.setLocalEulerAngles(-swing,0,0);rig.leftLeg?.setLocalEulerAngles(-swing,0,0);rig.rightLeg?.setLocalEulerAngles(swing,0,0);rig.torso?.setLocalEulerAngles(0,0,moving?Math.sin(t*.5)*1.5:0);}return state;}
 setCombat(id,active){const c=this.get(id);if(!c)return;const state=c.animation.setCombat(active);c.skeletal.playSemantic(state);return state;}
}
