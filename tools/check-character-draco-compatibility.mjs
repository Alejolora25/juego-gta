// Exercise the pinned engine's real Draco worker and vertex-buffer layout offline.
// This supplements the GLB structural comparison; browser rendering is still required.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import draco3d from 'draco3dgltf';
import {DracoWorker} from '../node_modules/playcanvas/build/playcanvas/src/framework/parsers/draco-worker.js';
import {VertexFormat} from '../node_modules/playcanvas/build/playcanvas/src/platform/graphics/vertex-format.js';
import {VertexBuffer} from '../node_modules/playcanvas/build/playcanvas/src/platform/graphics/vertex-buffer.js';
import {gltfToEngineSemanticMap} from '../node_modules/playcanvas/build/playcanvas/src/framework/parsers/glb/gltf-accessor.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'assets/characters/runtime-optimized');
const engine=JSON.parse(await fs.readFile(path.join(root,'node_modules/playcanvas/package.json'),'utf8'));
assert.equal(engine.version,'2.23.0','The asset compatibility proof targets the approved engine version.');
const decoder=await draco3d.createDecoderModule(),previousSelf=globalThis.self;
let handler,resolveResult;
globalThis.self={DracoDecoderModule:()=>Promise.resolve(decoder),addEventListener:(event,fn)=>{handler=fn;},postMessage:data=>resolveResult(data)};
// The worker is the actual implementation shipped with PlayCanvas, called
// with a minimal message channel; the fake graphics device avoids claiming
// any GPU rendering or mobile measurement.
DracoWorker();handler({data:{type:'init'}});await Promise.resolve();
const device={isWebGPU:false,_vram:{vb:0},buffers:new Set(),createVertexBufferImpl:()=>({unlock(){}})};
const actors=[];
try{
 for(const id of ['alejandro','juan','sara','david']){
  const bytes=await fs.readFile(path.join(directory,id+'.glb'));
  assert.equal(bytes.readUInt32LE(0),0x46546c67,'Invalid GLB header.');
  const jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
  const bin=bytes.subarray(20+jsonLength+8),primitives=[];
  for(const primitive of gltf.meshes.flatMap(mesh=>mesh.primitives)){
   const extension=primitive.extensions.KHR_draco_mesh_compression,view=gltf.bufferViews[extension.bufferView];
   const encoded=Uint8Array.from(bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength));
   const decoded=await new Promise(resolve=>{resolveResult=resolve;handler({data:{type:'decodeMesh',buffer:encoded.buffer,jobId:1}});});
   assert.equal(decoded.error,undefined,'Engine worker could not decode the primitive.');
   const semantics=Object.fromEntries(Object.entries(extension.attributes).map(([name,attributeId])=>[attributeId,gltfToEngineSemanticMap[name]]));
   semantics[-1]=gltfToEngineSemanticMap.NORMAL;
   const description=decoded.attributes.filter(a=>semantics[a.id]!==undefined).map(a=>{
    const sourceSemantic=Object.keys(extension.attributes).find(name=>extension.attributes[name]===a.id);
    const accessor=sourceSemantic?gltf.accessors[primitive.attributes[sourceSemantic]]:null;
    return {semantic:semantics[a.id],components:a.numComponents,type:a.dataType,
     normalize:accessor?.normalized??(semantics[a.id]===gltfToEngineSemanticMap.COLOR_0&&[1,3].includes(a.dataType)),
     offset:a.offset,stride:decoded.stride};
   });
   const format=new VertexFormat(device,description);
   assert.equal(format.size,decoded.stride,`${id}: worker stride does not match engine format. An unsupported attribute may have been retained.`);
   const vertexBuffer=new VertexBuffer(device,format,decoded.vertices.byteLength/decoded.stride,{data:decoded.vertices});
   assert.ok(vertexBuffer.storage,`${id}: the engine rejected the decoded vertex data.`);
   assert.equal(vertexBuffer.storage.byteLength,decoded.vertices.byteLength,'Engine vertex data was truncated.');
   primitives.push({material:gltf.materials[primitive.material].name,workerStride:decoded.stride,formatSize:format.size,
    vertexBufferStorageCreated:true,vertices:vertexBuffer.numVertices,vertexBufferBytes:vertexBuffer.numBytes});
  }
  actors.push({id,sha256:createHash('sha256').update(bytes).digest('hex'),validatedPrimitives:primitives.length,primitives});
 }
 const report={engine:'PlayCanvas '+engine.version,realDracoWorkerAndVertexFormat:true,
  scope:'offline decoded buffer compatibility; no GPU rendering or mobile claim',
  totalValidPrimitives:actors.reduce((s,a)=>s+a.validatedPrimitives,0),actors};
 const outputIndex=process.argv.indexOf('--output');
 if(outputIndex!==-1){const file=path.resolve(process.argv[outputIndex+1]);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify({engine:report.engine,totalValidPrimitives:report.totalValidPrimitives,actors:actors.map(a=>({id:a.id,count:a.validatedPrimitives}))}));
}finally{
 if(previousSelf===undefined)delete globalThis.self;else globalThis.self=previousSelf;
}
