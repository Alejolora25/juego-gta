// Offline inspection only. Originals and live game resources remain unchanged.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NodeIO} from '@gltf-transform/core';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/character-library');
const output=path.resolve(process.argv[2]??'/workspace/artifacts/lora25-phase2');
await fs.mkdir(output,{recursive:true});
const manifest=JSON.parse(await fs.readFile(path.join(root,'download-manifest.json'),'utf8'));
const io=new NodeIO();
const results=[];
for(const source of manifest.files.filter(f=>/\.(gltf|glb)$/.test(f.path))){
 const filename=path.join(root,'originals',source.path);
 const aliases=[];
 let document;
 if(source.path.endsWith('.glb'))document=await io.read(filename);
 else{
  const json=JSON.parse(await fs.readFile(filename,'utf8'));
  const resources={};
  for(const item of [...json.buffers??[],...json.images??[]]){
   if(!item.uri||item.uri.startsWith('data:'))continue;
   let resource=path.join(path.dirname(filename),decodeURIComponent(item.uri));
   try{resources[item.uri]=new Uint8Array(await fs.readFile(resource));}
   catch(error){
    if(error.code!=='ENOENT')throw error;
    const corrected=item.uri.replace('_png.png','.png');
    resource=path.join(path.dirname(filename),corrected);
    try{resources[item.uri]=new Uint8Array(await fs.readFile(resource));}
    catch(fallbackError){
     if(fallbackError.code!=='ENOENT')throw fallbackError;
     resource=path.join(root,'originals/universal-base/Base Characters/Godot - UE',corrected);
     resources[item.uri]=new Uint8Array(await fs.readFile(resource));
    }
    aliases.push({uri:item.uri,resolvedTo:path.relative(root,resource)});
   }
  }
  document=await io.readJSON({json,resources});
 }
 const r=document.getRoot();
 let triangles=0,vertices=0;
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const node of r.listNodes()){
  const mesh=node.getMesh();if(!mesh)continue;
  const matrix=node.getWorldMatrix();
  for(const primitive of mesh.listPrimitives()){
   if(primitive.getMode()!==4)throw new Error('Non-triangle primitive: '+source.path);
   const position=primitive.getAttribute('POSITION');
   vertices+=position.getCount();triangles+=(primitive.getIndices()?.getCount()??position.getCount())/3;
   for(let i=0;i<position.getCount();i++){
    const v=position.getElement(i,[]);
    for(let axis=0;axis<3;axis++){
     const value=matrix[axis]*v[0]+matrix[axis+4]*v[1]+matrix[axis+8]*v[2]+matrix[axis+12];
     min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);
    }
   }
  }
 }
 const animationClips=r.listAnimations().map(animation=>{
  const samplers=animation.listSamplers();
  let duration=0;
  for(const sampler of samplers){
   const input=sampler.getInput();duration=Math.max(duration,input.getMax([])[0]);
   const values=sampler.getOutput().getArray();
   for(const value of values)if(!Number.isFinite(value))throw new Error('Non-finite animation: '+source.path);
  }
  const rootTranslations=animation.listChannels().filter(c=>c.getTargetNode()?.getName()==='root'&&c.getTargetPath()==='translation').map(c=>{
   const accessor=c.getSampler().getOutput();
   return {min:accessor.getMin([]),max:accessor.getMax([])};
  });
  return {name:animation.getName(),durationSeconds:duration,channels:animation.listChannels().length,rootTranslations};
 });
 const skins=r.listSkins().map(skin=>({name:skin.getName(),joints:skin.listJoints().map(j=>j.getName())}));
 const textures=r.listTextures().map(texture=>{
  const data=texture.getImage();
  const png=texture.getMimeType()==='image/png';
  const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
  return {name:texture.getName(),mimeType:texture.getMimeType(),bytes:data.length,
   ...(png?{width:view.getUint32(16),height:view.getUint32(20)}:{})};
 });
 const id=source.path.replaceAll(/[^a-zA-Z0-9.-]/g,'_');
 const inspectionFile=path.join(output,id.replace(/\.gltf$/,'.glb'));
 await io.write(inspectionFile,document);
 results.push({source:source.path,triangles,vertices,skins,animationClips,textures,
  materials:r.listMaterials().map(m=>({name:m.getName(),alphaMode:m.getAlphaMode(),doubleSided:m.getDoubleSided(),metallic:m.getMetallicFactor(),roughness:m.getRoughnessFactor()})),
  restMeshBounds:vertices?{min,max,size:max.map((v,i)=>v-min[i])}:null,
  inspectionFile,inspectionAliases:aliases});
}
const base=results.find(x=>x.source.endsWith('Superhero_Male_FullBody.gltf'));
const library=results.find(x=>x.source.endsWith('UAL1_Standard.glb'));
const jointNames=new Set(library.skins.flatMap(s=>s.joints));
const report={schemaVersion:1,date:'2026-10-09',originalsModified:false,results,
 skeletonNameComparison:{baseJointCount:base.skins[0].joints.length,libraryJointCount:jointNames.size,
  matching:base.skins[0].joints.filter(name=>jointNames.has(name)),
  missingFromLibrary:base.skins[0].joints.filter(name=>!jointNames.has(name))},
 warden:{status:'blocked-source-unavailable',integrated:false}};
await fs.writeFile(path.join(root,'inspection.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({models:results.length,report:path.join(root,'inspection.json'),output}));
