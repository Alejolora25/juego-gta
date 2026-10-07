import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';

test('Stage 4 PlayCanvas probe is isolated and WebGPU-first with WebGL2 fallback',async()=>{
 const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');
 assert.match(src,/from 'playcanvas'/);
 assert.match(src,/createGraphicsDevice/);
 assert.match(src,/deviceTypes:\['webgpu','webgl2'\]/);
 assert.match(src,/new pc\.AppBase/);
 assert.match(src,/Stage4ActorProbe/);assert.match(src,/createStage4Character/);assert.match(src,/Stage4WardenProbe/);
});
test('experimental entrypoint now boots Stage 4 while retaining rollback imports',async()=>{
 const html=await fs.readFile('index.html','utf8');
 assert.match(html,/three@0\.180\.0/);assert.match(html,/playcanvas@2\.23\.0\/build\/playcanvas\.mjs/);
 assert.match(html,/Stage4Bootstrap\.js\?v=20261006-1/);assert.doesNotMatch(html,/src=["'][^"']*GameBootstrap\.js/);
});


test('Stage 4 defines separate player and armored Warden humanoids',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4CharacterFactory.js','utf8');assert.match(src,/Pelvis/);assert.match(src,/Torso/);assert.match(src,/Head/);assert.match(src,/WardenVisor/);assert.match(src,/ArmorL/);assert.match(src,/villain/);});


test('Stage 4 environment covers PBR buildings glass and vegetation',async()=>{const [src,materials]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4Environment.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4MaterialLibrary.js','utf8')]);assert.match(src,/Stage4MaterialLibrary/);assert.match(materials,/StandardMaterial/);assert.match(materials,/metalness/);assert.match(src,/materials\.window/);assert.match(src,/addBuilding/);assert.match(src,/addTree/);});


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


test('Stage 4 locomotion preserves approved camera-relative joystick mapping',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4PlayerController.js','utf8');assert.match(src,/Math\.sin\(cameraYaw\)/);assert.match(src,/Math\.cos\(cameraYaw\)/);assert.match(src,/mx=c\*x\+s\*y/);assert.match(src,/mz=-s\*x\+c\*y/);assert.match(src,/setLocomotion/);for(const state of ["'run'","'walk'","'idle'"])assert.ok(src.includes(state));});


test('Stage 4 controls bridge reuses approved TouchControls contract',async()=>{const [bridge,touch]=await Promise.all([fs.readFile('src/infrastructure/input/Stage4ControlsBridge.js','utf8'),fs.readFile('src/infrastructure/input/TouchControls.js','utf8')]);for(const token of ['controls.move.x','controls.move.y','controls.running','controls.consumeCamera()'])assert.ok(bridge.includes(token));assert.match(bridge,/camera\.drag\(cameraDelta\)/);assert.match(touch,/this\.move\.x=dx\/max/);assert.match(touch,/this\.move\.y=dy\/max/);});


test('Stage 4 player controller supports an external Rapier movement resolver',async()=>{const src=await fs.readFile('src/infrastructure/rendering/Stage4PlayerController.js','utf8');assert.match(src,/resolveMovement=null/);assert.match(src,/this\.resolveMovement\?\./);assert.match(src,/if\(resolved\)this\.entity\.setPosition/);});


test('Stage 4 runtime keeps Rapier player and boss bodies synchronized',async()=>{const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');assert.match(src,/physics\.syncPlayer\(actorRecord\.entity\.getPosition\(\)\)/);assert.match(src,/physics\.syncBoss\(wardenRecord\.entity\.getPosition\(\)\)/);assert.match(src,/physics\.step\(dt\)/);});


test('Stage 4 objective tracker preserves approved camera-relative GPS semantics',async()=>{const {Stage4ObjectiveTracker}=await import('../src/application/usecases/Stage4ObjectiveTracker.js');const pos=(x,z)=>({getPosition:()=>({x,z})});const target={name:'Target',entity:pos(0,-10)};const tracker=new Stage4ObjectiveTracker({target:()=>target});const player=pos(0,0);const dirs=[0,Math.PI/2,Math.PI,Math.PI*1.5].map(yaw=>tracker.direction(tracker.measure(player,yaw).angle));assert.deepEqual(dirs,['↑','→','↓','←']);});


test('Stage 4 preserves approved Stage 3 movement speeds and boss camera lock height',async()=>{const [player,camera]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4PlayerController.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4ThirdPersonCamera.js','utf8')]);assert.match(player,/walkSpeed=7,runSpeed=13/);assert.match(camera,/lookAt\(a\.x\+\(b\.x-a\.x\)\*w,2\.15,a\.z\+\(b\.z-a\.z\)\*w\)/);});


test('Stage 4 city uses shared PBR materials windows vegetation and road markings',async()=>{const [world,materials]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4MaterialLibrary.js','utf8')]);assert.match(world,/Stage4MaterialLibrary/);assert.match(world,/RoadLineV/);assert.match(world,/RoadLineH/);assert.match(world,/_Windows_/);for(const token of ['asphalt','concrete','grass','bark','foliage','window','roadLine'])assert.match(materials,new RegExp('this\\.'+token));assert.match(materials,/useMetalness=true/);assert.match(materials,/emissiveIntensity/);});


test('Stage 4 asset pipeline deduplicates concurrent GLB loads and cleans failures',async()=>{const source=await fs.readFile('src/infrastructure/rendering/Stage4AssetPipeline.js','utf8');assert.match(source,/this\.pending=new Map\(\)/);assert.match(source,/if\(this\.pending\.has\(name\)\)return this\.pending\.get\(name\)/);assert.match(source,/this\.pending\.delete\(name\)/);assert.match(source,/this\.app\.assets\.remove\(asset\)/);assert.match(source,/isLoading\(name\)/);});


test('Stage 4 characters use independent role-based asset slots',async()=>{const [catalog,probe]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4AssetCatalog.js','utf8'),fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8')]);for(const role of ['player','npc','warden'])assert.match(catalog,new RegExp(role+':'));assert.match(catalog,/stage4AssetFor/);assert.match(probe,/stage4AssetFor\('player'\)/);assert.match(probe,/stage4AssetFor\('npc'\)/);assert.match(probe,/stage4AssetFor\('boss'\)/);assert.doesNotMatch(probe,/STAGE4_ASSETS\.humanoid/);});


test('Stage 4 character PBR gloss values stay normalized',async()=>{const source=await fs.readFile('src/infrastructure/rendering/Stage4CharacterProfiles.js','utf8');const values=[...source.matchAll(/gloss:(\.?\d+(?:\.\d+)?)/g)].map(m=>Number(m[1]));assert.equal(values.length,5);for(const value of values){assert.ok(value>=0&&value<=1,'gloss must stay in normalized PBR range: '+value);}});


test('Stage 4 gives Alejandro and Warden distinct original visual identities',async()=>{const [identity,system]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4CharacterIdentity.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4CharacterSystem.js','utf8')]);for(const token of ['AlejandroJacket','AlejandroTechPanel','AlejandroBackpack','WardenChestArmor','WardenShoulderL','WardenShoulderR','WardenVisor','WardenCore','AlejandroShoulderL','AlejandroShoulderR','AlejandroWristTech','WardenHelmet','WardenCrownL','WardenCrownR','WardenForearmL','WardenForearmR','WardenPowerL','WardenPowerR'])assert.match(identity,new RegExp(token));assert.match(system,/applyStage4Identity\(entity,role\)/);});


test('Stage 4 environment reuses shared PBR materials and adds lightweight facade detail',async()=>{const [env,probe]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4Environment.js','utf8'),fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8')]);assert.match(env,/Stage4MaterialLibrary/);assert.match(env,/materials\?\?new Stage4MaterialLibrary/);assert.match(env,/name\+'Base'/);assert.match(env,/name\+'Crown'/);assert.match(env,/this\.materials\.window/);assert.match(probe,/Stage4Environment\(this\.app,\{materials:world\.materials\}\)/);});


test('Stage 4 Firewall arena gains emissive identity without changing approved collision ring',async()=>{const [world,materials]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4MaterialLibrary.js','utf8')]);assert.match(world,/FirewallArenaFloor/);assert.match(world,/FirewallCap_/);assert.match(world,/FirewallGlow_/);assert.match(world,/FirewallRing_/);assert.match(world,/FirewallCore/);assert.match(world,/for\(let i=0;i<24;i\+\+\).*Math\.cos\(a\)\*31.*Math\.sin\(a\)\*31.*obstacles\.push\(\{x,z,hw:1\.1,hd:1\.1\}\)/s);assert.match(materials,/this\.firewall=/);assert.match(materials,/this\.firewallGlow=/);assert.match(materials,/emissiveIntensity:2\.2/);});


test('Stage 4 districts gain distinct accents without changing approved building footprints',async()=>{const [world,materials]=await Promise.all([fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8'),fs.readFile('src/infrastructure/rendering/Stage4MaterialLibrary.js','utf8')]);for(const token of ['pastoAccent','canalGlow','industrialSteel','miradorAccent']){assert.ok(world.includes(token));assert.ok(materials.includes('this.'+token+'='));}assert.match(world,/_Base_/);assert.match(world,/_Roof_/);assert.match(world,/obstacles\.push\(\{x,z,hw:2\.75,hd:3\.5\}\)/);for(const call of ["'Pasto',0,108","'Canales',-118,20","'Industrial',118,18","'Mirador',0,-62"])assert.ok(world.includes(call));});


test('Stage 4 vegetation uses deterministic lightweight clusters without gameplay colliders',async()=>{const world=await fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8');assert.match(world,/const trees=\[\[-34,94,1\].*\[38,-48,\.78\]\]/s);assert.match(world,/for\(const \[x,z,s\] of trees\)/);assert.match(world,/TreeTrunk/);assert.match(world,/TreeCrown/);const treeBlock=world.slice(world.indexOf('const trees='),world.indexOf('const npcs=[]'));assert.doesNotMatch(treeBlock,/obstacles\.push/);});


test('Stage 4 district wayfinding is visual-only and preserves navigation obstacles',async()=>{const world=await fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8');assert.match(world,/Pasto',-18,82,pastoAccent/);assert.match(world,/Canales',-136,48,canalGlow/);assert.match(world,/Industrial',100,48,industrialSteel/);assert.match(world,/Mirador',-18,-42,miradorAccent/);assert.match(world,/_SignPost_/);assert.match(world,/_SignHeader/);assert.match(world,/_SignMarker/);const signs=world.slice(world.indexOf('// Non-colliding district wayfinding'),world.indexOf('for(const x of [-86,0,86])for(let z=-196'));assert.doesNotMatch(signs,/obstacles\.push/);});


test('Stage 4 crosswalks remain decorative and use shared sidewalk material',async()=>{const world=await fs.readFile('src/infrastructure/rendering/Stage4WorldFactory.js','utf8');const start=world.indexOf('// Painted pedestrian crossings');const end=world.indexOf("root.addChild(box('FirewallArenaFloor'",start);assert.ok(start>=0&&end>start);const crossing=world.slice(start,end);assert.match(crossing,/CrosswalkStripe/);assert.match(crossing,/materials\.sidewalk/);assert.match(crossing,/stripe<=3/);assert.doesNotMatch(crossing,/obstacles\.push/);});


test('Stage 4 applies adaptive mobile shadow budget without hiding mission NPCs',async()=>{const src=await fs.readFile('src/infrastructure/rendering/PlayCanvasProbe.js','utf8');assert.match(src,/const baseShadow=mobile\?1024:2048/);assert.match(src,/Math\.max\(512,Math\.round\(baseShadow\*rec\.shadowScale\)\)/);assert.match(src,/lighting\.sun\.light\.shadowResolution=shadowResolution/);assert.match(src,/npcShadowLimit=Math\.floor\(npcRecords\.length\*rec\.npcScale\)/);assert.match(src,/if\(index>=npcShadowLimit\).*render\.castShadows=false/);assert.doesNotMatch(src,/npcRecords\.forEach\([^\n]*entity\.enabled=false/);});


test('Stage 4 has a production bootstrap ready for the single index entrypoint',async()=>{const src=await fs.readFile('src/presentation/Stage4Bootstrap.js','utf8');assert.match(src,/new TouchControls/);assert.match(src,/new HudController/);assert.match(src,/new PlayCanvasProbe/);assert.match(src,/await runtime\.init\(\)/);assert.match(src,/await runtime\.start\(\)/);assert.match(src,/session\.resetSession\(\)/);assert.match(src,/runtime\.destroy\(\)/);});
