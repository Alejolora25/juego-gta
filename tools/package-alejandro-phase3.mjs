// Package the derived character; never modify the verified Quaternius sources.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {NodeIO} from '@gltf-transform/core';
import {resample,dedup} from '@gltf-transform/functions';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const variant=process.env.LORA25_ALEJANDRO_VARIANT??'alejandro-phase3';
if(!['alejandro-phase3','alejandro-explorer'].includes(variant))throw new Error('Unsupported isolated character variant');
const dir=path.join(root,'assets/characters',variant);
const filename=path.join(dir,'alejandro.glb');
const io=new NodeIO(),document=await io.read(filename);
const before=(await fs.stat(filename)).size;
await document.transform(resample({tolerance:1e-6}),dedup());
for(const texture of document.getRoot().listTextures()){
 const name=texture.getName();
 let encoder=sharp(texture.getImage());
 if(/Normal/i.test(name))encoder=encoder.resize(512,512).removeAlpha().png({compressionLevel:9});
 else if(/Roughness/i.test(name))encoder=encoder.resize(256,256).removeAlpha().jpeg({quality:93});
 else if(!/Fabric/i.test(name))encoder=encoder.removeAlpha().jpeg({quality:94});
 else continue;
 texture.setImage(new Uint8Array(await encoder.toBuffer()));
 texture.setMimeType(/Normal/i.test(name)?'image/png':'image/jpeg');
}
await io.write(filename,document);
let triangles=0;
for(const mesh of document.getRoot().listMeshes())for(const p of mesh.listPrimitives())triangles+=p.getIndices().getCount()/3;
const report={beforeBytes:before,afterBytes:(await fs.stat(filename)).size,triangles,
 materials:document.getRoot().listMaterials().length,
 joints:document.getRoot().listSkins()[0].listJoints().length,
 clips:document.getRoot().listAnimations().map(a=>a.getName()),
 textures:await Promise.all(document.getRoot().listTextures().map(async t=>({name:t.getName(),mimeType:t.getMimeType(),bytes:t.getImage().length,...await sharp(t.getImage()).metadata().then(m=>({width:m.width,height:m.height}))}))),
 originalsModified:false,authoringBlendModified:false,gameplayChanged:false};
await fs.writeFile(path.join(dir,'package-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
