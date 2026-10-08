import * as pc from 'playcanvas';

const box=(name,material,x,y,z,w,h,d)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'box',material});e.setPosition(x,y,z);e.setLocalScale(w,h,d);return e;};
const cylinder=(name,material,x,y,z,r,h)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'cylinder',material});e.setPosition(x,y,z);e.setLocalScale(r,h,r);return e;};

function makeMaterial(color,{metalness=0,gloss=.45,emissive=null,emissiveIntensity=0}={}){
 const m=new pc.StandardMaterial();m.diffuse=color;m.metalness=metalness;m.gloss=gloss;m.useMetalness=true;m.useFog=true;
 if(emissive){m.emissive=emissive;m.emissiveIntensity=emissiveIntensity;}
 m.update();return m;
}

export class Stage5VerticalSlice {
 constructor(app,{materials=null}={}){this.app=app;this.materials=materials;this.root=new pc.Entity('Stage5VerticalSlice');}
 build(){
  this.app.root.addChild(this.root);
  const glass=this.materials?.window??makeMaterial(new pc.Color(.035,.13,.2),{metalness:.45,gloss:.9,emissive:new pc.Color(.02,.08,.14),emissiveIntensity:.45});
  const concrete=this.materials?.concrete??makeMaterial(new pc.Color(.42,.42,.4),{gloss:.35});
  const roadLine=this.materials?.roadLine??makeMaterial(new pc.Color(.92,.72,.2),{gloss:.42,emissive:new pc.Color(.1,.06,.01),emissiveIntensity:.12});
  const trim=makeMaterial(new pc.Color(.05,.34,.62),{metalness:.2,gloss:.66,emissive:new pc.Color(.01,.12,.24),emissiveIntensity:.55});
  const brick=makeMaterial(new pc.Color(.43,.23,.16),{gloss:.38});
  const awning=makeMaterial(new pc.Color(.78,.08,.12),{gloss:.48});
  const warmLight=makeMaterial(new pc.Color(1,.7,.36),{gloss:.5,emissive:new pc.Color(1,.42,.12),emissiveIntensity:1.8});
  const asphalt=this.materials?.asphalt??makeMaterial(new pc.Color(.035,.039,.044),{gloss:.28});

  this.root.addChild(box('Stage5ShowcaseRoad',asphalt,0,.11,88,18,.08,72));
  for(const x of [-10.2,10.2])this.root.addChild(box('Stage5ShowcaseSidewalk',concrete,x,.2,88,4.2,.28,72));
  for(let z=55;z<=121;z+=9)this.root.addChild(box('Stage5LanePaint',roadLine,0,.19,z,.32,.035,4.8));
  for(const z of [65,88,111])for(let x=-5;x<=5;x+=2)this.root.addChild(box('Stage5CrosswalkStripe',concrete,x,.22,z,1.05,.035,5.6));

  this.addHeroFacade('Stage5AtriumTower',-17,82,11,34,trim,glass,concrete);
  this.addHeroFacade('Stage5BrickLofts',17,91,13,24,brick,glass,awning);
  this.addHeroFacade('Stage5TransitHub',-18,112,14,18,concrete,glass,trim);
  this.addStreetProps(warmLight,trim,concrete);
  return this;
 }
 addHeroFacade(name,x,z,w,h,facade,glass,accent){
  this.root.addChild(box(name+'Body',facade,x,h/2,z,w,h,8));
  this.root.addChild(box(name+'GroundFloorGlass',glass,x,2.8,z-4.08,w*.78,3.8,.16));
  this.root.addChild(box(name+'Canopy',accent,x,4.7,z-4.55,w*.92,.42,1.2));
  this.root.addChild(box(name+'RoofLine',accent,x,h+.35,z,w*1.05,.7,8.5));
  for(let row=0;row<Math.floor(h/3.2)-1;row++){
   const y=6.4+row*2.8;
   for(let col=-2;col<=2;col++)this.root.addChild(box(name+'Window_'+row+'_'+col,glass,x+col*w*.15,y,z-4.16,w*.08,1.28,.18));
   this.root.addChild(box(name+'Balcony_'+row,accent,x,y-.92,z-4.52,w*.74,.12,.52));
  }
  for(const side of [-1,1])this.root.addChild(box(name+'SidePilaster_'+side,accent,x+side*w*.48,h*.52,z-4.2,.22,h*.86,.28));
 }
 addStreetProps(light,trim,concrete){
  for(const [x,z] of [[-8,62],[8,74],[-8,88],[8,100],[-8,114]]){
   this.root.addChild(cylinder('Stage5LampPost',concrete,x,2.2,z,.12,2.2));
   this.root.addChild(box('Stage5LampArm',concrete,x+(x<0?1:-1),4.25,z,2.1,.12,.12));
   this.root.addChild(box('Stage5LampGlow',light,x+(x<0?1.95:-1.95),4.12,z,.48,.22,.48));
  }
  for(const [x,z] of [[-11.7,71],[11.7,83],[-11.7,102],[11.7,116]]){
   this.root.addChild(box('Stage5KioskBase',trim,x,1.05,z,1.8,2.1,1.1));
   this.root.addChild(box('Stage5KioskGlass',light,x,1.45,z-0.58,1.35,.9,.08));
   this.root.addChild(box('Stage5KioskRoof',concrete,x,2.25,z,2.1,.24,1.35));
  }
  for(const [x,z] of [[-6,68],[6,78],[-6,96],[6,108]]){
   this.root.addChild(box('Stage5Planter',concrete,x,.42,z,2.2,.7,1.2));
   const crown=new pc.Entity('Stage5PlanterFoliage');crown.addComponent('render',{type:'sphere',material:trim});crown.setPosition(x,.95,z);crown.setLocalScale(1.25,.48,.72);this.root.addChild(crown);
  }
 }
}
