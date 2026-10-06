import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('index exposes every DOM dependency required by the game', async () => {
  const html = await read('index.html');
  const required = ['game','xp','hp','mt','guide','arrow','distance','bossHud','bossFill','camPad','joy','stick','action','lock','shoot','run','intro','loading','dialog','who','speech','cont','end','endTitle','endText','again','play' ,'targetName'];
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

test('adaptive renderer uses the visual profile without changing gameplay', async () => {
  const bootstrap = await read('src/presentation/GameBootstrap.js');
  assert.match(bootstrap, /selectVisualProfile/);
  assert.match(bootstrap, /visualProfile\.pixelRatio/);
  assert.match(bootstrap, /visualProfile\.shadowMapSize/);
  assert.match(bootstrap, /visualProfile\.shadowRadius/);
  assert.match(bootstrap, /visualProfile\.exposure/);
  assert.match(bootstrap, /visualProfile\.fogDensity/);
  assert.match(bootstrap, /THREE\.ACESFilmicToneMapping/);
  assert.match(bootstrap, /THREE\.SRGBColorSpace/);
});

test('visual stage keeps the existing world contract and current map', async () => {
  const world = await read('src/infrastructure/rendering/WorldFactory.js');
  assert.match(world, /return\{player,limbs,npcs,boss,obstacles,mat(?:,sectors)?\}/);
  assert.match(world, /player\.position\.set\(0,0,(?:120|108)\)/);
  assert.match(world, /boss\.position\.set\(0,0,-(?:112|150)\)/);
  assert.match(world, /MeshStandardMaterial/);
  assert.match(world, /MeshPhysicalMaterial/);
  assert.match(world, /CanvasTexture/);
  assert.match(world, /SRGBColorSpace/);
  assert.match(world, /toneMapped:false/);
});


test('startup failures are visible instead of leaving a dead play button', async () => {
  const html = await read('index.html');
  assert.match(html, /addEventListener\(["']error["']/);
  assert.match(html, /addEventListener\(["']unhandledrejection["']/);
  assert.match(html, /Error cargando motor/);
  assert.match(html, /getElementById\(["']loading["']\)/);
});


test('stage 2 map exposes Pasto and Europe districts without Rapier', async () => {
  const world = await read('src/infrastructure/rendering/WorldFactory.js');
  const boot = await read('src/presentation/GameBootstrap.js');
  assert.match(world, /Pasto Centro/);
  assert.match(world, /Canales/);
  assert.match(world, /Distrito Industrial/);
  assert.match(world, /Mirador Blanco/);
  assert.match(world, /Arena Firewall/);
  assert.match(world, /return\{player,limbs,npcs,boss,obstacles,mat,sectors\}/);
  assert.match(boot, /Math\.abs\(x\)>185/);
  assert.doesNotMatch(world, /Rapier|RAPIER/);
});

test('objective GPS uses camera-relative forward bearing',async()=>{const boot=await read('src/presentation/GameBootstrap.js');assert.match(boot,/camera\.getWorldDirection\(cameraDirection\)/);assert.match(boot,/cameraDirection\.y=0/);assert.match(boot,/dot=THREE\.MathUtils\.clamp/);assert.match(boot,/cross=cameraDirection\.z\*targetX-cameraDirection\.x\*targetZ/);assert.match(boot,/objectiveAngle=Math\.atan2\(cross,dot\)/);assert.match(boot,/hud\.objective/);});
test('mission NPCs remain outside their landmark building footprints',async()=>{const world=await read('src/infrastructure/rendering/WorldFactory.js');assert.match(world,/npc\(-28,74,'Juan · DevOps'/);assert.match(world,/npc\(98,6,'Sara · Backend'/);assert.match(world,/npc\(-108,54,'David · Lab'/);});

test('mobile deployment cache-busts the bootstrap and physics module',async()=>{const html=await read('index.html');const boot=await read('src/presentation/GameBootstrap.js');assert.match(html,/GameBootstrap\.js\?v=20261006-3/);assert.match(boot,/PhysicsWorld\.js\?v=20261006-1/);});

test('GPS arrow maps camera-forward bearing to visual up and compass clutter is removed',async()=>{const html=await read('index.html');const hud=await read('src/presentation/HudController.js');assert.doesNotMatch(html,/id=["']compass["']/);assert.doesNotMatch(html,/id=["']heading["']/);assert.match(hud,/Math\.abs\(angle\)<\.12\?0:angle/);assert.match(hud,/aligned-Math\.PI\/2/);});


test('GPS signed angle is zero whenever camera and objective face the same direction',()=>{const angle=(fx,fz,tx,tz)=>Math.atan2(fz*tx-fx*tz,fx*tx+fz*tz);for(const [x,z] of [[0,-1],[0,1],[1,0],[-1,0],[Math.SQRT1_2,-Math.SQRT1_2]])assert.ok(Math.abs(angle(x,z,x,z))<1e-12);});


test('public entrypoint cache-busts the signed-angle GPS build',async()=>{const html=await read('index.html');assert.match(html,/GameBootstrap\.js\?v=20261006-3/g);});
