export class Stage4BossEncounter {
 constructor(state,combat,{activationRange=22}={}){this.state=state;this.combat=combat;this.activationRange=activationRange;this.locked=false;}
 distance(player,boss){const a=player.getPosition(),b=boss.getPosition();return Math.hypot(a.x-b.x,a.z-b.z);}
 update(player,boss,dt=0){this.combat.update(dt);const distance=this.distance(player,boss);if(this.state.stage===3&&!this.state.bossActive&&distance<this.activationRange){this.state.startBoss();this.locked=true;return {started:true,distance,locked:true};}return {started:false,distance,locked:this.locked};}
 setLock(locked){this.locked=!!locked;return this.locked;}
 manualCamera(delta){if(this.locked&&this.state.bossActive&&Math.abs(delta)>1){this.locked=false;return true;}return false;}
}
