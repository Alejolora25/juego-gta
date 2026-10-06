import * as pc from 'playcanvas';

export function configureStage4Lighting(app,{mobile=false}={}){
 app.scene.ambientLight=new pc.Color(.18,.22,.3);
 app.scene.skyboxMip=mobile?2:1;
 app.scene.exposure=mobile?1.08:1.18;
 app.scene.toneMapping=pc.TONEMAP_ACES;
 const sun=new pc.Entity('Stage4Sun');sun.addComponent('light',{type:'directional',color:new pc.Color(1,.86,.68),intensity:mobile?1.65:2.15,castShadows:true,shadowBias:.18,normalOffsetBias:.04,shadowDistance:mobile?55:110,shadowResolution:mobile?1024:2048});sun.setEulerAngles(48,-32,0);app.root.addChild(sun);
 const fill=new pc.Entity('Stage4SkyFill');fill.addComponent('light',{type:'directional',color:new pc.Color(.28,.42,.7),intensity:.38,castShadows:false});fill.setEulerAngles(-28,145,0);app.root.addChild(fill);
 return {sun,fill,profile:mobile?'mobile':'high'};
}

export function createStage4Sky(app){
 const dome=new pc.Entity('Stage4SkyDome');const m=new pc.StandardMaterial();m.diffuse=new pc.Color(.18,.42,.7);m.emissive=new pc.Color(.08,.2,.42);m.emissiveIntensity=.45;m.cull=pc.CULLFACE_FRONT;m.update();dome.addComponent('render',{type:'sphere',material:m});dome.setLocalScale(260,180,260);app.root.addChild(dome);return dome;
}
