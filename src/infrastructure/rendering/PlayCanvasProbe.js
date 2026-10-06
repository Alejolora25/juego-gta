import * as pc from 'playcanvas';

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
  const actor=new pc.Entity('Stage4ActorProbe');actor.addComponent('render',{type:'capsule'});actor.setLocalScale(.8,1.8,.8);this.app.root.addChild(actor);
  this.app.start();return {backend:this.backend,actor};
 }
 destroy(){this.app?.destroy();this.app=null;}
}
