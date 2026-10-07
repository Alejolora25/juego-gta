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
const box=(name,pos,scale,material)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'box',material});e.setPosition(...pos);e.setLocalScale(...scale);return e;};
const district=(root,obstacles,id,cx,cz,material,windowMaterial,accent)=>{for(let i=0;i<6;i++){const h=7+(i%3)*5,x=cx+(i-2.5)*7,z=cz+(i%2?9:-9);root.addChild(box(id+'_Building_'+i,[x,h/2,z],[5.5,h,7],material));root.addChild(box(id+'_Base_'+i,[x,.32,z],[5.9,.64,7.4],accent));root.addChild(box(id+'_Roof_'+i,[x,h+.18,z],[5.85,.36,7.35],accent));const windows=box(id+'_Windows_'+i,[x,h*.56,z-3.53],[3.8,h*.5,.08],windowMaterial);root.addChild(windows);obstacles.push({x,z,hw:2.75,hd:3.5});}};

export function createStage4World(app,{spawnLegacyCharacters=false}={}){
 const root=new pc.Entity('Stage4World');app.root.addChild(root);
 const materials=new Stage4MaterialLibrary();const {asphalt,concrete,grass,pasto,canal,industrial,mirador,window,roadLine,bark,foliage,firewall,firewallGlow,pastoAccent,canalGlow,industrialSteel,miradorAccent}=materials;
 root.addChild(box('Ground',[0,-.3,0],[420,.5,420],grass));const obstacles=[];
 for(const x of [-86,0,86])root.addChild(box('RoadV',[x,0,0],[14,.08,420],asphalt));
 for(const z of [-138,-70,0,70,138])root.addChild(box('RoadH',[0,.01,z],[420,.08,14],asphalt));
 district(root,obstacles,'Pasto',0,108,pasto,window,pastoAccent);district(root,obstacles,'Canales',-118,20,canal,window,canalGlow);district(root,obstacles,'Industrial',118,18,industrial,window,industrialSteel);district(root,obstacles,'Mirador',0,-62,mirador,window,miradorAccent);
 // Non-colliding district wayfinding: paired posts, horizontal header and colored marker.
 for(const [id,x,z,accent] of [['Pasto',-18,82,pastoAccent],['Canales',-136,48,canalGlow],['Industrial',100,48,industrialSteel],['Mirador',-18,-42,miradorAccent]]){
  for(const side of [-1,1])root.addChild(box(id+'_SignPost_'+side,[x+side*2.2,1.65,z],[.16,3.3,.16],concrete));
  root.addChild(box(id+'_SignHeader',[x,3.15,z],[4.6,.58,.22],accent));
  root.addChild(box(id+'_SignMarker',[x,2.65,z],[1.35,.24,.24],window));
 }
 for(const x of [-86,0,86])for(let z=-196;z<=196;z+=14)root.addChild(box('RoadLineV',[x,.055,z],[.14,.02,5.5],roadLine));
 for(const z of [-138,-70,0,70,138])for(let x=-196;x<=196;x+=14)root.addChild(box('RoadLineH',[x,.06,z],[5.5,.02,.14],roadLine));
 // Painted pedestrian crossings are purely visual: no extra physics obstacles.
 for(const [cx,cz] of [[0,70],[-86,0],[86,0],[0,-70]]){
  for(let stripe=-3;stripe<=3;stripe++)root.addChild(box('CrosswalkStripe',[cx+stripe*1.45,.095,cz+10],[.85,.018,3.2],materials.sidewalk));
 }
 root.addChild(box('FirewallArenaFloor',[0,.08,-150],[58,.12,58],firewall));
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=Math.cos(a)*31,z=-150+Math.sin(a)*31;root.addChild(box('FirewallPillar_'+i,[x,4,z],[2.2,8,2.2],concrete));root.addChild(box('FirewallCap_'+i,[x,8.25,z],[2.65,.5,2.65],firewall));root.addChild(box('FirewallGlow_'+i,[x,6.15,z],[2.32,.18,2.32],firewallGlow));obstacles.push({x,z,hw:1.1,hd:1.1});}
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,x=Math.cos(a)*24,z=-150+Math.sin(a)*24;const segment=box('FirewallRing_'+i,[x,.22,z],[6,.18,.42],firewallGlow);segment.setEulerAngles(0,-a*180/Math.PI,0);root.addChild(segment);}
 root.addChild(box('FirewallCore',[0,.3,-150],[8,.35,8],firewallGlow));
 const trees=[[-34,94,1],[34,94,.92],[-42,116,.78],[42,116,.84],[-132,38,1.08],[-104,38,.9],[-138,4,.82],[-98,4,.76],[104,38,.88],[132,38,1.02],[102,-4,.74],[138,-4,.8],[-28,-78,.96],[28,-78,1.05],[-38,-48,.72],[38,-48,.78]];
 for(const [x,z,s] of trees){root.addChild(box('TreeTrunk',[x,s,z],[.5*s,2*s,.5*s],bark));for(const [ox,oy,oz,cs] of [[0,3,0,2.25],[-.75,3.05,.15,1.35],[.7,3.25,-.1,1.3]]){const crown=new pc.Entity('TreeCrown');crown.addComponent('render',{type:'sphere',material:foliage});crown.setPosition(x+ox*s,oy*s,z+oz*s);crown.setLocalScale(cs*s,cs*1.08*s,cs*s);root.addChild(crown);}}
 const npcs=[];return {root,npcs,obstacles,materials,sectors:STAGE4_SECTORS,landmarks:STAGE4_LANDMARKS,spawnLegacyCharacters};
}
