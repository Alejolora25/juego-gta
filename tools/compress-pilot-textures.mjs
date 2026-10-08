// Offline KTX2 build: requires Khronos toktx 4.4.2 (or TOKTX_BIN).
import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression,KHRTextureBasisu} from '@gltf-transform/extensions';
import {getTextureColorSpace,listTextureSlots} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const exec=promisify(execFile),binary=process.env.TOKTX_BIN??'toktx';
const directory=new URL('../assets/pilot/',import.meta.url);
const temp=await mkdtemp(join(tmpdir(),'urban-ktx-'));
const io=new NodeIO().registerExtensions([KHRDracoMeshCompression,KHRTextureBasisu]).registerDependencies({
 'draco3d.encoder':await draco3d.createEncoderModule(),
 'draco3d.decoder':await draco3d.createDecoderModule()
});
const cache=new Map();let converted=0;
function validate(bytes){
 const signature=Buffer.from(bytes.subarray(0,12)).toString('hex');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(signature!=='ab4b5458203230bb0d0a1a0a'||view.getUint32(12,true)!==0||![1,2].includes(view.getUint32(44,true)))throw new Error('Expected Basis-compressed KTX2 output');
 if(![163,166].includes(bytes[view.getUint32(48,true)+12]))throw new Error('Expected ETC1S or UASTC descriptor');
}
async function encode(bytes,{srgb=false,normal=false,extension='png'}={}){
 const key=createHash('sha256').update(bytes).update(`${srgb}:${normal}`).digest('hex');
 if(cache.has(key))return cache.get(key);
 const input=join(temp,key+'.'+extension),output=join(temp,key+'.ktx2');
 await writeFile(input,bytes);
 const options=['--t2','--genmipmap','--assign_oetf',srgb?'srgb':'linear','--assign_primaries','bt709','--threads','2'];
 // Preserve RGB normals: GGGR packing needs a different shader convention.
 if(normal)options.push('--encode','uastc','--uastc_quality','2','--uastc_rdo_l','0.5','--uastc_rdo_m','--zcmp','18');
 else options.push('--encode','etc1s','--qlevel','200','--clevel','2');
 await exec(binary,[...options,output,input],{maxBuffer:1024*1024});
 const result=await readFile(output);
 // toktx can ignore an invalid encoder name without failing. Never ship a
 // raw KTX container under the required KHR_texture_basisu extension.
 validate(result);
 cache.set(key,result);return result;
}
try{
 // Offline sources and tiny character/prop color atlases keep their original
 // format. Compress the large scanned textures on the actual runtime chunks.
 for(const name of await readdir(directory)){
  if(!/^(building-(high|low)-\d|street-baked)\.glb$/.test(name))continue;
  const file=new URL(name,directory),document=await io.read(file.pathname);
  let used=false;
  for(const texture of document.getRoot().listTextures()){
   if(texture.getMimeType()==='image/ktx2'){validate(texture.getImage());continue;}
   const size=texture.getSize();if(!size||size[0]<128||size[1]<128)continue;
   const normal=listTextureSlots(texture).includes('normalTexture');
   const bytes=await encode(texture.getImage(),{normal,srgb:getTextureColorSpace(texture)==='srgb',extension:texture.getMimeType()==='image/jpeg'?'jpg':'png'});
   texture.setImage(bytes).setMimeType('image/ktx2').setURI('');used=true;converted++;
  }
  if(used){
   document.createExtension(KHRTextureBasisu).setRequired(true);
   // NodeIO re-encodes Draco on write; retain the approved position/UV
   // precision rather than silently reverting to its lower defaults.
   document.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
    method:KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    encodeSpeed:5,decodeSpeed:5,quantizationBits:{POSITION:16,NORMAL:10,TEXCOORD:16}
   });
   await io.write(file.pathname,document);
  }
 }
 // Irradiance stays linear. Its PNG and editable Blender source remain as
 // source artifacts; the runtime loads this GPU-compressed atlas instead.
 const atlas=await encode(await readFile(new URL('lightmap.png',directory)));
 await writeFile(new URL('lightmap.ktx2',directory),atlas);
 console.log(JSON.stringify({convertedTextures:converted,uniqueEncodedImages:cache.size,atlasBytes:atlas.length}));
}finally{await rm(temp,{recursive:true,force:true});}
