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
