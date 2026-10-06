import * as pc from 'playcanvas';

function material(color,metalness=0,gloss=0.45){const m=new pc.StandardMaterial();m.diffuse=color;m.metalness=metalness;m.gloss=gloss;m.update();return m;}
function part(name,type,scale,pos,mat){const e=new pc.Entity(name);e.addComponent('render',{type,material:mat});e.setLocalScale(...scale);e.setLocalPosition(...pos);return e;}

export function createStage4Character({name='Alejandro',villain=false}={}){
 const root=new pc.Entity(name),skin=material(villain?new pc.Color(.32,.22,.18):new pc.Color(.55,.36,.27),0,.35),cloth=material(villain?new pc.Color(.07,.08,.1):new pc.Color(.055,.13,.22),villain?.55:.08,.38),accent=material(villain?new pc.Color(.75,.035,.025):new pc.Color(.08,.38,.72),villain?.7:.18,.62),dark=material(new pc.Color(.025,.03,.04),.15,.28);
 const pelvis=part('Pelvis','capsule',[.52,.36,.34],[0,1.02,0],cloth),torso=part('Torso','capsule',[.72,.82,.42],[0,1.72,0],cloth),neck=part('Neck','cylinder',[.18,.18,.18],[0,2.22,0],skin),head=part('Head','sphere',[.46,.55,.44],[0,2.58,0],skin);
 root.addChild(pelvis);root.addChild(torso);root.addChild(neck);root.addChild(head);
 for(const side of [-1,1]){const arm=part(side<0?'ArmL':'ArmR','capsule',[.22,.7,.22],[side*.62,1.7,0],villain?dark:skin);arm.setLocalEulerAngles(0,0,side*8);root.addChild(arm);const leg=part(side<0?'LegL':'LegR','capsule',[.28,.82,.3],[side*.28,.36,0],dark);root.addChild(leg);const boot=part(side<0?'BootL':'BootR','box',[.36,.22,.62],[side*.28,-.35,-.08],dark);root.addChild(boot);}
 const chest=part('ChestAccent','box',[villain?.82:.68,.18,.46],[0,1.9,-.32],accent);root.addChild(chest);
 if(villain){const visor=part('WardenVisor','box',[.62,.13,.08],[0,2.62,-.43],accent);root.addChild(visor);const shoulderL=part('ArmorL','box',[.38,.24,.52],[-.68,1.98,0],dark),shoulderR=part('ArmorR','box',[.38,.24,.52],[.68,1.98,0],dark);root.addChild(shoulderL);root.addChild(shoulderR);}
 root.tags.add(villain?'villain':'player');return root;
}
