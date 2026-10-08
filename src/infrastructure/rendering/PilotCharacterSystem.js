import * as pc from 'playcanvas';
import {Stage4CharacterSystem} from './Stage4CharacterSystem.js';
import {Stage4AnimationController} from './Stage4AnimationController.js';
import {Stage4SkeletalAnimation} from './Stage4SkeletalAnimation.js';
import {addPilotContactShadow} from './PilotContactShadow.js';

// Stable gameplay root at ground level; authored visual scale and bind pose
// stay inside the imported hierarchy, never on the physics/controller entity.
export class PilotCharacterSystem extends Stage4CharacterSystem {
 async spawn({id,name,role='npc',position=[0,0,0]}) {
  const key=role==='player'?'alejandro':role==='boss'?'warden':name.toLowerCase();
  const assetId='pilot-'+key;
  const asset=await this.pipeline.loadGlb(assetId,`./assets/pilot/${key}.glb`);
  const entity=new pc.Entity(name);entity.tags.add(role);entity.setPosition(...position);this.root.addChild(entity);
  const visual=asset.resource.instantiateRenderEntity();entity.addChild(visual);
  addPilotContactShadow(this.pipeline.app,entity,{size:role==='boss'?1.5:.8});
  const animation=new Stage4AnimationController(entity);
  const skeletal=new Stage4SkeletalAnimation(visual);
  skeletal.configure(this.pipeline.animations(assetId));skeletal.playSemantic('idle');
  const character={id,name,role,entity,visual,animation,skeletal,source:'glb'};
  this.characters.set(id,character);return character;
 }
}
