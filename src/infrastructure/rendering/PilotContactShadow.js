import * as pc from 'playcanvas';

export function addPilotContactShadow(app,parent,{size=.8}={}){
 const data=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const radius=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);
  data[(y*64+x)*4+3]=Math.round(Math.pow(Math.max(0,1-radius),1.5)*100);
 }
 const texture=new pc.Texture(app.graphicsDevice,{width:64,height:64,format:pc.PIXELFORMAT_RGBA8,mipmaps:false});
 new Uint8Array(texture.lock()).set(data);texture.unlock();
 const material=new pc.StandardMaterial();material.diffuse=new pc.Color(0,0,0);material.opacityMap=texture;material.opacityMapChannel='a';material.blendType=pc.BLEND_NORMAL;material.depthWrite=false;material.useLighting=false;material.cull=pc.CULLFACE_NONE;material.update();
 const e=new pc.Entity('ContactShadow');e.addComponent('render',{type:'plane',material,castShadows:false});e.setLocalScale(size,1,size);e.setLocalPosition(0,.13,0);parent.addChild(e);
 e.once('destroy',()=>{material.destroy();texture.destroy();});return e;
}
