import * as pc from 'playcanvas';

const material=(diffuse,{metalness=0,gloss=.35,emissive=null,emissiveIntensity=0}={})=>{const m=new pc.StandardMaterial();m.diffuse=diffuse;m.metalness=metalness;m.gloss=gloss;m.useMetalness=true;if(emissive){m.emissive=emissive;m.emissiveIntensity=emissiveIntensity;}m.update();return m;};

export class Stage4MaterialLibrary {
 constructor(){
  this.asphalt=material(new pc.Color(.045,.052,.058),{metalness:.03,gloss:.2});
  this.concrete=material(new pc.Color(.34,.35,.36),{metalness:.02,gloss:.28});
  this.sidewalk=material(new pc.Color(.46,.45,.42),{gloss:.3});
  this.grass=material(new pc.Color(.055,.21,.075),{gloss:.16});
  this.bark=material(new pc.Color(.18,.085,.032),{gloss:.16});
  this.foliage=material(new pc.Color(.025,.25,.055),{gloss:.18});
  this.pasto=material(new pc.Color(.64,.55,.44),{gloss:.34});
  this.canal=material(new pc.Color(.075,.22,.3),{metalness:.28,gloss:.72});
  this.industrial=material(new pc.Color(.29,.32,.35),{metalness:.18,gloss:.4});
  this.mirador=material(new pc.Color(.82,.81,.75),{gloss:.38});
  this.blue=material(new pc.Color(.055,.3,.62),{metalness:.05,gloss:.5});
  this.window=material(new pc.Color(.04,.14,.22),{metalness:.42,gloss:.86,emissive:new pc.Color(.018,.07,.12),emissiveIntensity:.35});
  this.roadLine=material(new pc.Color(.92,.72,.2),{gloss:.42,emissive:new pc.Color(.12,.07,.005),emissiveIntensity:.18});
  this.firewall=material(new pc.Color(.12,.14,.18),{metalness:.62,gloss:.68});
  this.firewallGlow=material(new pc.Color(.34,.025,.018),{metalness:.18,gloss:.72,emissive:new pc.Color(1,.055,.025),emissiveIntensity:2.2});
 }
}
