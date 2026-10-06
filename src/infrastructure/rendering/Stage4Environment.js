import * as pc from 'playcanvas';

const makeMaterial=(diffuse,opts={})=>{const m=new pc.StandardMaterial();m.diffuse=diffuse;m.metalness=opts.metalness??0;m.gloss=opts.gloss??.45;m.useMetalness=true;m.update();return m;};

export class Stage4Environment {
 constructor(app){this.app=app;this.root=new pc.Entity('Stage4Environment');this.materials={};}
 build(){
  this.app.root.addChild(this.root);
  this.materials.asphalt=makeMaterial(new pc.Color(.045,.052,.058),{gloss:.22});
  this.materials.sidewalk=makeMaterial(new pc.Color(.42,.43,.41),{gloss:.3});
  this.materials.facade=makeMaterial(new pc.Color(.58,.47,.36),{gloss:.38});
  this.materials.glass=makeMaterial(new pc.Color(.055,.16,.23),{metalness:.35,gloss:.82});
  this.materials.foliage=makeMaterial(new pc.Color(.035,.22,.065),{gloss:.2});
  this.materials.bark=makeMaterial(new pc.Color(.19,.09,.035),{gloss:.18});
  return this;
 }
 addBuilding({name,x,z,w=8,d=8,h=12,material='facade'}){
  const b=new pc.Entity(name);b.addComponent('render',{type:'box',material:this.materials[material]});b.setPosition(x,h/2,z);b.setLocalScale(w,h,d);this.root.addChild(b);
  const glass=new pc.Entity(name+'Glass');glass.addComponent('render',{type:'box',material:this.materials.glass});glass.setPosition(x,h*.58,z-d*.505);glass.setLocalScale(w*.72,h*.52,.06);this.root.addChild(glass);return b;
 }
 addTree(x,z,scale=1){
  const trunk=new pc.Entity('TreeTrunk');trunk.addComponent('render',{type:'cylinder',material:this.materials.bark});trunk.setPosition(x,1.3*scale,z);trunk.setLocalScale(.42*scale,1.3*scale,.42*scale);this.root.addChild(trunk);
  for(const [ox,oy,oz,s] of [[0,3,0,2],[-.7,3,.2,1.3],[.65,3.2,.15,1.35]]){const crown=new pc.Entity('TreeCanopy');crown.addComponent('render',{type:'sphere',material:this.materials.foliage});crown.setPosition(x+ox*scale,oy*scale,z+oz*scale);crown.setLocalScale(s*scale,s*1.1*scale,s*scale);this.root.addChild(crown);}return trunk;
 }
}
