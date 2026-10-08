import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('modular building LODs have opaque shells, lightmap UVs and bounded downloads',async()=>{
 for(let i=0;i<6;i++)for(const tier of ['high','low']){
  const bytes=await readFile(new URL(`../assets/pilot/building-${tier}-${i}.glb`,import.meta.url));
  assert.ok(bytes.length<350000,'A building texture or mesh exceeds its mobile download budget');
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'));
  assert.ok(gltf.materials.every(m=>!m.alphaMode||m.alphaMode==='OPAQUE'));
  for(const mesh of gltf.meshes)for(const p of mesh.primitives){
   assert.ok(p.attributes.TEXCOORD_1!==undefined,'Missing baked-light coordinates');
   assert.ok(p.attributes.NORMAL!==undefined);
  }
 }
});
