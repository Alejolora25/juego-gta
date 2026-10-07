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
  piece(root,'AlejandroShoulderL','capsule',[.16,.42,.16],[-.48,1.48,.02],navy);
  piece(root,'AlejandroShoulderR','capsule',[.16,.42,.16],[.48,1.48,.02],navy);
  piece(root,'AlejandroWristTech','box',[.18,.12,.18],[.48,1.03,-.08],cyan);
  piece(root,'AlejandroJacketTrimL','box',[.055,.58,.065],[-.35,1.45,-.13],cyan);
  piece(root,'AlejandroJacketTrimR','box',[.055,.58,.065],[.35,1.45,-.13],cyan);
  piece(root,'AlejandroBackpackBeacon','box',[.18,.12,.065],[0,1.62,.445],cyan);
  piece(root,'AlejandroBootL','box',[.3,.23,.45],[-.22,.16,-.08],navy);
  piece(root,'AlejandroBootR','box',[.3,.23,.45],[.22,.16,-.08],navy);
 }
 if(role==='boss'){
  const armor=material(new pc.Color(.035,.045,.06),{metalness:.82,gloss:.72});
  const red=material(new pc.Color(.28,.01,.008),{metalness:.48,gloss:.76,emissive:new pc.Color(.9,.025,.01),intensity:1.7});
  piece(root,'WardenChestArmor','box',[1.02,.78,.48],[0,1.55,.02],armor);
  piece(root,'WardenShoulderL','box',[.48,.26,.58],[-.67,1.83,.02],armor);
  piece(root,'WardenShoulderR','box',[.48,.26,.58],[.67,1.83,.02],armor);
  piece(root,'WardenVisor','box',[.68,.12,.09],[0,2.35,-.35],red);
  piece(root,'WardenCore','box',[.28,.24,.06],[0,1.58,-.45],red);
  piece(root,'WardenHelmet','sphere',[.72,.52,.68],[0,2.3,.02],armor);
  piece(root,'WardenCrownL','cone',[.16,.58,.16],[-.38,2.72,.08],armor).setLocalEulerAngles(0,0,-18);
  piece(root,'WardenCrownR','cone',[.16,.58,.16],[.38,2.72,.08],armor).setLocalEulerAngles(0,0,18);
  piece(root,'WardenForearmL','capsule',[.23,.62,.23],[-.73,1.25,.02],armor);
  piece(root,'WardenForearmR','capsule',[.23,.62,.23],[.73,1.25,.02],armor);
  piece(root,'WardenPowerL','sphere',[.14,.14,.14],[-.73,1.15,-.2],red);
  piece(root,'WardenPowerR','sphere',[.14,.14,.14],[.73,1.15,-.2],red);
  piece(root,'WardenSpine','box',[.34,.82,.25],[0,1.58,.37],armor);
  piece(root,'WardenKneeL','box',[.34,.25,.33],[-.29,.65,-.17],armor);
  piece(root,'WardenKneeR','box',[.34,.25,.33],[.29,.65,-.17],armor);
  piece(root,'WardenBootL','box',[.42,.28,.55],[-.3,.16,-.1],armor);
  piece(root,'WardenBootR','box',[.42,.28,.55],[.3,.16,-.1],armor);
  piece(root,'WardenBackReactor','sphere',[.32,.32,.16],[0,1.64,.54],red);
 }
 return entity;
}
