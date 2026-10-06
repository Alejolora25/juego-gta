import * as pc from 'playcanvas';
import {createStage4Character} from './Stage4CharacterFactory.js';

const mat=(color,metalness=0,gloss=.35)=>{const m=new pc.StandardMaterial();m.diffuse=color;m.metalness=metalness;m.gloss=gloss;m.update();return m;};
const box=(name,pos,scale,material)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'box',material});e.setPosition(...pos);e.setLocalScale(...scale);return e;};

export function createStage4World(app){
 const root=new pc.Entity('Stage4World');app.root.addChild(root);
 const asphalt=mat(new pc.Color(.075,.085,.09),.05,.28),concrete=mat(new pc.Color(.36,.38,.39),.02,.32),glass=mat(new pc.Color(.08,.2,.28),.35,.72),grass=mat(new pc.Color(.08,.24,.1),0,.22),white=mat(new pc.Color(.78,.78,.72),0,.38),blue=mat(new pc.Color(.08,.28,.55),.05,.5);
 root.addChild(box('Ground',[0,-.3,0],[180,.5,180],grass));
 for(const x of [-42,0,42])root.addChild(box('RoadV',[x,0,0],[14,.08,180],asphalt));
 for(const z of [-60,0,60])root.addChild(box('RoadH',[0,.01,z],[180,.08,14],asphalt));
 const districts=[[-25,0,-25,white],[-25,0,25,glass],[25,0,-25,concrete],[25,0,25,blue]];
 for(let d=0;d<districts.length;d++){const [cx,,cz,m]=districts[d];for(let i=0;i<5;i++){const h=5+(i%3)*3,b=box('Building_'+d+'_'+i,[cx+(i-2)*5,h/2,cz+(i%2?6:-6)],[4.2,h,5.2],m);root.addChild(b);}}
 for(const [x,z] of [[-34,34],[-18,38],[18,34],[34,38],[-34,-34],[-18,-38],[18,-34],[34,-38]]){const trunk=box('TreeTrunk',[x,1,z],[.55,2,.55],mat(new pc.Color(.22,.11,.05)));root.addChild(trunk);const crown=new pc.Entity('TreeCrown');crown.addComponent('render',{type:'sphere',material:mat(new pc.Color(.06,.3,.09))});crown.setPosition(x,3,z);crown.setLocalScale(2.6,3.2,2.6);root.addChild(crown);}
 const npcPositions=[[-12,0,12],[12,0,12],[-12,0,-12]];const npcs=npcPositions.map((p,i)=>{const n=createStage4Character({name:['Juan','Sara','David'][i]});n.setPosition(...p);n.setLocalScale(.9,.9,.9);root.addChild(n);return n;});
 return {root,npcs};
}
