import * as pc from 'playcanvas';

const box=(name,material,x,y,z,w,h,d)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'box',material});e.setPosition(x,y,z);e.setLocalScale(w,h,d);return e;};
const cyl=(name,material,x,y,z,r,h)=>{const e=new pc.Entity(name);e.addComponent('render',{type:'cylinder',material});e.setPosition(x,y,z);e.setLocalScale(r,h,r);return e;};

function mat(color,{metalness=0,gloss=.45,emissive=null,intensity=0}={}){
 const m=new pc.StandardMaterial();m.diffuse=color;m.metalness=metalness;m.gloss=gloss;m.useMetalness=true;m.useFog=true;
 if(emissive){m.emissive=emissive;m.emissiveIntensity=intensity;}
 m.update();return m;
}

export class Stage6UrbanOverhaul {
 constructor(app,{materials=null}={}){this.app=app;this.materials=materials;this.root=new pc.Entity('Stage6UrbanOverhaul');}
 build({baseWorld=null}={}){
  this.hideLegacyBoxes(baseWorld);
  this.app.root.addChild(this.root);
  const glass=this.materials?.window??mat(new pc.Color(.03,.12,.18),{metalness:.45,gloss:.9});
  const asphalt=this.materials?.asphalt??mat(new pc.Color(.035,.038,.042),{gloss:.28});
  const concrete=this.materials?.concrete??mat(new pc.Color(.44,.43,.4),{gloss:.34});
  const line=this.materials?.roadLine??mat(new pc.Color(.92,.72,.2),{emissive:new pc.Color(.12,.07,.01),intensity:.15});
  const glowBlue=mat(new pc.Color(.02,.18,.34),{metalness:.18,gloss:.7,emissive:new pc.Color(.02,.22,.55),intensity:.75});
  const warm=mat(new pc.Color(1,.68,.28),{gloss:.55,emissive:new pc.Color(1,.42,.09),intensity:1.45});
  const brick=mat(new pc.Color(.42,.2,.13),{gloss:.42});
  const steel=mat(new pc.Color(.2,.24,.27),{metalness:.35,gloss:.58});
  const cream=mat(new pc.Color(.82,.79,.68),{gloss:.42});
  const red=mat(new pc.Color(.58,.07,.045),{metalness:.12,gloss:.55,emissive:new pc.Color(.32,.02,.015),intensity:.35});
  this.addRoadNetwork(asphalt,concrete,line);
  this.addDistrict('PastoCore',0,108,brick,glass,warm,'Pasto Centro');
  this.addDistrict('CanalQuarter',-118,20,glowBlue,glass,concrete,'Canales');
  this.addDistrict('IndustrialYard',118,18,steel,glass,red,'Distrito Industrial');
  this.addDistrict('MiradorTerraces',0,-62,cream,glass,warm,'Mirador Blanco');
  this.addArena(red,steel,warm);
  this.addStreetFurniture(concrete,steel,warm,glowBlue);
  return this;
 }
 hideLegacyBoxes(root){
  if(!root)return;
  const prefixes=['Pasto_Building_','Canales_Building_','Industrial_Building_','Mirador_Building_','Pasto_Windows_','Canales_Windows_','Industrial_Windows_','Mirador_Windows_'];
  root.find?.(node=>{if(prefixes.some(p=>node.name?.startsWith(p)))node.enabled=false;return false;});
 }
 addRoadNetwork(asphalt,concrete,line){
  for(const x of [-86,0,86]){this.root.addChild(box('Stage6RoadDeckV',asphalt,x,.16,0,18,.09,420));for(const side of [-1,1])this.root.addChild(box('Stage6CurbV',concrete,x+side*9.4,.32,0,.65,.32,420));}
  for(const z of [-138,-70,0,70,138]){this.root.addChild(box('Stage6RoadDeckH',asphalt,0,.18,z,420,.09,18));for(const side of [-1,1])this.root.addChild(box('Stage6CurbH',concrete,0,.34,z+side*9.4,420,.32,.65));}
  for(const x of [-86,0,86])for(let z=-196;z<=196;z+=12)this.root.addChild(box('Stage6LaneDashV',line,x,.25,z,.28,.035,5.2));
  for(const z of [-138,-70,0,70,138])for(let x=-196;x<=196;x+=12)this.root.addChild(box('Stage6LaneDashH',line,x,.26,z,5.2,.035,.28));
  for(const [cx,cz] of [[0,70],[-86,0],[86,0],[0,-70]])for(let i=-4;i<=4;i++)this.root.addChild(box('Stage6Crosswalk',concrete,cx+i*1.3,.28,cz+10,.82,.035,4.2));
 }
 addDistrict(id,cx,cz,facade,glass,accent,label){
  const layouts=[[-18,-11,10,30,8],[0,10,12,22,9],[18,-8,9,26,7],[-5,-25,14,18,10],[26,18,10,16,8]];
  for(let i=0;i<layouts.length;i++){const [ox,oz,w,h,d]=layouts[i];this.addBuilding(`${id}Tower${i}`,cx+ox,cz+oz,w,h,d,facade,glass,accent,i);}
  this.root.addChild(box(id+'Plaza',this.materials?.sidewalk??accent,cx,.24,cz,40,.08,22));
  this.root.addChild(box(id+'DistrictSign',accent,cx,3.2,cz-16,10,.75,.28));
  for(let i=0;i<label.length&&i<8;i++)this.root.addChild(box(id+'SignGlyph'+i,glass,cx-4+i*1.15,3.75,cz-16.18,.52,.42,.08));
 }
 addBuilding(name,x,z,w,h,d,facade,glass,accent,index){
  this.root.addChild(box(name+'Mass',facade,x,h/2,z,w,h,d));
  this.root.addChild(box(name+'Podium',accent,x,1.05,z-d*.53,w*1.08,2.1,.58));
  this.root.addChild(box(name+'LobbyGlass',glass,x,2.25,z-d*.58,w*.68,2.4,.18));
  this.root.addChild(box(name+'RoofCap',accent,x,h+.32,z,w*1.08,.64,d*1.08));
  for(const side of [-1,1])this.root.addChild(box(name+'CornerColumn'+side,accent,x+side*w*.48,h*.5,z-d*.54,.24,h*.88,.28));
  const rows=Math.max(3,Math.floor(h/3));
  for(let row=0;row<rows;row++){
   const y=4.6+row*2.55;if(y>h-.8)continue;
   for(let col=-2;col<=2;col++)this.root.addChild(box(name+'Window_'+row+'_'+col,glass,x+col*w*.15,y,z-d*.57,w*.08,1.1,.12));
   if(row%2===index%2)this.root.addChild(box(name+'Balcony_'+row,accent,x,y-.8,z-d*.62,w*.72,.12,.55));
  }
  if(index%2===0)this.root.addChild(box(name+'Billboard',accent,x,h*.72,z-d*.64,w*.78,1.15,.18));
 }
 addArena(red,steel,warm){
  this.root.addChild(box('Stage6ArenaPlatform',steel,0,.32,-150,64,.18,64));
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,x=Math.cos(a)*32,z=-150+Math.sin(a)*32;this.root.addChild(cyl('Stage6ArenaSpire',steel,x,5,z,.55,5));this.root.addChild(box('Stage6ArenaEye',red,x,9.8,z,1.5,.45,1.5));}
  this.root.addChild(cyl('Stage6ArenaCore',red,0,2.2,-150,4,2.2));
  this.root.addChild(box('Stage6ArenaGate',warm,0,3.2,-121,12,4,.5));
 }
 addStreetFurniture(concrete,steel,warm,blue){
  for(let z=-180;z<=180;z+=24)for(const x of [-96,-76,-10,10,76,96]){this.root.addChild(cyl('Stage6LampPost',steel,x,2.2,z,.09,2.2));this.root.addChild(box('Stage6LampHead',warm,x,4.35,z,.58,.24,.58));}
  for(const [x,z] of [[-28,86],[28,86],[-126,36],[-108,5],[110,36],[132,0],[-18,-50],[18,-78]]){this.root.addChild(box('Stage6TransitKiosk',blue,x,1.25,z,2.2,2.5,1.2));this.root.addChild(box('Stage6TransitGlass',warm,x,1.65,z-.65,1.55,1,.12));this.root.addChild(box('Stage6TransitRoof',concrete,x,2.65,z,2.6,.28,1.55));}
  for(const [x,z] of [[-36,98],[36,98],[-46,116],[46,116],[-132,20],[-104,20],[104,18],[134,18],[-28,-62],[28,-62]]){this.root.addChild(box('Stage6PlanterBox',concrete,x,.55,z,2.4,.85,1.4));this.root.addChild(cyl('Stage6TreeTrunk',steel,x,1.65,z,.16,1.4));const crown=new pc.Entity('Stage6TreeCrown');crown.addComponent('render',{type:'sphere',material:blue});crown.setPosition(x,3.2,z);crown.setLocalScale(1.7,1.15,1.7);this.root.addChild(crown);}
 }
}
