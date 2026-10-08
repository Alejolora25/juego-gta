import * as pc from 'playcanvas';
import {URBAN_ROADS,clearUrbanPlacement} from './UrbanDistrictLayout.js';

function box(root,name,x,y,z,w,h,d,material){
 const e=new pc.Entity(name);e.addComponent('render',{type:'box',material,castShadows:false});e.setLocalPosition(x,y,z);e.setLocalScale(w,h,d);root.addChild(e);return e;
}
export async function buildUrbanDistrictSurfaces({app,root,world,pipeline,buildings}){
 const source=new Map();
 for(const render of root.findComponents('render'))for(const mesh of render.meshInstances)source.set(mesh.material.name,mesh.material);
 const surface=(name,tiling,color)=>{
  const original=[...source].find(([k])=>k.startsWith(name))?.[1];
  const m=new pc.StandardMaterial();m.name='City'+name;m.diffuseMap=original?.diffuseMap??null;
  m.diffuse.set(...color);m.diffuseMapTiling.set(...tiling);m.gloss=.08;m.update();return m;
 };
 const asphaltV=surface('Asphalt',[3,90],[.72,.72,.72]);
 const asphaltH=surface('Asphalt',[90,3],[.72,.72,.72]);
 const paving=surface('Paving',[2,2],[.83,.82,.79]);
 const grass=surface('Soil',[90,90],[.63,.64,.57]);
 const curbs=new pc.StandardMaterial();curbs.diffuse.set(.51,.50,.46);curbs.gloss=.05;curbs.update();
 const line=new pc.StandardMaterial();line.diffuse.set(.82,.77,.61);line.gloss=0;line.update();
 for(const child of world.root.children){
  // Remove complete old facade families, including windows and foundations.
  if(/^(Pasto|Canales|Industrial|Mirador|Ground$|Road|Curb|Plaza|Tree|Crosswalk)/.test(child.name))child.enabled=false;
  if(child.name.startsWith('Firewall'))for(const render of child.findComponents('render')){
   const m=render.meshInstances[0]?.material.clone();if(!m)continue;
   m.diffuse.set(.25,.27,.28);m.emissive.set(.08,.018,.012);m.update();render.material=m;
  }
 }
 const surfaces=new pc.Entity('UrbanDistrictSurfaces');app.root.addChild(surfaces);
 box(surfaces,'CityGround',0,-.18,0,420,.2,420,grass);
 for(const [x,z,w,d] of [[0,106,116,48],[-123,0,58,118],[123,0,58,118],[0,-80,106,90]]){
  const blockPaving=paving.clone();blockPaving.diffuseMapTiling.set(w/4,d/4);blockPaving.update();
  box(surfaces,'DistrictPaving',x,-.06,z,w,.08,d,blockPaving);
 }
 for(const x of URBAN_ROADS.vertical)box(surfaces,'CityRoadV',x,.01,0,14,.08,420,asphaltV);
 for(const z of URBAN_ROADS.horizontal)box(surfaces,'CityRoadH',0,.02,z,420,.08,14,asphaltH);
 const segments=roads=>{const sorted=[-210,...roads.flatMap(p=>[p-7.5,p+7.5]),210];const out=[];for(let i=0;i<sorted.length-1;i+=2)out.push([sorted[i],sorted[i+1]]);return out;};
 for(const x of URBAN_ROADS.vertical)for(const side of [-1,1])for(const [a,b] of segments(URBAN_ROADS.horizontal)){
  box(surfaces,'SidewalkV',x+side*8.65,.08,(a+b)/2,2.8,.16,b-a,paving);
  box(surfaces,'CurbV',x+side*7.15,.12,(a+b)/2,.3,.24,b-a,curbs);
 }
 for(const z of URBAN_ROADS.horizontal)for(const side of [-1,1])for(const [a,b] of segments(URBAN_ROADS.vertical)){
  box(surfaces,'SidewalkH',(a+b)/2,.08,z+side*8.65,b-a,.16,2.8,paving);
  box(surfaces,'CurbH',(a+b)/2,.12,z+side*7.15,b-a,.24,.3,curbs);
 }
 for(const x of URBAN_ROADS.vertical)for(let z=-196;z<=196;z+=14)if(URBAN_ROADS.horizontal.every(p=>Math.abs(p-z)>11))box(surfaces,'LaneV',x,.065,z,.12,.015,4.5,line);
 for(const z of URBAN_ROADS.horizontal)for(let x=-196;x<=196;x+=14)if(URBAN_ROADS.vertical.every(p=>Math.abs(p-x)>11))box(surfaces,'LaneH',x,.075,z,4.5,.015,.12,line);
 for(const x of URBAN_ROADS.vertical)for(const z of URBAN_ROADS.horizontal)for(let stripe=-3;stripe<=3;stripe++){
  box(surfaces,'Crossing',x+stripe*1.6,.065,z+10,.7,.015,3,line);
 }
 for(const [x,z] of [[-28,74],[98,-12],[-108,54]])box(surfaces,'MissionForecourt',x,.02,z,10,.07,10,paving);
 const trees=[],fixtures=[];
 await pipeline.loadGlb('district-tree','./assets/pilot/district-tree.glb');
 const points=[];
 for(const side of [-1,1]){
  for(const z of [90,110,124])points.push([side*62,z]);
  for(const z of [-50,-18,18,48])points.push([side*158,z]);
  for(const z of [-92,-50])points.push([side*54,z]);
 }
 for(const [x,z] of points){
  if(!clearUrbanPlacement({x,z,width:6,depth:6})||buildings.some(b=>Math.abs(x-b.x)<6&&Math.abs(z-b.z)<7))continue;
  const tree=pipeline.instantiate('district-tree',{parent:surfaces,position:[x,0,z]});
  const pocket=grass.clone();pocket.diffuseMapTiling.set(2,2);pocket.update();box(surfaces,'TreeGarden',x,-.01,z,7,.08,7,pocket);
  trees.push({entity:tree,x,z});
 }
 await pipeline.loadGlb('district-lamp','./assets/pilot/district-lamp.glb');
 for(const roadX of URBAN_ROADS.vertical)for(const side of [-1,1])for(const z of [-110,-38,38,110]){
  const x=roadX+side*9.5;
  const lamp=pipeline.instantiate('district-lamp',{parent:surfaces,position:[x,0,z]});
  lamp.setLocalEulerAngles(0,side<0?180:0,0);fixtures.push({entity:lamp,x,z});
 }
 return {root:surfaces,trees,fixtures,materials:{asphaltV,asphaltH,paving,grass}};
}
