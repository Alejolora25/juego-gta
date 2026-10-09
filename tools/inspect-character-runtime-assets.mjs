// Read-only inventory of approved character sources or isolated runtime variants.
// Decoded memory estimates exclude engine, driver, instance and upload overhead.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sources={
 alejandro:'assets/characters/alejandro-explorer/alejandro.glb',
 juan:'assets/characters/npc-phase4/juan/juan.glb',
 sara:'assets/characters/npc-phase4/sara/sara.glb',
 david:'assets/characters/npc-phase4/david/david.glb'
};
const componentBytes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
function sumUniqueAccessors(gltf,indices){
 return [...new Set(indices)].reduce((sum,index)=>{
  const a=gltf.accessors[index];return sum+a.count*componentBytes[a.componentType]*components[a.type];
 },0);
}
function parseGlb(bytes){
 if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw new Error('Invalid GLB');
 let offset=12,gltf,bin;const chunks=[];
 while(offset<bytes.length){
  const length=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4),data=bytes.subarray(offset+8,offset+8+length);
  if(type===0x4e4f534a)gltf=JSON.parse(data.toString());
  if(type===0x004e4942)bin=data;
  chunks.push({type:type===0x4e4f534a?'JSON':type===0x004e4942?'BIN':type,bytes:length});offset+=8+length;
 }
 return {gltf,bin,chunks};
}
async function inspect(id,relative){
 const bytes=await fs.readFile(path.resolve(root,relative)),{gltf,bin,chunks}=parseGlb(bytes);
 const primitives=(gltf.meshes??[]).flatMap(m=>m.primitives),geometryAccessors=[],animationAccessors=[];
 let vertices=0,triangles=0;
 for(const p of primitives){
  geometryAccessors.push(...Object.values(p.attributes));
  if(p.indices!==undefined)geometryAccessors.push(p.indices);
  for(const target of p.targets??[])geometryAccessors.push(...Object.values(target));
  vertices+=gltf.accessors[p.attributes.POSITION].count;
  if((p.mode??4)===4)triangles+=(gltf.accessors[p.indices??p.attributes.POSITION].count)/3;
 }
 for(const animation of gltf.animations??[])for(const s of animation.samplers)animationAccessors.push(s.input,s.output);
 const textures=await Promise.all((gltf.images??[]).map(async image=>{
  if(image.bufferView===undefined)return {name:image.name??'',externalUri:image.uri};
  const view=gltf.bufferViews[image.bufferView],data=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
  if(image.mimeType==='image/ktx2'){
   const width=data.readUInt32LE(20),height=data.readUInt32LE(24),levels=data.readUInt32LE(40);
   return {name:image.name??'',mimeType:image.mimeType,encodedBytes:data.length,width,height,mipLevels:levels,
    decodedRgbaWithMipmapsBytesEstimate:null,gpuBytesEstimate:null,
    gpuEstimateNote:'Basis target varies with device support; measure after runtime transcoding.'};
  }
  const meta=await sharp(data).metadata(),rgbaBytes=meta.width*meta.height*4;
  return {name:image.name??'',mimeType:image.mimeType,encodedBytes:data.length,width:meta.width,height:meta.height,
   decodedRgbaBytesEstimate:rgbaBytes,decodedRgbaWithMipmapsBytesEstimate:Math.ceil(rgbaBytes*4/3)};
 }));
 const animations=(gltf.animations??[]).map(a=>({name:a.name,channels:a.channels.length,samplers:a.samplers.length,
  durationSeconds:Math.max(0,...a.samplers.map(s=>gltf.accessors[s.input]?.max?.[0]??0))}));
 return {id,file:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),chunks,
  extensionsRequired:gltf.extensionsRequired??[],meshes:gltf.meshes?.length??0,primitives:primitives.length,
  materials:gltf.materials?.length??0,vertices,triangles,
  skins:(gltf.skins??[]).map(s=>({name:s.name??'',joints:s.joints.length})),animations,textures,
  encodedTextureBytes:textures.reduce((s,t)=>s+(t.encodedBytes??0),0),
  decodedGeometryAccessorBytesEstimate:sumUniqueAccessors(gltf,geometryAccessors),
  decodedAnimationAccessorBytesEstimate:sumUniqueAccessors(gltf,animationAccessors),
  decodedRgbaWithMipmapsBytesEstimate:textures.some(t=>t.mimeType==='image/ktx2')?null:textures.reduce((s,t)=>s+(t.decodedRgbaWithMipmapsBytesEstimate??0),0)};
}
const runtime=process.argv.includes('--runtime');
const assets=await Promise.all(Object.entries(sources).map(([id,file])=>inspect(id,runtime?`assets/characters/runtime-optimized/${id}.glb`:file)));
const report={schemaVersion:1,variant:runtime?'runtime':'approved-source',measurement:'on-disk bytes and glTF structure; no frame-rate or mobile claim',assets,
 totals:{bytes:assets.reduce((s,a)=>s+a.bytes,0),triangles:assets.reduce((s,a)=>s+a.triangles,0),
  vertices:assets.reduce((s,a)=>s+a.vertices,0),primitives:assets.reduce((s,a)=>s+a.primitives,0),
  encodedTextureBytes:assets.reduce((s,a)=>s+a.encodedTextureBytes,0),
  decodedGeometryAccessorBytesEstimate:assets.reduce((s,a)=>s+a.decodedGeometryAccessorBytesEstimate,0),
  decodedAnimationAccessorBytesEstimate:assets.reduce((s,a)=>s+a.decodedAnimationAccessorBytesEstimate,0),
  decodedRgbaWithMipmapsBytesEstimate:assets.some(a=>a.decodedRgbaWithMipmapsBytesEstimate===null)?null:assets.reduce((s,a)=>s+a.decodedRgbaWithMipmapsBytesEstimate,0)}};
const outputIndex=process.argv.indexOf('--output');
if(outputIndex!==-1){
 const filename=path.resolve(process.argv[outputIndex+1]);await fs.mkdir(path.dirname(filename),{recursive:true});
 await fs.writeFile(filename,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
