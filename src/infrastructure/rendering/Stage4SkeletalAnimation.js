export class Stage4SkeletalAnimation {
 constructor(entity){this.entity=entity;this.clips=[];this.current=null;}
 discover(){
  const animations=[];
  const visit=e=>{if(e.anim?.baseLayer?.states)animations.push(...e.anim.baseLayer.states.map(s=>s.name));for(const child of e.children??[])visit(child);};
  visit(this.entity);this.clips=[...new Set(animations.filter(Boolean))];return this.clips;
 }
 available(){return this.clips.length?this.clips:this.discover();}
 find(...patterns){const clips=this.available();for(const pattern of patterns){const rx=new RegExp(pattern,'i'),hit=clips.find(n=>rx.test(n));if(hit)return hit;}return null;}
 playSemantic(state){
  const map={idle:['idle','stand'],walk:['walk'],run:['run','jog'],combat:['attack','combat','shoot'],hit:['hit','damage'],defeated:['death','die','defeat']};
  const clip=this.find(...(map[state]??[state]));if(!clip)return false;
  const target=this.findAnimEntity(this.entity);if(!target?.anim?.baseLayer)return false;
  try{target.anim.baseLayer.transition(clip,.18);this.current=clip;return true;}catch{return false;}
 }
 findAnimEntity(entity){if(entity.anim?.baseLayer)return entity;for(const child of entity.children??[]){const hit=this.findAnimEntity(child);if(hit)return hit;}return null;}
}
