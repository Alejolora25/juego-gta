// Package the authored Vanguard; preserve the official upload and editable rig.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRDracoMeshCompression,KHRTextureBasisu} from '@gltf-transform/extensions';
import {listTextureSlots,getTextureColorSpace,dedup,prune} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
const root=path.resolve(import.meta.dirname,'..'),directory=path.join(root,'assets/characters/warden-vanguard');
const source=path.join(directory,'warden-source.glb'),output=path.join(directory,'warden.glb');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':await draco3d.createEncoderModule(),'draco3d.decoder':await draco3d.createDecoderModule()});
const doc=await io.read(source);await doc.transform(dedup(),prune());
const fingerprint=d=>JSON.stringify({clips:d.getRoot().listAnimations().map(a=>({name:a.getName(),samplers:a.listSamplers().map(s=>[Array.from(s.getInput().getArray()),Array.from(s.getOutput().getArray())])})),skins:d.getRoot().listSkins().map(s=>({joints:s.listJoints().map(j=>j.getName()),bind:Array.from(s.getInverseBindMatrices().getArray())}))});
const invariant=fingerprint(doc),before=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives());
const triangles=before.reduce((n,p)=>n+p.getIndices().getCount()/3,0);
const exec=promisify(execFile),toktx=process.env.TOKTX_BIN??'toktx',temporary=await fs.mkdtemp(path.join(os.tmpdir(),'vanguard-ktx-'));
const textureReports=[];
const validateOnly=process.argv.includes('--validate-only');
try{
 if(!validateOnly){
 const version=await exec(toktx,['--version']);assert.match(version.stdout+version.stderr,/4\.4\.2/);
 for(const [i,texture] of doc.getRoot().listTextures().entries()){
  const input=path.join(temporary,i+(texture.getMimeType()==='image/jpeg'?'.jpg':'.png')),dest=path.join(temporary,i+'.ktx2');
  await fs.writeFile(input,texture.getImage());
  const slots=listTextureSlots(texture),normal=slots.includes('normalTexture'),srgb=getTextureColorSpace(texture)==='srgb',size=texture.getSize();
  const args=['--t2','--genmipmap','--assign_oetf',srgb?'srgb':'linear','--assign_primaries','bt709','--threads','2'];
  if(normal)args.push('--encode','uastc','--uastc_quality','2','--uastc_rdo_l','.5','--zcmp','18');
  else args.push('--encode','etc1s','--qlevel','200','--clevel','2');
  await exec(toktx,[...args,dest,input],{maxBuffer:1048576});
  const encoded=await fs.readFile(dest);textureReports.push({name:texture.getName(),slots,size,encoding:normal?'RGB UASTC':'ETC1S',colorSpace:srgb?'srgb':'linear',sourceBytes:texture.getImage().length,compressedBytes:encoded.length});
  texture.setImage(encoded).setMimeType('image/ktx2').setURI('');
  console.log('Compressed',i+1,doc.getRoot().listTextures().length);
 }
 doc.createExtension(KHRTextureBasisu).setRequired(true);
 // Blender exports secondary colours that the pinned engine ignores.
 for(const p of before){if(p.getAttribute('COLOR_1'))p.setAttribute('COLOR_1',null);}
 doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({method:KHRDracoMeshCompression.EncoderMethod.SEQUENTIAL,encodeSpeed:5,decodeSpeed:5,quantizationBits:{POSITION:16,NORMAL:14,TEX_COORD:16,GENERIC:16}});
 await io.write(output,doc);
 }else textureReports.push(...JSON.parse(await fs.readFile(path.join(directory,'compression-report.json'),'utf8')).textures);
 const decoded=await io.read(output);
 assert.equal(fingerprint(decoded),invariant,'Rig or animation samples changed');
 const after=decoded.getRoot().listMeshes().flatMap(m=>m.listPrimitives());assert.equal(after.length,before.length);
 assert.equal(after.reduce((n,p)=>n+p.getIndices().getCount()/3,0),triangles);
 let maxPositionError=0;
 for(let i=0;i<before.length;i++){
  const a=before[i],b=after[i],ai=a.getIndices().getArray(),bi=b.getIndices().getArray();assert.equal(ai.length,bi.length);
  for(const semantic of a.listSemantics().filter(s=>s!=='COLOR_1')){
   const aa=a.getAttribute(semantic).getArray(),bb=b.getAttribute(semantic).getArray(),n=a.getAttribute(semantic).getElementSize();let error=0;
   for(let c=0;c<ai.length;c++)for(let k=0;k<n;k++)error=Math.max(error,Math.abs(aa[ai[c]*n+k]-bb[bi[c]*n+k]));
   if(semantic==='JOINTS_0')assert.equal(error,0);else assert.ok(error<(semantic==='NORMAL'?.0003:.0001),semantic+' precision');
   if(semantic==='POSITION')maxPositionError=Math.max(maxPositionError,error);
  }
 }
 const original=await fs.readFile(path.join(directory,'original/vanguard.glb')),runtime=await fs.readFile(output);
 const report={originalBytes:original.length,runtimeBytes:runtime.length,savedPercent:100*(1-runtime.length/original.length),originalSha256:createHash('sha256').update(original).digest('hex'),runtimeSha256:createHash('sha256').update(runtime).digest('hex'),originalPrimitives:499,runtimePrimitives:after.length,triangles,maxPositionErrorMeters:maxPositionError,joints:decoded.getRoot().listSkins()[0].listJoints().length,clips:decoded.getRoot().listAnimations().map(a=>a.getName()),rigAndClipsPreserved:true,textures:textureReports};
 await fs.writeFile(path.join(directory,'compression-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,textures:report.textures.length}));
}finally{await fs.rm(temporary,{recursive:true,force:true});}
