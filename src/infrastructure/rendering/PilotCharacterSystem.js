import * as pc from 'playcanvas';
import {Stage4CharacterSystem} from './Stage4CharacterSystem.js';
import {Stage4AnimationController} from './Stage4AnimationController.js';
import {Stage4SkeletalAnimation} from './Stage4SkeletalAnimation.js';
import {addPilotContactShadow} from './PilotContactShadow.js';

// Stable gameplay root at ground level; authored visual scale and bind pose
// stay inside the imported hierarchy, never on the physics/controller entity.
export class PilotCharacterSystem extends Stage4CharacterSystem {
 constructor({pipeline,root,approvedAssets=null}) {
  super({pipeline,root});
  this.approvedAssets=approvedAssets;
 }
 async spawn({id,name,role='npc',position=[0,0,0]}) {
  const key=role==='player'?'alejandro':role==='boss'?'warden':name.toLowerCase();
  const approvedAsset=this.approvedAssets?.[key];
  const assetId=approvedAsset?.id??'pilot-'+key;
  // Keep the robot's original animation hierarchy: Blender's round-trip of
  // this multipart rig changes its animated rest transforms.
  const url=approvedAsset?.url??(role==='boss'?'./assets/pilot/source/robot.glb':`./assets/pilot/${key}.glb`);
  const asset=await this.pipeline.loadGlb(assetId,url);
  const entity=new pc.Entity(name);entity.tags.add(role);entity.setPosition(...position);this.root.addChild(entity);
  if(role==='boss'&&approvedAsset)entity.name='Firewall Warden';
  const facing=new pc.Entity('ModelFacing');entity.addChild(facing);
  // Imported human faces -Z; locomotion roots face +Z. Rotate only visuals,
  // outside the animated hierarchy, preserving authored scale and bind pose.
  // Vanguard faces +Z, whereas the existing boss pursuit root aims -Z.
  if(role!=='boss'||approvedAsset)facing.setLocalEulerAngles(0,180,0);
  const visual=asset.resource.instantiateRenderEntity();facing.addChild(visual);
  if(role==='boss'){
   let lo=Infinity,hi=-Infinity;
   for(const render of visual.findComponents('render'))for(const mesh of render.meshInstances){const b=mesh.aabb;lo=Math.min(lo,b.center.y-b.halfExtents.y);hi=Math.max(hi,b.center.y+b.halfExtents.y);}
   if(!Number.isFinite(lo)||hi<=lo)throw new Error('Invalid Warden visual bounds');
   const factor=2.65/(hi-lo);facing.setLocalScale(factor,factor,factor);facing.setLocalPosition(0,-lo*factor,0);
  }
  addPilotContactShadow(this.pipeline.app,entity,{size:role==='boss'?1.5:.8});
  const animation=new Stage4AnimationController(entity);
  const skeletal=new Stage4SkeletalAnimation(visual);
  skeletal.configure(this.pipeline.animations(assetId));skeletal.playSemantic('idle');
  const character={id,name,role,entity,visual,animation,skeletal,source:'glb',assetId,assetUrl:url,facing,approvedVisual:!!approvedAsset};
  this.characters.set(id,character);return character;
 }
}
