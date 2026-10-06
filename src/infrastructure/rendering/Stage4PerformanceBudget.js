export class Stage4PerformanceBudget {
 constructor({mobile=false}={}){this.mobile=mobile;this.targetFps=mobile?45:60;this.maxDynamicNpcs=mobile?10:24;this.maxShadowCasters=mobile?8:20;this.textureTier=mobile?'medium':'high';this.samples=[];}
 frame(dt){if(dt>0&&dt<1)this.samples.push(1/dt);if(this.samples.length>90)this.samples.shift();return this.averageFps();}
 averageFps(){return this.samples.length?this.samples.reduce((a,b)=>a+b,0)/this.samples.length:this.targetFps;}
 pressure(){const fps=this.averageFps();return fps<this.targetFps*.7?'high':fps<this.targetFps*.9?'medium':'normal';}
 recommendations(){const p=this.pressure();return {pressure:p,shadowScale:p==='high'?.5:p==='medium'?.75:1,npcScale:p==='high'?.55:p==='medium'?.8:1};}
}
