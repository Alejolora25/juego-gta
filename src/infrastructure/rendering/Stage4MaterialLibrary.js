import * as pc from 'playcanvas';

const material=(diffuse,{metalness=0,gloss=.35,emissive=null,emissiveIntensity=0}={})=>{const m=new pc.StandardMaterial();m.diffuse=diffuse;m.metalness=metalness;m.gloss=gloss;m.useMetalness=true;m.useFog=true;if(emissive){m.emissive=emissive;m.emissiveIntensity=emissiveIntensity;}m.update();return m;};

export class Stage4MaterialLibrary {
 constructor(){
  this.asphalt=material(new pc.Color(.035,.039,.044),{metalness:.04,gloss:.28});
  this.concrete=material(new pc.Color(.4,.41,.4),{metalness:.02,gloss:.34});
  this.sidewalk=material(new pc.Color(.52,.5,.46),{gloss:.38});
  this.grass=material(new pc.Color(.06,.24,.105),{gloss:.18});
  this.bark=material(new pc.Color(.2,.095,.038),{gloss:.18});
  this.foliage=material(new pc.Color(.04,.31,.08),{gloss:.22});
  this.pasto=material(new pc.Color(.68,.56,.43),{gloss:.4});
  this.canal=material(new pc.Color(.055,.24,.34),{metalness:.32,gloss:.78});
  this.industrial=material(new pc.Color(.28,.33,.37),{metalness:.22,gloss:.48});
  this.mirador=material(new pc.Color(.88,.86,.78),{gloss:.44});
  this.blue=material(new pc.Color(.055,.3,.62),{metalness:.05,gloss:.5});
  this.window=material(new pc.Color(.035,.13,.2),{metalness:.46,gloss:.92,emissive:new pc.Color(.025,.09,.15),emissiveIntensity:.55});
  this.roadLine=material(new pc.Color(.92,.72,.2),{gloss:.42,emissive:new pc.Color(.12,.07,.005),emissiveIntensity:.18});
  this.firewall=material(new pc.Color(.12,.14,.18),{metalness:.62,gloss:.68});
  this.firewallGlow=material(new pc.Color(.34,.025,.018),{metalness:.18,gloss:.72,emissive:new pc.Color(1,.055,.025),emissiveIntensity:2.2});
  this.pastoAccent=material(new pc.Color(.52,.16,.075),{metalness:.04,gloss:.4});
  this.canalGlow=material(new pc.Color(.025,.28,.48),{metalness:.28,gloss:.78,emissive:new pc.Color(.015,.18,.42),emissiveIntensity:.8});
  this.industrialSteel=material(new pc.Color(.16,.18,.21),{metalness:.72,gloss:.58});
  this.miradorAccent=material(new pc.Color(.93,.91,.82),{metalness:.02,gloss:.48});
 }
}
