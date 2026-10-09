// Produce separate runtime copies; never rewrite approved GLBs, Blender files or sources.
// toktx 4.4.2 must be on PATH, or supplied with TOKTX_BIN.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRDracoMeshCompression,KHRTextureBasisu} from '@gltf-transform/extensions';
import {getTextureColorSpace,listTextureSlots} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import {gltfToEngineSemanticMap} from '../node_modules/playcanvas/build/playcanvas/src/framework/parsers/glb/gltf-accessor.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outputDirectory=path.join(root,'assets/characters/runtime-optimized');
const sources={
 alejandro:'assets/characters/alejandro-explorer/alejandro.glb',
 juan:'assets/characters/npc-phase4/juan/juan.glb',
 sara:'assets/characters/npc-phase4/sara/sara.glb',
 david:'assets/characters/npc-phase4/david/david.glb'
};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const typedArraySha=array=>sha(Buffer.from(array.buffer,array.byteOffset,array.byteLength));
const exec=promisify(execFile),toktx=process.env.TOKTX_BIN??'toktx';
const versionOutput=await exec(toktx,['--version']);
const toktxVersion=(versionOutput.stdout+versionOutput.stderr).trim();
assert.match(toktxVersion,/4\.4\.2/,'Use the verified toktx 4.4.2 encoder for reproducible texture output.');
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'lora25-character-runtime-'));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
 'draco3d.encoder':await draco3d.createEncoderModule(),
 'draco3d.decoder':await draco3d.createDecoderModule()
});
const quantizationBits={POSITION:16,NORMAL:14,TEX_COORD:16,GENERIC:16};
const engine=JSON.parse(await fs.readFile(path.join(root,'node_modules/playcanvas/package.json'),'utf8'));
assert.equal(engine.version,'2.23.0','Character compression targets the approved PlayCanvas version.');

async function checkProtectedFiles(){
 const checks=[];
 for(const directory of ['assets/characters/alejandro-explorer','assets/characters/npc-phase4']){
  const manifest=JSON.parse(await fs.readFile(path.join(root,directory,'deliverable-checksums.json'),'utf8'));
  for(const [relative,expected] of Object.entries(manifest.files)){
   const filename=path.join(directory,relative),bytes=await fs.readFile(path.join(root,filename));
   assert.equal(bytes.length,expected.bytes,`Protected size changed: ${filename}`);
   assert.equal(sha(bytes),expected.sha256,`Protected SHA changed: ${filename}`);
   checks.push({file:filename,bytes:bytes.length,sha256:expected.sha256});
  }
 }
 const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/character-library/checksums.json'),'utf8'));
 for(const expected of manifest.files){
  const filename=path.join('assets/character-library/originals',expected.path),bytes=await fs.readFile(path.join(root,filename));
  assert.equal(sha(bytes),expected.sha256,`Original library SHA changed: ${filename}`);
  if(expected.bytes!==undefined)assert.equal(bytes.length,expected.bytes,`Original library size changed: ${filename}`);
  checks.push({file:filename,bytes:bytes.length,sha256:expected.sha256});
 }
 return checks;
}
function invariantFingerprint(document){
 const r=document.getRoot();
 return {
  nodes:r.listNodes().map(n=>({name:n.getName(),translation:n.getTranslation(),rotation:n.getRotation(),scale:n.getScale(),
   children:n.listChildren().map(c=>r.listNodes().indexOf(c)),mesh:r.listMeshes().indexOf(n.getMesh()),skin:r.listSkins().indexOf(n.getSkin())})),
  scenes:r.listScenes().map(s=>({name:s.getName(),children:s.listChildren().map(n=>r.listNodes().indexOf(n))})),
  skins:r.listSkins().map(s=>({name:s.getName(),joints:s.listJoints().map(j=>r.listNodes().indexOf(j)),
   inverseBindMatricesSha256:typedArraySha(s.getInverseBindMatrices().getArray())})),
  animations:r.listAnimations().map(a=>({name:a.getName(),
   samplers:a.listSamplers().map(s=>({interpolation:s.getInterpolation(),
    inputSha256:typedArraySha(s.getInput().getArray()),outputSha256:typedArraySha(s.getOutput().getArray())})),
   channels:a.listChannels().map(c=>({target:r.listNodes().indexOf(c.getTargetNode()),path:c.getTargetPath(),sampler:a.listSamplers().indexOf(c.getSampler())}))})),
  materials:r.listMaterials().map(m=>({name:m.getName(),baseColor:m.getBaseColorFactor(),emissive:m.getEmissiveFactor(),
   metallic:m.getMetallicFactor(),roughness:m.getRoughnessFactor(),alphaMode:m.getAlphaMode(),alphaCutoff:m.getAlphaCutoff(),
   doubleSided:m.getDoubleSided(),normalScale:m.getNormalScale(),occlusionStrength:m.getOcclusionStrength(),
   textures:['BaseColor','Normal','Occlusion','Emissive','MetallicRoughness'].map(slot=>{
    const t=m['get'+slot+'Texture'](),info=m['get'+slot+'TextureInfo']();
    return t?{slot,name:t.getName(),texCoord:info.getTexCoord(),minFilter:info.getMinFilter(),magFilter:info.getMagFilter(),wrapS:info.getWrapS(),wrapT:info.getWrapT()}:null;
   })}))
 };
}
function validateGeometry(source,decoded){
 const sourcePrimitives=source.getRoot().listMeshes().flatMap(m=>m.listPrimitives());
 const outputPrimitives=decoded.getRoot().listMeshes().flatMap(m=>m.listPrimitives());
 assert.equal(sourcePrimitives.length,outputPrimitives.length,'Primitive count changed.');
 const maxComponentErrors={},clips=source.getRoot().listAnimations().map(a=>a.getName());
 let triangles=0,sourceVertices=0,outputVertices=0,verifiedCorners=0;
 for(let p=0;p<sourcePrimitives.length;p++){
  const sourcePrimitive=sourcePrimitives[p],outputPrimitive=outputPrimitives[p];
  assert.equal(sourcePrimitive.getMode(),outputPrimitive.getMode(),'Primitive mode changed.');
  assert.equal(sourcePrimitive.getMaterial().getName(),outputPrimitive.getMaterial().getName(),'Material assignment changed.');
  assert.equal(sourcePrimitive.listTargets().length,0,'Morph targets require additional validation before compression.');
  const sourceIndices=sourcePrimitive.getIndices().getArray(),outputIndices=outputPrimitive.getIndices().getArray();
  assert.equal(sourceIndices.length,outputIndices.length,'Triangle count changed.');
  const visibleSemantics=sourcePrimitive.listSemantics().filter(s=>s!=='COLOR_1');
  assert.deepEqual(visibleSemantics,outputPrimitive.listSemantics(),'Rendered vertex semantics changed.');
  triangles+=sourceIndices.length/3;verifiedCorners+=sourceIndices.length;
  sourceVertices+=sourcePrimitive.getAttribute('POSITION').getCount();outputVertices+=outputPrimitive.getAttribute('POSITION').getCount();
  for(const semantic of visibleSemantics){
   const original=sourcePrimitive.getAttribute(semantic),actual=outputPrimitive.getAttribute(semantic);
   assert.equal(original.getElementSize(),actual.getElementSize(),'Attribute dimensions changed.');
   assert.equal(original.getNormalized(),actual.getNormalized(),'Attribute normalization changed.');
   const sourceArray=original.getArray(),outputArray=actual.getArray(),components=original.getElementSize();
   let error=0;
   // Compare every corner in face order: Draco may remap duplicate vertex IDs.
   // This checks topology, skin assignments and attributes together, without
   // assuming that re-encoded vertex buffers retain their original ordering.
   for(let corner=0;corner<sourceIndices.length;corner++)for(let c=0;c<components;c++){
    error=Math.max(error,Math.abs(sourceArray[sourceIndices[corner]*components+c]-outputArray[outputIndices[corner]*components+c]));
   }
   assert.ok(Number.isFinite(error),`Nonfinite ${semantic} error.`);
   if(semantic.startsWith('JOINTS'))assert.equal(error,0,'Joint assignment changed.');
   if(semantic==='POSITION')assert.ok(error<0.00005,'Position component error exceeds 0.05 mm.');
   if(semantic==='NORMAL')assert.ok(error<0.0003,'Normal component error exceeds conservative precision.');
   if(semantic.startsWith('TEXCOORD'))assert.ok(error<0.00005,'UV component error exceeds conservative precision.');
   if(semantic.startsWith('WEIGHTS'))assert.ok(error<0.00003,'Skin weights exceed conservative precision.');
   if(semantic.startsWith('COLOR'))assert.ok(error<=1/255,'Color component error exceeds one 8-bit step.');
   maxComponentErrors[semantic]=Math.max(maxComponentErrors[semantic]??0,error);
  }
 }
 const invariant=invariantFingerprint(source),outputInvariant=invariantFingerprint(decoded);
 assert.equal(JSON.stringify(outputInvariant),JSON.stringify(invariant),'Hierarchy, rest transforms, rig, clips or material parameters changed.');
 return {triangles,sourceVertices,outputVertices,primitives:sourcePrimitives.length,verifiedFaceCorners:verifiedCorners,
  triangleOrderAndJointAssignmentsPreserved:true,allAnimationSamplesAndChannelsPreserved:true,
  nodeHierarchyRestTransformsAndInverseBindMatricesPreserved:true,materialParametersAndTextureSlotsPreserved:true,
  skins:source.getRoot().listSkins().map(s=>({name:s.getName(),joints:s.listJoints().length})),clips,
  invariantSha256:sha(JSON.stringify(invariant)),maxComponentErrors,
  visibleVertexAttributesPreservedWithinQuantization:true,
  excludedSourceAttribute:'COLOR_1, ignored by PlayCanvas 2.23 on the approved uncompressed source'};
}
function omitIgnoredColorSet(document){
 const removed=[],accessors=new Set();
 for(const [meshIndex,mesh] of document.getRoot().listMeshes().entries())for(const [primitiveIndex,primitive] of mesh.listPrimitives().entries()){
  const color=primitive.getAttribute('COLOR_1');if(!color)continue;
  removed.push({meshIndex,primitiveIndex,material:primitive.getMaterial().getName(),semantic:'COLOR_1',
   componentType:color.getComponentType(),type:color.getType(),count:color.getCount(),normalized:color.getNormalized(),
   sourceArraySha256:typedArraySha(color.getArray()),reason:'Not recognized by PlayCanvas 2.23 gltfToEngineSemanticMap. Keeping it in Draco makes worker stride exceed VertexFormat.size and VertexBuffer.setData rejects the data.'});
  primitive.setAttribute('COLOR_1',null);
  accessors.add(color);
 }
 for(const accessor of accessors)if(accessor.listParents().every(parent=>parent===document.getRoot()))accessor.dispose();
 return removed;
}
function validateKtx2(bytes){
 assert.equal(bytes.subarray(0,12).toString('hex'),'ab4b5458203230bb0d0a1a0a','Invalid KTX2 signature.');
 assert.equal(bytes.readUInt32LE(12),0,'KTX2 must contain transcodable Basis payload.');
 assert.ok([1,2].includes(bytes.readUInt32LE(44)),'KTX2 must be BasisLZ or Zstd-supercompressed.');
 assert.ok([163,166].includes(bytes[bytes.readUInt32LE(48)+12]),'KTX2 descriptor must be ETC1S or UASTC.');
 assert.ok(bytes.readUInt32LE(40)>1,'Mipmaps were not generated.');
}
async function compressTextures(document){
 const results=[];
 for(const [index,t] of document.getRoot().listTextures().entries()){
  const normal=listTextureSlots(t).includes('normalTexture'),srgb=getTextureColorSpace(t)==='srgb';
  assert.ok(!normal||!srgb,'Normal maps must remain linear.');
  const before=t.getImage(),size=t.getSize(),input=path.join(temporary,index+(t.getMimeType()==='image/jpeg'?'.jpg':'.png'));
  const output=path.join(temporary,index+'.ktx2');await fs.writeFile(input,before);
  const args=['--t2','--genmipmap','--assign_oetf',srgb?'srgb':'linear','--assign_primaries','bt709','--threads','2'];
  // Preserve RGB normals; do not swizzle into GGGR or change handedness.
  if(normal)args.push('--encode','uastc','--uastc_quality','2','--uastc_rdo_l','0.5','--uastc_rdo_m','--zcmp','18');
  else args.push('--encode','etc1s','--qlevel','200','--clevel','2');
  await exec(toktx,[...args,output,input],{maxBuffer:1024*1024});
  const bytes=await fs.readFile(output);validateKtx2(bytes);
  assert.equal(bytes[bytes.readUInt32LE(48)+14],srgb?2:1,'KTX2 transfer function changed.');
  assert.equal(bytes.readUInt32LE(20),size[0],'Texture width changed.');
  assert.equal(bytes.readUInt32LE(24),size[1],'Texture height changed.');
  t.setImage(bytes).setMimeType('image/ktx2').setURI('');
  results.push({name:t.getName(),slots:listTextureSlots(t),encoding:normal?'UASTC':'ETC1S',colorSpace:srgb?'srgb':'linear',
   width:size[0],height:size[1],mipLevels:bytes.readUInt32LE(40),sourceBytes:before.length,runtimeBytes:bytes.length,
   sourceSha256:sha(before),runtimeSha256:sha(bytes),normalConvention:normal?'unchanged RGB':undefined});
 }
 if(results.length)document.createExtension(KHRTextureBasisu).setRequired(true);
 return results;
}
try{
 const protectedBefore=await checkProtectedFiles(),results=[];
 for(const [id,relative] of Object.entries(sources)){
  const filename=path.join(root,relative),sourceBytes=await fs.readFile(filename),source=await io.read(filename),document=await io.read(filename);
  const excludedSourceAttributes=omitIgnoredColorSet(document);
  for(const mesh of document.getRoot().listMeshes())for(const primitive of mesh.listPrimitives())for(const semantic of primitive.listSemantics()){
   assert.ok(Object.hasOwn(gltfToEngineSemanticMap,semantic),`${id}: unsupported PlayCanvas vertex semantic ${semantic}.`);
  }
  const textureResults=id==='alejandro'?await compressTextures(document):[];
  // Do not call functions.draco(): it runs weld() and can remove degenerate
  // approved faces. Sequential encoding preserves the complete face list.
  document.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
   method:KHRDracoMeshCompression.EncoderMethod.SEQUENTIAL,encodeSpeed:5,decodeSpeed:5,quantizationBits
  });
  const staged=path.join(temporary,id+'.glb');await io.write(staged,document);
  const decoded=await io.read(staged),runtimeBytes=await fs.readFile(staged),validation=validateGeometry(source,decoded);
  results.push({id,source:relative,runtime:`assets/characters/runtime-optimized/${id}.glb`,
   sourceBytes:sourceBytes.length,runtimeBytes:runtimeBytes.length,savedBytes:sourceBytes.length-runtimeBytes.length,
   sourceSha256:sha(sourceBytes),runtimeSha256:sha(runtimeBytes),extensionsRequired:decoded.getRoot().listExtensionsRequired().map(e=>e.extensionName),
   textures:textureResults,excludedSourceAttributes,validation});
 }
 const protectedAfter=await checkProtectedFiles();assert.equal(JSON.stringify(protectedAfter),JSON.stringify(protectedBefore),'Protected files changed during packaging.');
 const sourceBytes=results.reduce((s,a)=>s+a.sourceBytes,0),runtimeBytes=results.reduce((s,a)=>s+a.runtimeBytes,0);
 const report={schemaVersion:1,scope:'four approved humans; selected Vanguard not available',
  build:{dracoMethod:'sequential',weld:false,simplification:false,quantizationBits,
   toktxVersion:toktxVersion.trim(),normalMaps:'RGB UASTC, linear, unchanged orientation',colorMaps:'ETC1S, source slot color space',mipmaps:true,
   targetEngine:'PlayCanvas 2.23.0',omittedDerivedAttribute:'COLOR_1 (ignored by target engine on approved sources)'},
  results,totals:{sourceBytes,runtimeBytes,savedBytes:sourceBytes-runtimeBytes,savedPercent:Number(((1-runtimeBytes/sourceBytes)*100).toFixed(2)),
   triangles:results.reduce((s,a)=>s+a.validation.triangles,0)},
  protectedFiles:{verifiedBeforeAndAfter:true,count:protectedBefore.length,files:protectedBefore},
  limitations:['Draco reduces transfer size; it does not itself reduce decoded triangle count or draw calls.',
   'KTX2 uses lossy texture encoding. Appearance must be checked in the actual renderer.',
   'GPU texture memory depends on the transcoding target; read engine gpuSize in the browser.',
   'No Samsung frame-rate or memory measurement is claimed by this offline build.']};
 await fs.mkdir(outputDirectory,{recursive:true});
 for(const {id} of results)await fs.copyFile(path.join(temporary,id+'.glb'),path.join(outputDirectory,id+'.glb'));
 await fs.writeFile(path.join(outputDirectory,'package-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({totals:report.totals,protectedFiles:protectedBefore.length,results:results.map(a=>({id:a.id,bytes:a.runtimeBytes,sha256:a.runtimeSha256,
  triangles:a.validation.triangles,maxPositionErrorMeters:a.validation.maxComponentErrors.POSITION})),report:'assets/characters/runtime-optimized/package-report.json'},null,2));
}finally{await fs.rm(temporary,{recursive:true,force:true});}
