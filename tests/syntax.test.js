import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync=promisify(execFile);
const modules=[
 'src/presentation/GameBootstrap.js',
 'src/presentation/HudController.js',
 'src/infrastructure/rendering/WorldFactory.js',
 'src/infrastructure/rendering/VisualProfile.js',
 'src/infrastructure/input/TouchControls.js',
 'src/infrastructure/physics/PhysicsWorld.js',
 'src/domain/entities/GameState.js',
 'src/application/usecases/CombatService.js'
];

test('every JavaScript game module passes the Node syntax parser',async()=>{
 for(const file of modules){
  const {stderr}=await execFileAsync(process.execPath,['--check',file]);
  assert.equal(stderr,'',file+' must parse without syntax errors');
 }
});
