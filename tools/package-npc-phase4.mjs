// Optimize only isolated adapted NPCs; original CC0 files and game remain intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NodeIO} from '@gltf-transform/core';
import {dedup,resample} from '@gltf-transform/functions';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../assets/characters/npc-phase4');
const io=new NodeIO(),results=[];
for(const id of ['juan','sara','david']){
 const filename=path.join(dir,id,id+'.glb');
 const doc=await io.read(filename),before=(await fs.stat(filename)).size;
 await doc.transform(resample({tolerance:1e-6}),dedup());
 // Opaque skin/cloth can cull backfaces; materials contain no transparency tricks.
 for(const material of doc.getRoot().listMaterials())material.setAlphaMode('OPAQUE');
 await io.write(filename,doc);
 let triangles=0;
 for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives())triangles+=primitive.getIndices().getCount()/3;
 const clips=doc.getRoot().listAnimations().map(a=>a.getName());
 if(clips.length!==3||!['Idle','Interact','Wave'].every(n=>clips.includes(n)))throw new Error('Invalid stationary NPC clips');
 results.push({id,beforeBytes:before,afterBytes:(await fs.stat(filename)).size,triangles,materials:doc.getRoot().listMaterials().length,meshes:doc.getRoot().listMeshes().length,bones:doc.getRoot().listSkins()[0].listJoints().length,clips,gameplayChanged:false});
}
await fs.writeFile(path.join(dir,'package-report.json'),JSON.stringify({results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
