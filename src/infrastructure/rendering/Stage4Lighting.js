import * as pc from 'playcanvas';

export function configureStage4Lighting(app,{mobile=false}={}){
 app.scene.ambientLight=new pc.Color(.24,.28,.34);
 app.scene.skyboxMip=mobile?2:1;
 app.scene.exposure=mobile?1.14:1.24;
 app.scene.toneMapping=pc.TONEMAP_ACES;
 app.scene.fog.type=pc.FOG_EXP2;
 app.scene.fogColor=new pc.Color(.13,.24,.34);
 app.scene.fogDensity=mobile?.0038:.0031;
 const sun=new pc.Entity('Stage4Sun');sun.addComponent('light',{type:'directional',color:new pc.Color(1,.82,.58),intensity:mobile?2.05:2.55,castShadows:false,shadowBias:.13,normalOffsetBias:.055,shadowDistance:mobile?62:128,shadowResolution:mobile?1024:2048});sun.setEulerAngles(46,-34,0);app.root.addChild(sun);
 const fill=new pc.Entity('Stage4SkyFill');fill.addComponent('light',{type:'directional',color:new pc.Color(.36,.52,.82),intensity:.52,castShadows:false});fill.setEulerAngles(-26,145,0);app.root.addChild(fill);
 const rim=new pc.Entity('Stage4WarmRim');rim.addComponent('light',{type:'directional',color:new pc.Color(1,.38,.2),intensity:mobile?.22:.32,castShadows:false});rim.setEulerAngles(12,118,0);app.root.addChild(rim);
 return {sun,fill,rim,profile:mobile?'mobile':'high'};
}

export function createStage4Sky(app){
 const dome=new pc.Entity('Stage4SkyDome');const m=new pc.StandardMaterial();m.diffuse=new pc.Color(.16,.36,.62);m.emissive=new pc.Color(.07,.19,.38);m.emissiveIntensity=.72;m.cull=pc.CULLFACE_FRONT;m.useLighting=false;m.update();dome.addComponent('render',{type:'sphere',material:m});dome.setLocalScale(1200,800,1200);app.root.addChild(dome);
 const horizon=new pc.Entity('Stage4HorizonGlow');const glow=new pc.StandardMaterial();glow.diffuse=new pc.Color(.92,.38,.18);glow.emissive=new pc.Color(.55,.16,.08);glow.emissiveIntensity=.62;glow.useLighting=false;glow.cull=pc.CULLFACE_NONE;glow.update();horizon.addComponent('render',{type:'cylinder',material:glow});horizon.setPosition(0,18,0);horizon.setLocalScale(620,.18,620);app.root.addChild(horizon);
 return dome;
}
