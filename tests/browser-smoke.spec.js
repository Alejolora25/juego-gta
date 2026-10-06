import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';

let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,800));});
test.afterAll(()=>server?.kill());

test('game loads and starts in a real browser without engine errors',async({page})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await expect(page.locator('#play')).toBeVisible();
 await page.locator('#play').click();
 await expect(page.locator('#intro')).toBeHidden();
 await page.waitForTimeout(700);
 await expect(page.locator('#loading')).toBeHidden();
 expect(errors).toEqual([]);
 await expect(page.locator('#targetName')).toContainText('Juan');
});


test('stage 3 physics loads without blocking gameplay',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('#play').click();await page.waitForTimeout(1800);await expect(page.locator('#intro')).toBeHidden();await expect(page.locator('#loading')).toBeHidden();expect(errors).toEqual([]);const physicsLoaded=await page.evaluate(async()=>{const m=await import('./src/infrastructure/physics/PhysicsWorld.js?v=stage3-final');const p=new m.PhysicsWorld();try{await p.init();p.addFloor(20);p.addPlayer({x:0,y:0,z:0});p.addBoss({x:4,y:0,z:0});p.addObstacle({x:2,z:0,hw:.5,hd:2},3);return p.ready&&p.projectileBlocked({x:2,z:0})===true&&p.playerBossOverlap({x:0,z:0},{x:0,z:0})===true}catch(e){return false}});expect(physicsLoaded).toBe(true);});
