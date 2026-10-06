export class Stage4SkeletalAnimation {
 constructor(entity){this.entity=entity;this.clips=[];this.current=null;this.ready=false;}
 configure(resources=[]){
  const clips=resources.filter(Boolean);if(!clips.length)return false;
  this.entity.addComponent('anim',{activate:true});
  const anim=this.entity.anim??this.entity.c?.anim??this.entity.findComponent?.('anim');
  if(!anim)return false;
  const states=[{name:'START'},...clips.map((_,i)=>({name:'clip'+i,speed:1,loop:true}))];
  anim.loadStateGraph({layers:[{name:'base',states,transitions:[{from:'START',to:'clip0'}]}],parameters:{}});
  clips.forEach((clip,i)=>anim.assignAnimation('base.clip'+i,clip.resource??clip));
  this.clips=clips.map((clip,i)=>clip.name||('clip'+i));this.ready=true;return true;
 }
 available(){return this.clips;}
 find(...patterns){for(const pattern of patterns){const rx=new RegExp(pattern,'i'),hit=this.clips.find(n=>rx.test(n));if(hit)return hit;}return this.clips[0]??null;}
 playSemantic(state){
  if(!this.ready)return false;
  const map={idle:['idle','stand'],walk:['walk'],run:['run','jog'],combat:['attack','combat','shoot'],hit:['hit','damage'],defeated:['death','die','defeat']};
  const clip=this.find(...(map[state]??[state]));if(!clip)return false;const index=Math.max(0,this.clips.indexOf(clip));
  try{const anim=this.entity.anim??this.entity.c?.anim;if(!anim?.baseLayer)return false;anim.baseLayer.transition('clip'+index,.18);this.current=clip;return true;}catch{return false;}
 }
}
