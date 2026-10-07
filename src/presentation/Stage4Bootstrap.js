import {TouchControls} from '../infrastructure/input/TouchControls.js';
import {PlayCanvasProbe} from '../infrastructure/rendering/PlayCanvasProbe.js';
import {HudController} from './HudController.js?v=20261006-2';

const $=id=>document.getElementById(id);
const controls=new TouchControls({joy:$('joy'),stick:$('stick'),camPad:$('camPad'),run:$('run'),action:$('action'),shoot:$('shoot'),lock:$('lock')});
const hud=new HudController($);
const runtime=new PlayCanvasProbe($('game'),{controls,hud});
let session=null;
async function boot(){
 try{
  await runtime.init();session=await runtime.start();hud.sync(session.state);$('loading').style.display='none';
  $('play').onclick=()=>{$('intro').style.display='none';session.resetSession();hud.sync(session.state);};
  $('again').onclick=()=>{$('end').style.display='none';session.resetSession();hud.sync(session.state);};
  $('cont').onclick=()=>{$('dialog').style.display='none';};
  addEventListener('pagehide',()=>runtime.destroy(),{once:true});
 }catch(error){console.error('Stage 4 bootstrap failed',error);const loading=$('loading');loading.style.display='flex';loading.querySelector('h1').textContent='Error cargando Stage 4';loading.querySelector('p').textContent=error?.message||'No se pudo iniciar PlayCanvas.';}
}
void boot();
