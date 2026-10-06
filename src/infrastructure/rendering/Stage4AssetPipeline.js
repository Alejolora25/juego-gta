import * as pc from 'playcanvas';

export class Stage4AssetPipeline {
 constructor(app){this.app=app;this.assets=new Map();this.pending=new Map();}
 async loadGlb(name,url){
  if(this.assets.has(name))return this.assets.get(name);
  if(this.pending.has(name))return this.pending.get(name);
  const request=(async()=>{
   const asset=new pc.Asset(name,'container',{url});
   this.app.assets.add(asset);
   try{
    const loaded=await new Promise((resolve,reject)=>{asset.once('load',()=>resolve(asset));asset.once('error',reject);this.app.assets.load(asset);});
    this.assets.set(name,loaded);return loaded;
   }catch(error){
    this.app.assets.remove(asset);throw error;
   }finally{this.pending.delete(name);}
  })();
  this.pending.set(name,request);return request;
 }
 instantiate(name,{parent=this.app.root,position=[0,0,0],scale=[1,1,1]}={}){
  const asset=this.assets.get(name);if(!asset?.resource)throw new Error('Asset not loaded: '+name);
  const entity=asset.resource.instantiateRenderEntity();entity.name=name;entity.setPosition(...position);entity.setLocalScale(...scale);parent.addChild(entity);return entity;
 }
 async loadAndInstantiate(name,url,options={}){await this.loadGlb(name,url);return this.instantiate(name,options);}
 animations(name){const asset=this.assets.get(name);return asset?.resource?.animations??[];}
 has(name){return this.assets.has(name);}
 isLoading(name){return this.pending.has(name);}
}
