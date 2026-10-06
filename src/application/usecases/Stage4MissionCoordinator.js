export class Stage4MissionCoordinator {
 constructor(state,characters,{range=4}={}){this.state=state;this.characters=characters;this.range=range;this.sequence=['stage4-juan','stage4-sara','stage4-david'];}
 target(){return this.state.stage<3?this.characters.get(this.sequence[this.state.stage]):this.characters.get('stage4-warden');}
 distance(player,target=this.target()?.entity){if(!target)return Infinity;const a=player.getPosition(),b=target.getPosition();return Math.hypot(a.x-b.x,a.z-b.z);}
 interact(player){if(this.state.bossActive||this.state.stage>=3)return {completed:false,reason:'boss'};const character=this.target();if(!character)return {completed:false,reason:'missing'};const distance=this.distance(player,character.entity);if(distance>=this.range)return {completed:false,reason:'range',distance};const stage=this.state.stage;this.state.completeObjective();return {completed:true,stage,nextStage:this.state.stage,xp:this.state.xp,character:character.name};}
 bossReady(player,{range=22}={}){return this.state.stage===3&&!this.state.bossActive&&this.distance(player,this.characters.get('stage4-warden')?.entity)<range;}
}
