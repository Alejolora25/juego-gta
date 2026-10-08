import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createUrbanDistrictLayout,clearUrbanPlacement,validateUrbanDistrictLayout} from '../src/infrastructure/rendering/UrbanDistrictLayout.js';

test('all modular districts keep roads, mission approaches and arena clear',async()=>{
 const seed=JSON.parse(await readFile(new URL('../assets/pilot/layout.json',import.meta.url),'utf8')).buildings;
 const city=createUrbanDistrictLayout(seed);
 assert.ok(city.buildings.length>60);
 assert.equal(new Set(city.buildings.map(b=>b.district)).size,4);
 assert.ok(city.buildings.every(clearUrbanPlacement));
 assert.equal(validateUrbanDistrictLayout(city.buildings),true);
 assert.deepEqual(createUrbanDistrictLayout(seed),city);
});
test('unsafe placement fails before creating rendering or physics objects',()=>{
 for(const b of [{x:0,z:100},{x:86,z:28},{x:18,z:70},{x:98,z:-12},{x:0,z:-150}]){
  assert.throws(()=>validateUrbanDistrictLayout([{...b,id:'invalid',width:6,depth:8}]),/corridor/);
 }
});
