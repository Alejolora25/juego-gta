import * as pc from 'playcanvas';
import {Stage4MaterialLibrary} from './Stage4MaterialLibrary.js';

const box=(name,material,x,y,z,w,h,d)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'box',material});e.setPosition(x,y,z);e.setLocalScale(w,h,d);return e;};

export class Stage4Environment {
 constructor(app,{materials=null}={}){this.app=app;this.root=new pc.Entity('Stage4Environment');this.materials=materials??new Stage4MaterialLibrary();}
 build(){this.app.root.addChild(this.root);return this;}
 addBuilding({name,x,z,w=8,d=8,h=12,material='pasto'}){
  const facade=this.materials[material]??this.materials.pasto;
  const b=box(name,facade,x,h/2,z,w,h,d);this.root.addChild(b);
  const glass=box(name+'Glass',this.materials.window,x,h*.58,z-d*.505,w*.72,h*.52,.06);this.root.addChild(glass);
  const base=box(name+'Base',this.materials.concrete,x,.35,z,w*1.04,.7,d*1.04);this.root.addChild(base);
  const crown=box(name+'Crown',this.materials.concrete,x,h+.18,z,w*1.035,.36,d*1.035);this.root.addChild(crown);
  const accent=this.materials[material+'Accent']??this.materials.roadLine;
  for(const side of [-1,1]){
   const rib=box(name+'Rib'+side,accent,x+side*w*.39,h*.5,z-d*.512,.14,h*.78,.12);this.root.addChild(rib);
   const sideGlass=box(name+'SideGlass'+side,this.materials.window,x+side*w*.505,h*.55,z,.06,h*.44,d*.56);this.root.addChild(sideGlass);
  }
  for(let row=0;row<Math.max(2,Math.floor(h/5));row++){const y=2.1+row*2.6;if(y<h-.9)this.root.addChild(box(name+'WindowBand'+row,this.materials.window,x,y,z-d*.518,w*.52,.18,.08));}
  return b;
 }
 addTree(x,z,scale=1){
  const trunk=new pc.Entity('TreeTrunk');trunk.addComponent('render',{type:'cylinder',material:this.materials.bark});trunk.setPosition(x,1.3*scale,z);trunk.setLocalScale(.42*scale,1.3*scale,.42*scale);this.root.addChild(trunk);
  for(const [ox,oy,oz,s] of [[0,3,0,2],[-.7,3,.2,1.3],[.65,3.2,.15,1.35]]){const canopy=new pc.Entity('TreeCanopy');canopy.addComponent('render',{type:'sphere',material:this.materials.foliage});canopy.setPosition(x+ox*scale,oy*scale,z+oz*scale);canopy.setLocalScale(s*scale,s*1.1*scale,s*scale);this.root.addChild(canopy);}return trunk;
 }
}
