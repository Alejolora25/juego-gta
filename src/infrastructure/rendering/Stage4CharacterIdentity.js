import * as pc from 'playcanvas';

function material(diffuse,{metalness=.05,gloss=.4,emissive=null,intensity=0}={}){
 const m=new pc.StandardMaterial();m.diffuse=diffuse;m.metalness=metalness;m.gloss=gloss;m.useMetalness=true;
 if(emissive){m.emissive=emissive;m.emissiveIntensity=intensity;}m.update();return m;
}
function piece(parent,name,type,scale,position,mat){
 const e=new pc.Entity(name);e.addComponent('render',{type,material:mat});e.setLocalScale(...scale);e.setLocalPosition(...position);parent.addChild(e);return e;
}
export function applyStage4Identity(entity,role,name=''){
 if(!entity)return entity;
 const root=new pc.Entity(role==='boss'?'WardenIdentity':role==='npc'?(name+'Identity'):'AlejandroIdentity');entity.addChild(root);
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
 if(role==='npc'){
  const palette={
   Juan:{base:new pc.Color(.045,.18,.12),accent:new pc.Color(.12,.72,.38),tag:'DevOps'},
   Sara:{base:new pc.Color(.2,.055,.14),accent:new pc.Color(.86,.22,.5),tag:'Backend'},
   David:{base:new pc.Color(.24,.15,.045),accent:new pc.Color(.92,.55,.12),tag:'Lab'}
  }[name]??{base:new pc.Color(.12,.14,.18),accent:new pc.Color(.45,.55,.7),tag:'NPC'};
  const cloth=material(palette.base,{metalness:.08,gloss:.42});
  const accent=material(palette.accent,{metalness:.18,gloss:.58,emissive:palette.accent,intensity:.28});
  const dark=material(new pc.Color(.035,.04,.048),{metalness:.08,gloss:.35});
  piece(root,name+'Jacket','box',[.72,.62,.3],[0,1.38,.06],cloth);
  piece(root,name+'ChestBadge','box',[.18,.16,.055],[-.18,1.48,-.27],accent);
  piece(root,name+'RolePanel'+palette.tag,'box',[.34,.09,.055],[.16,1.26,-.28],accent);
  piece(root,name+'ShoulderL','box',[.26,.16,.28],[-.46,1.58,.02],cloth);
  piece(root,name+'ShoulderR','box',[.26,.16,.28],[.46,1.58,.02],cloth);
  piece(root,name+'WristDevice','box',[.16,.1,.16],[.46,1.02,-.08],accent);
  piece(root,name+'Pack','box',[.44,.48,.18],[0,1.34,.34],dark);
  piece(root,name+'BootL','box',[.28,.2,.42],[-.22,.16,-.08],dark);
  piece(root,name+'BootR','box',[.28,.2,.42],[.22,.16,-.08],dark);
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
