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


test('Stage 4 lighting uses ACES, shadows, sky and mobile quality profile',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4Lighting.js','utf8');assert.match(src,/TONEMAP_ACES/);assert.match(src,/castShadows:true/);assert.match(src,/shadowResolution:mobile\?1024:2048/);assert.match(src,/Stage4SkyDome/);assert.match(src,/profile:mobile\?'mobile':'high'/);});


test('Stage 4 asset pipeline loads and instantiates GLB containers',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4AssetPipeline.js','utf8');assert.match(src,/new pc\.Asset\(name,'container'/);assert.match(src,/instantiateRenderEntity/);assert.match(src,/loadAndInstantiate/);});

test('Stage 4 humanoid animation contract covers locomotion and combat',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4AnimationController.js','utf8');for(const state of ['idle','walk','run','combat','hit','defeated'])assert.match(src,new RegExp(state));assert.match(src,/addComponent\('anim'/);});


test('Stage 4 protects mobile performance with LOD and adaptive budgets',async()=>{const [lod,budget]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4LodManager.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4PerformanceBudget.js','utf8')]);assert.match(lod,/high.*medium.*low.*culled/s);assert.match(lod,/castShadows/);assert.match(budget,/targetFps=mobile\?45:60/);assert.match(budget,/maxDynamicNpcs=mobile\?10:24/);assert.match(budget,/pressure/);});


test('Stage 4 character system upgrades GLB actors without losing safe fallbacks',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4CharacterSystem.js','utf8');assert.match(src,/loadAndInstantiate/);assert.match(src,/createStage4Character/);assert.match(src,/role==='boss'/);assert.match(src,/Stage4AnimationController/);assert.match(src,/source='glb'/);assert.match(src,/source='procedural'/);});


test('Stage 4 GLB cast is governed by mobile-aware LOD and frame budget',async()=>{const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');assert.match(src,/new Stage4LodManager/);assert.match(src,/new Stage4PerformanceBudget/);assert.match(src,/performance\.frame\(dt\)/);assert.match(src,/lod\.update\(camera\.getPosition\(\),dynamicEntities\)/);});


test('Stage 4 bridges gameplay semantics to skeletal GLB clips',async()=>{const [skeletal,characters]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4SkeletalAnimation.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4CharacterSystem.js','utf8')]);assert.match(skeletal,/idle.*walk.*run.*combat.*hit.*defeated/s);assert.match(skeletal,/baseLayer\.transition/);assert.match(characters,/skeletal\.playSemantic\(state\)/);});


test('Stage 4 world does not duplicate procedural NPCs beside GLB cast',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8');assert.doesNotMatch(src,/createStage4Character/);assert.match(src,/const npcs=\[\]/);});


test('Stage 4 registers PlayCanvas animation system before spawning GLB actors',async()=>{const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');assert.match(src,/pc\.AnimComponentSystem/);});


test('Stage 4 preserves approved Stage 2 city geometry and sectors',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8');assert.match(src,/\[420,.5,420\]/);assert.match(src,/\[-86,0,86\]/);assert.match(src,/\[-138,-70,0,70,138\]/);for(const name of ['Pasto Centro','Canales','Distrito Industrial','Mirador Blanco','Arena Firewall'])assert.match(src,new RegExp(name));assert.match(src,/i<24/);assert.match(src,/Math\.cos\(a\)\*31/);});


test('Stage 4 cast preserves approved Stage 2 gameplay coordinates',async()=>{const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');for(const position of ['[0,0,108]','[-28,0,74]','[98,0,6]','[-108,0,54]','[0,0,-150]'])assert.ok(src.includes(position),'missing '+position);});


test('Stage 4 third-person camera preserves approved camera contract',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4ThirdPersonCamera.js','utf8');assert.match(src,/height=5\.4/);assert.match(src,/distance=8\.5/);assert.match(src,/targetHeight=2\.2/);assert.match(src,/deltaX\*\.008/);assert.match(src,/Math\.pow\(this\.smoothing/);});
