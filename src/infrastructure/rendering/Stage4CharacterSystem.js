import {createStage4Character} from './Stage4CharacterFactory.js';
import {Stage4AnimationController} from './Stage4AnimationController.js';
import {applyCharacterProfile} from './Stage4CharacterProfiles.js';
import {Stage4SkeletalAnimation} from './Stage4SkeletalAnimation.js';

export class Stage4CharacterSystem {
 constructor({pipeline,root}){this.pipeline=pipeline;this.root=root;this.characters=new Map();}
 async spawn({id,name,url,role='npc',position=[0,0,0],scale=[1,1,1],profile=null}){
  let entity,source='procedural';
  try{entity=await this.pipeline.loadAndInstantiate(id,url,{parent:this.root,position,scale});source='glb';}
  catch(error){entity=createStage4Character({name,villain:role==='boss'});entity.setPosition(...position);entity.setLocalScale(...scale);this.root.addChild(entity);}
  entity.name=name;entity.tags.add(role);if(profile)applyCharacterProfile(entity,{...profile,scale:profile.scale??scale});
  const animation=new Stage4AnimationController(entity);
  const skeletal=new Stage4SkeletalAnimation(entity);skeletal.discover();
  const character={id,name,role,entity,animation,skeletal,source};this.characters.set(id,character);return character;
 }
 get(id){return this.characters.get(id);}
 setLocomotion(id,speed,running=false){const c=this.get(id);if(!c)return;const state=c.animation.setLocomotion(speed,running);c.skeletal.playSemantic(state);return state;}
 setCombat(id,active){const c=this.get(id);if(!c)return;const state=c.animation.setCombat(active);c.skeletal.playSemantic(state);return state;}
}
