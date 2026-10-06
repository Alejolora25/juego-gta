import * as pc from 'playcanvas';

function material(diffuse,{metalness=.05,gloss=.4,emissive=null,intensity=0}={}){
 const m=new pc.StandardMaterial();m.diffuse=diffuse;m.metalness=metalness;m.gloss=gloss;m.useMetalness=true;
 if(emissive){m.emissive=emissive;m.emissiveIntensity=intensity;}m.update();return m;
}
function piece(parent,name,type,scale,position,mat){
 const e=new pc.Entity(name);e.addComponent('render',{type,material:mat});e.setLocalScale(...scale);e.setLocalPosition(...position);parent.addChild(e);return e;
}
export function applyStage4Identity(entity,role){
 if(!entity)return entity;
 const root=new pc.Entity(role==='boss'?'WardenIdentity':'AlejandroIdentity');entity.addChild(root);
 if(role==='player'){
  const navy=material(new pc.Color(.035,.075,.13),{metalness:.12,gloss:.38});
  const cyan=material(new pc.Color(.04,.42,.72),{metalness:.28,gloss:.62,emissive:new pc.Color(.01,.08,.16),intensity:.45});
  piece(root,'AlejandroJacket','box',[.78,.72,.34],[0,1.45,.08],navy);
  piece(root,'AlejandroTechPanel','box',[.34,.18,.05],[0,1.55,-.31],cyan);
  piece(root,'AlejandroBackpack','box',[.58,.62,.22],[0,1.42,.32],navy);
 }
 if(role==='boss'){
  const armor=material(new pc.Color(.035,.045,.06),{metalness:.82,gloss:.72});
  const red=material(new pc.Color(.28,.01,.008),{metalness:.48,gloss:.76,emissive:new pc.Color(.9,.025,.01),intensity:1.7});
  piece(root,'WardenChestArmor','box',[1.02,.78,.48],[0,1.55,.02],armor);
  piece(root,'WardenShoulderL','box',[.48,.26,.58],[-.67,1.83,.02],armor);
  piece(root,'WardenShoulderR','box',[.48,.26,.58],[.67,1.83,.02],armor);
  piece(root,'WardenVisor','box',[.68,.12,.09],[0,2.35,-.35],red);
  piece(root,'WardenCore','box',[.28,.24,.06],[0,1.58,-.45],red);
 }
 return entity;
}
