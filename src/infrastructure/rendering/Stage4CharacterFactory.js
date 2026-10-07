import * as pc from 'playcanvas';

function material(color,{metalness=0,gloss=.45}={}){const m=new pc.StandardMaterial();m.diffuse=color;m.metalness=metalness;m.gloss=gloss;m.useMetalness=true;m.update();return m;}
function part(parent,name,type,scale,pos,mat){const e=new pc.Entity(name);e.addComponent('render',{type,material:mat});e.setLocalScale(...scale);e.setLocalPosition(...pos);parent.addChild(e);return e;}
function pivot(parent,name,pos){const e=new pc.Entity(name);e.setLocalPosition(...pos);parent.addChild(e);return e;}

export function createAlejandroCharacter({name='Alejandro'}={}){
 const root=new pc.Entity(name);root.tags.add('player','alejandro');
 const skin=material(new pc.Color(.56,.37,.27),{gloss:.38}),hair=material(new pc.Color(.055,.035,.025),{gloss:.2});
 const black=material(new pc.Color(.025,.035,.055),{metalness:.05,gloss:.32}),blue=material(new pc.Color(.025,.32,.72),{metalness:.2,gloss:.62});
 const beige=material(new pc.Color(.62,.55,.46),{gloss:.24}),shoe=material(new pc.Color(.78,.8,.82),{gloss:.38}),rubber=material(new pc.Color(.025,.03,.04),{gloss:.2});
 const torso=pivot(root,'AlejandroTorso',[0,1.48,0]);part(torso,'JacketBody','box',[.78,.86,.38],[0,0,0],black);part(torso,'Shirt','box',[.46,.63,.04],[0,-.02,-.215],rubber);
 part(torso,'JacketBlueL','box',[.055,.64,.045],[-.34,0,-.22],blue);part(torso,'JacketBlueR','box',[.055,.64,.045],[.34,0,-.22],blue);
 part(torso,'Backpack','box',[.58,.72,.22],[0,.02,.31],black);part(torso,'BackpackStripe','box',[.34,.055,.035],[0,.18,.435],blue);
 const neck=part(root,'Neck','cylinder',[.16,.16,.16],[0,2.02,0],skin),head=part(root,'Head','sphere',[.39,.48,.38],[0,2.34,0],skin);
 part(root,'Hair','sphere',[.405,.22,.39],[0,2.68,.015],hair);part(root,'HairFront','box',[.3,.11,.08],[.06,2.61,-.34],hair);
 part(root,'Stubble','box',[.29,.11,.035],[0,2.18,-.37],hair);
 for(const side of [-1,1]){
  const arm=pivot(torso,side<0?'ArmPivotL':'ArmPivotR',[side*.52,.27,0]);part(arm,side<0?'JacketArmL':'JacketArmR','capsule',[.18,.58,.18],[0,-.32,0],black);part(arm,side<0?'SleeveAccentL':'SleeveAccentR','box',[.19,.12,.2],[0,-.18,-.02],blue);part(arm,side<0?'GloveL':'GloveR','sphere',[.17,.15,.18],[0,-.88,0],rubber);
  const leg=pivot(root,side<0?'LegPivotL':'LegPivotR',[side*.25,.94,0]);part(leg,side<0?'CargoLegL':'CargoLegR','capsule',[.27,.72,.3],[0,-.45,0],beige);part(leg,side<0?'CargoPocketL':'CargoPocketR','box',[.08,.28,.24],[side*.25,-.34,0],beige);part(leg,side<0?'SneakerL':'SneakerR','box',[.34,.22,.58],[0,-1.14,-.1],shoe);part(leg,side<0?'SoleL':'SoleR','box',[.36,.07,.61],[0,-1.25,-.1],rubber);
 }
 part(root,'SmartWatch','box',[.2,.11,.2],[.53,.66,-.02],blue);
 root.__alejandroRig={torso,leftArm:torso.findByName('ArmPivotL'),rightArm:torso.findByName('ArmPivotR'),leftLeg:root.findByName('LegPivotL'),rightLeg:root.findByName('LegPivotR')};
 return root;
}

export function createStage4Character({name='Alejandro',villain=false}={}){if(!villain)return createAlejandroCharacter({name});
 const root=new pc.Entity(name),dark=material(new pc.Color(.025,.03,.04),{metalness:.65,gloss:.7}),red=material(new pc.Color(.65,.02,.015),{metalness:.55,gloss:.8});
 part(root,'WardenTorso','capsule',[.82,.92,.5],[0,1.55,0],dark);part(root,'WardenHead','sphere',[.52,.58,.5],[0,2.55,0],dark);part(root,'WardenVisor','box',[.65,.12,.08],[0,2.58,-.48],red);
 for(const side of [-1,1]){part(root,side<0?'WardenArmL':'WardenArmR','capsule',[.28,.82,.28],[side*.72,1.55,0],dark);part(root,side<0?'WardenLegL':'WardenLegR','capsule',[.34,.9,.34],[side*.32,.38,0],dark);}
 root.tags.add('villain');return root;
}
