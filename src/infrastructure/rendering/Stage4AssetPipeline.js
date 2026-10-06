import * as pc from 'playcanvas';

export class Stage4AssetPipeline {
 constructor(app){this.app=app;this.assets=new Map();}
 async loadGlb(name,url){
  if(this.assets.has(name))return this.assets.get(name);
  const asset=new pc.Asset(name,'container',{url});
  this.app.assets.add(asset);
  const loaded=await new Promise((resolve,reject)=>{asset.once('load',()=>resolve(asset));asset.once('error',reject);this.app.assets.load(asset);});
  this.assets.set(name,loaded);return loaded;
 }
 instantiate(name,{parent=this.app.root,position=[0,0,0],scale=[1,1,1]}={}){
  const asset=this.assets.get(name);if(!asset?.resource)throw new Error('Asset not loaded: '+name);
  const entity=asset.resource.instantiateRenderEntity();entity.name=name;entity.setPosition(...position);entity.setLocalScale(...scale);parent.addChild(entity);return entity;
 }
 async loadAndInstantiate(name,url,options={}){await this.loadGlb(name,url);return this.instantiate(name,options);}
 has(name){return this.assets.has(name);}
}
