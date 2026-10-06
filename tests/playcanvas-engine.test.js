import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';

test('Stage 4 PlayCanvas probe is isolated and WebGPU-first with WebGL2 fallback',async()=>{
 const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');
 assert.match(src,/from 'playcanvas'/);
 assert.match(src,/createGraphicsDevice/);
 assert.match(src,/deviceTypes:\['webgpu','webgl2'\]/);
 assert.match(src,/new pc\.AppBase/);
 assert.match(src,/Stage4ActorProbe/);
});
test('stable Three.js entrypoint is untouched during engine spike',async()=>{
 const html=await fs.readFile('index.html','utf8');
 assert.match(html,/three@0\.180\.0/);
 assert.match(html,/GameBootstrap\.js\?v=20261006-3/);
});
