import {createStage4Character} from './Stage4CharacterFactory.js';
import {Stage4AnimationController} from './Stage4AnimationController.js';

export class Stage4CharacterSystem {
 constructor({pipeline,root}){this.pipeline=pipeline;this.root=root;this.characters=new Map();}
 async spawn({id,name,url,role='npc',position=[0,0,0],scale=[1,1,1]}){
  let entity,source='procedural';
  try{entity=await this.pipeline.loadAndInstantiate(id,url,{parent:this.root,position,scale});source='glb';}
  catch(error){entity=createStage4Character({name,villain:role==='boss'});entity.setPosition(...position);entity.setLocalScale(...scale);this.root.addChild(entity);}
  entity.name=name;entity.tags.add(role);
  const animation=new Stage4AnimationController(entity);
  const character={id,name,role,entity,animation,source};this.characters.set(id,character);return character;
 }
 get(id){return this.characters.get(id);}
 setLocomotion(id,speed,running=false){return this.get(id)?.animation.setLocomotion(speed,running);}
 setCombat(id,active){return this.get(id)?.animation.setCombat(active);}
}
