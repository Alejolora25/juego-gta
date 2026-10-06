import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('Rapier infrastructure is isolated and explicitly initialized',async()=>{
 const physics=await read('src/infrastructure/physics/PhysicsWorld.js');
 assert.match(physics,/rapier3d-compat@0\.19\.3/);
 assert.match(physics,/await RAPIER\.init\(\)/);
 assert.match(physics,/new RAPIER\.World/);
 assert.match(physics,/addFloor/);
 assert.match(physics,/addPlayer/);
 assert.match(physics,/addObstacle/);
});

test('stage 3 attaches Rapier after gameplay startup without blocking play',async()=>{
 const boot=await read('src/presentation/GameBootstrap.js');
 assert.match(boot,/new PhysicsWorld\(\)/);
 assert.match(boot,/async function ensurePhysics/);
 assert.match(boot,/physics\.addFloor\(420\)/);
 assert.match(boot,/physics\.addPlayer\(world\.player\.position\)/);
 assert.match(boot,/physics\.addObstacles\(world\.obstacles\)/);
 assert.match(boot,/running=true;last=performance\.now\(\);raf=requestAnimationFrame\(loop\);void ensurePhysics\(\)/);
 assert.match(boot,/\$\('play'\)\.onclick=start/);
 assert.match(boot,/catch\(error\).*Rapier no disponible/s);
});
