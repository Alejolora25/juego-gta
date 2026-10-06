import * as pc from 'playcanvas';\nimport {createStage4Character} from './Stage4CharacterFactory.js';

export class PlayCanvasProbe {
 constructor(canvas){this.canvas=canvas;this.app=null;this.backend='uninitialized';}
 async init(){
  const device=await pc.createGraphicsDevice(this.canvas,{deviceTypes:['webgpu','webgl2'],antialias:true,alpha:false,powerPreference:'high-performance'});
  this.backend=device.isWebGPU?'webgpu':'webgl2';
  this.app=new pc.AppBase(this.canvas);
  this.app.init({graphicsDevice:device,componentSystems:[pc.RenderComponentSystem,pc.CameraComponentSystem,pc.LightComponentSystem],resourceHandlers:[pc.TextureHandler,pc.ContainerHandler]});
  this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
  return this;
 }
 start(){
  if(!this.app)throw new Error('PlayCanvasProbe.init() must complete before start()');
  const camera=new pc.Entity('Stage4Camera');camera.addComponent('camera',{clearColor:new pc.Color(.055,.085,.12)});camera.setPosition(0,2.2,5);this.app.root.addChild(camera);
  const light=new pc.Entity('Stage4Light');light.addComponent('light',{type:'directional',intensity:2,castShadows:true});light.setEulerAngles(45,35,0);this.app.root.addChild(light);
  const actor=createStage4Character({name:'Stage4ActorProbe'});this.app.root.addChild(actor);\n  const warden=createStage4Character({name:'Stage4WardenProbe',villain:true});warden.setPosition(2.2,0,-1.2);this.app.root.addChild(warden);
  this.app.start();return {backend:this.backend,actor,warden};
 }
 destroy(){this.app?.destroy();this.app=null;}
}
