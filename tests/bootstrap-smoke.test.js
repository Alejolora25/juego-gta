import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('index exposes every DOM dependency required by the game', async () => {
  const html = await read('index.html');
  const required = ['game','xp','hp','mt','guide','arrow','distance','bossHud','bossFill','camPad','joy','stick','action','lock','shoot','run','intro','loading','dialog','who','speech','cont','end','endTitle','endText','again','play'];
  for (const id of required) assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
});

test('index loads the modular bootstrap and Three.js import map', async () => {
  const html = await read('index.html');
  assert.match(html, /type=["']module["'][^>]+GameBootstrap\.js/);
  assert.match(html, /type=["']importmap["']/);
  assert.match(html, /three@0\.180\.0/);
});

test('bootstrap keeps the critical play-button startup path', async () => {
  const js = await read('src/presentation/GameBootstrap.js');
  assert.match(js, /function start\(\)/);
  assert.match(js, /\$\(['"]play['"]\)\.onclick=start/);
  assert.match(js, /\$\(['"]intro['"]\)\.style\.display=['"]none['"]/);
  assert.match(js, /requestAnimationFrame\(loop\)/);
  assert.match(js, /createWorld\(THREE,scene\)/);
});

test('approved joystick and camera mapping are protected', async () => {
  const controls = await read('src/infrastructure/input/TouchControls.js');
  const bootstrap = await read('src/presentation/GameBootstrap.js');
  assert.match(controls, /this\.move\.x=dx\/max;this\.move\.y=dy\/max/);
  assert.match(bootstrap, /addScaledVector\(right,controls\.move\.x\)\.addScaledVector\(forward,-controls\.move\.y\)/);
  assert.match(bootstrap, /cameraYaw-=manualCam\*\.008/);
});

test('boss lock-on remains wired through HTML, controls, HUD and bootstrap', async () => {
  const html = await read('index.html');
  const controls = await read('src/infrastructure/input/TouchControls.js');
  const hud = await read('src/presentation/HudController.js');
  const bootstrap = await read('src/presentation/GameBootstrap.js');
  assert.match(html, /id=["']lock["']/);
  assert.match(controls, /this\.onLock/);
  assert.match(hud, /this\.\$\(['"]lock['"]\)/);
  assert.match(bootstrap, /controls\.onLock=locked=>combatLock=locked/);
});
