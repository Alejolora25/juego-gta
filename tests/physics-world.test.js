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
 assert.match(physics,/addPlayer/);assert.match(physics,/addBoss/);assert.match(physics,/syncBoss/);assert.match(physics,/bossCanMoveTo/);assert.match(physics,/playerBossOverlap/);assert.match(physics,/projectileBlocked/);assert.match(physics,/projectileHitsTarget/);
 assert.match(physics,/addObstacle/);
 assert.match(physics,/canMoveTo/);assert.match(physics,/resolveMovement/);assert.match(physics,/blocked\(x,current\.z\)/);assert.match(physics,/blocked\(current\.x,z\)/);
});

test('stage 3 attaches Rapier after gameplay startup without blocking play',async()=>{
 const boot=await read('src/presentation/GameBootstrap.js');
 assert.match(boot,/new PhysicsWorld\(\)/);
 assert.match(boot,/async function ensurePhysics/);
 assert.match(boot,/physics\.addFloor\(420\)/);
 assert.match(boot,/physics\.addPlayer\(world\.player\.position\)/);assert.match(boot,/physics\.addBoss\(world\.boss\.position\)/);assert.match(boot,/physics\.syncBoss\(world\.boss\.position\)/);assert.match(boot,/physics\.bossCanMoveTo/);assert.match(boot,/physics\.playerBossOverlap/);assert.match(boot,/physics\.projectileBlocked/);assert.match(boot,/physics\.projectileHitsTarget/);
 assert.match(boot,/physics\.addObstacles\(world\.obstacles\)/);
 assert.match(boot,/physics\.resolveMovement/);
 assert.match(boot,/resolved===null/);assert.match(boot,/collide\(nx,nz\)/);
 assert.match(boot,/running=true;last=performance\.now\(\);raf=requestAnimationFrame\(loop\);void ensurePhysics\(\)/);
 assert.match(boot,/\$\('play'\)\.onclick=start/);
 assert.match(boot,/catch\(error\).*Rapier no disponible/s);
});

test('projectiles are removed when Rapier cover blocks their path',async()=>{const boot=await read('src/presentation/GameBootstrap.js');assert.match(boot,/const coverHit=physics\.projectileBlocked\(s\.m\.position\)/);assert.match(boot,/if\(coverHit===true\)\{scene\.remove\(s\.m\);arr\.splice\(i,1\);continue\}/);});

test('player and boss projectile impacts use physics with stable fallback',async()=>{const boot=await read('src/presentation/GameBootstrap.js');assert.match(boot,/physics\.projectileHitsTarget/);assert.match(boot,/\?\?s\.m\.position\.distanceTo/);});
