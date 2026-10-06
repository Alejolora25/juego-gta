import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';

test('Stage 4 PlayCanvas probe is isolated and WebGPU-first with WebGL2 fallback',async()=>{
 const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');
 assert.match(src,/from 'playcanvas'/);
 assert.match(src,/createGraphicsDevice/);
 assert.match(src,/deviceTypes:\['webgpu','webgl2'\]/);
 assert.match(src,/new pc\.AppBase/);
 assert.match(src,/Stage4ActorProbe/);assert.match(src,/createStage4Character/);assert.match(src,/Stage4WardenProbe/);
});
test('stable Three.js entrypoint is untouched during engine spike',async()=>{
 const html=await fs.readFile('index.html','utf8');
 assert.match(html,/three@0\.180\.0/);assert.match(html,/playcanvas@2\.23\.0\/build\/playcanvas\.mjs/);
 assert.match(html,/GameBootstrap\.js\?v=20261006-3/);
});


test('Stage 4 defines separate player and armored Warden humanoids',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4CharacterFactory.js','utf8');assert.match(src,/Pelvis/);assert.match(src,/Torso/);assert.match(src,/Head/);assert.match(src,/WardenVisor/);assert.match(src,/ArmorL/);assert.match(src,/villain/);});


test('Stage 4 environment covers PBR buildings glass and vegetation',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4Environment.js','utf8');assert.match(src,/StandardMaterial/);assert.match(src,/metalness/);assert.match(src,/glass/);assert.match(src,/addBuilding/);assert.match(src,/addTree/);});
