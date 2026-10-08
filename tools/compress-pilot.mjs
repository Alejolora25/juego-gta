import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression} from '@gltf-transform/extensions';
import {draco,dedup} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import {readdir,stat,copyFile,mkdir} from 'node:fs/promises';

const directory=new URL('../assets/pilot/',import.meta.url);
const vendor=new URL('../assets/vendor/draco/',import.meta.url);
await mkdir(vendor,{recursive:true});
await copyFile(new URL('../node_modules/draco3dgltf/draco_decoder_gltf_nodejs.js',import.meta.url),new URL('decoder.js',vendor));
await copyFile(new URL('../node_modules/draco3dgltf/draco_decoder_gltf.wasm',import.meta.url),new URL('decoder.wasm',vendor));
const io=new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
 'draco3d.encoder':await draco3d.createEncoderModule(),
 'draco3d.decoder':await draco3d.createDecoderModule()
});
let before=0,after=0;
for(const name of await readdir(directory)){
 if(!name.endsWith('.glb')||['street-pilot.glb','brick-shop.glb','plaster-apartments.glb'].includes(name))continue;
 const file=new URL(name,directory);before+=(await stat(file)).size;
 const document=await io.read(file.pathname);
 await document.transform(dedup(),draco({method:'edgebreaker',quantizePosition:16,quantizeNormal:10,quantizeTexcoord:16}));
 await io.write(file.pathname,document);after+=(await stat(file)).size;
}
console.log(JSON.stringify({geometryBefore:before,geometryAfter:after,savedPercent:Math.round((1-after/before)*100)}));
