import * as pc from 'playcanvas';
// Shared inexpensive footprint AO; no camera-following shadow map.
export function addUrbanBuildingContactShadows(app,root,buildings){
 const data=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const edge=Math.max(Math.abs((x-31.5)/31.5),Math.abs((y-31.5)/31.5));
  data[(y*64+x)*4+3]=Math.round(Math.min(1,Math.max(0,(1-edge)*5))*65);
 }
 const texture=new pc.Texture(app.graphicsDevice,{width:64,height:64,format:pc.PIXELFORMAT_RGBA8,mipmaps:false});
 new Uint8Array(texture.lock()).set(data);texture.unlock();
 const material=new pc.StandardMaterial();material.name='BuildingContactAO';material.diffuse.set(0,0,0);
 material.opacityMap=texture;material.opacityMapChannel='a';material.blendType=pc.BLEND_NORMAL;
 material.depthWrite=false;material.useLighting=false;material.cull=pc.CULLFACE_NONE;material.update();
 const shadows=buildings.map(b=>{
  const e=new pc.Entity('BuildingContactAO');e.addComponent('render',{type:'plane',material,castShadows:false});
  e.setPosition(b.x,.025,b.z);e.setLocalScale(b.width+1.6,1,b.depth+1.6);root.addChild(e);
  return {entity:e,x:b.x,z:b.z};
 });
 root.once('destroy',()=>{material.destroy();texture.destroy();});return shadows;
}
