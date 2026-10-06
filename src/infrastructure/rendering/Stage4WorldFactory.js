import * as pc from 'playcanvas';
import {Stage4MaterialLibrary} from './Stage4MaterialLibrary.js';

export const STAGE4_SECTORS={
 pasto:{name:'Pasto Centro',x:0,z:108},
 amsterdam:{name:'Canales',x:-118,z:20},
 berlin:{name:'Distrito Industrial',x:118,z:18},
 santorini:{name:'Mirador Blanco',x:0,z:-62},
 arena:{name:'Arena Firewall',x:0,z:-150}
};
export const STAGE4_LANDMARKS={devops:{x:-28,z:88},backend:{x:112,z:18},lab:{x:-118,z:66}};
const mat=(color,metalness=0,gloss=.35)=>{const m=new pc.StandardMaterial();m.diffuse=color;m.metalness=metalness;m.gloss=gloss;m.update();return m;};
const box=(name,pos,scale,material)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'box',material});e.setPosition(...pos);e.setLocalScale(...scale);return e;};
const district=(root,obstacles,id,cx,cz,material,windowMaterial)=>{for(let i=0;i<6;i++){const h=7+(i%3)*5,x=cx+(i-2.5)*7,z=cz+(i%2?9:-9);root.addChild(box(id+'_Building_'+i,[x,h/2,z],[5.5,h,7],material));const windows=box(id+'_Windows_'+i,[x,h*.56,z-3.53],[3.8,h*.5,.08],windowMaterial);root.addChild(windows);obstacles.push({x,z,hw:2.75,hd:3.5});}};

export function createStage4World(app,{spawnLegacyCharacters=false}={}){
 const root=new pc.Entity('Stage4World');app.root.addChild(root);
 const materials=new Stage4MaterialLibrary();const {asphalt,concrete,grass,pasto,canal,industrial,mirador,window,roadLine,bark,foliage}=materials;
 root.addChild(box('Ground',[0,-.3,0],[420,.5,420],grass));const obstacles=[];
 for(const x of [-86,0,86])root.addChild(box('RoadV',[x,0,0],[14,.08,420],asphalt));
 for(const z of [-138,-70,0,70,138])root.addChild(box('RoadH',[0,.01,z],[420,.08,14],asphalt));
 district(root,obstacles,'Pasto',0,108,pasto,window);district(root,obstacles,'Canales',-118,20,canal,window);district(root,obstacles,'Industrial',118,18,industrial,window);district(root,obstacles,'Mirador',0,-62,mirador,window);
 for(const x of [-86,0,86])for(let z=-196;z<=196;z+=14)root.addChild(box('RoadLineV',[x,.055,z],[.14,.02,5.5],roadLine));
 for(const z of [-138,-70,0,70,138])for(let x=-196;x<=196;x+=14)root.addChild(box('RoadLineH',[x,.06,z],[5.5,.02,.14],roadLine));
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=Math.cos(a)*31,z=-150+Math.sin(a)*31;root.addChild(box('FirewallPillar_'+i,[x,4,z],[2.2,8,2.2],concrete));obstacles.push({x,z,hw:1.1,hd:1.1});}
 for(const [x,z] of [[-34,94],[34,94],[-132,38],[-104,38],[104,38],[132,38],[-28,-78],[28,-78]]){const trunk=box('TreeTrunk',[x,1,z],[.55,2,.55],bark);root.addChild(trunk);const crown=new pc.Entity('TreeCrown');crown.addComponent('render',{type:'sphere',material:foliage});crown.setPosition(x,3,z);crown.setLocalScale(2.6,3.2,2.6);root.addChild(crown);}
 const npcs=[];return {root,npcs,obstacles,materials,sectors:STAGE4_SECTORS,landmarks:STAGE4_LANDMARKS,spawnLegacyCharacters};
}
