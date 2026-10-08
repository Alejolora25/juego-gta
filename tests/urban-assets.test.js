import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

function assertBasis(bytes){
 assert.equal(bytes.subarray(0,12).toString('hex'),'ab4b5458203230bb0d0a1a0a','Invalid KTX2 signature');
 assert.equal(bytes.readUInt32LE(12),0,'A Basis texture must not contain a fixed Vulkan format');
 assert.ok([1,2].includes(bytes.readUInt32LE(44)),'Missing BasisLZ or Zstd supercompression');
 assert.ok(bytes.readUInt32LE(40)>1,'Missing mip chain');
 const descriptor=bytes.readUInt32LE(48);
 assert.ok([163,166].includes(bytes[descriptor+12]),'Missing ETC1S or UASTC color model');
}
test('modular building LODs have opaque shells, lightmap UVs and bounded downloads',async()=>{
 for(let i=0;i<6;i++)for(const tier of ['high','low']){
  const bytes=await readFile(new URL(`../assets/pilot/building-${tier}-${i}.glb`,import.meta.url));
  assert.ok(bytes.length<350000,'A building texture or mesh exceeds its mobile download budget');
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'));
  assert.ok(gltf.extensionsRequired.includes('KHR_texture_basisu'));
  for(const texture of gltf.textures){
   const source=texture.extensions?.KHR_texture_basisu?.source;
   if(source===undefined)continue; // Tiny UV1 carrier stays JPEG.
   const image=gltf.images[source],view=gltf.bufferViews[image.bufferView];
   assert.equal(image.mimeType,'image/ktx2');
   const offset=28+bytes.readUInt32LE(12)+(view.byteOffset??0);
   assertBasis(bytes.subarray(offset,offset+view.byteLength));
  }
  assert.ok(gltf.materials.every(m=>!m.alphaMode||m.alphaMode==='OPAQUE'));
  for(const mesh of gltf.meshes)for(const p of mesh.primitives){
   assert.ok(p.attributes.TEXCOORD_1!==undefined,'Missing baked-light coordinates');
   assert.ok(p.attributes.NORMAL!==undefined);
  }
 }
});
test('shared irradiance atlas has linear Basis mipmaps and a bounded download',async()=>{
 const bytes=await readFile(new URL('../assets/pilot/lightmap.ktx2',import.meta.url));
 assertBasis(bytes);
 assert.equal(bytes.readUInt32LE(20),1024);assert.equal(bytes.readUInt32LE(24),1024);
 assert.equal(bytes[bytes.readUInt32LE(48)+14],1,'Lightmap must remain linear');
 assert.ok(bytes.length<100000);
});
