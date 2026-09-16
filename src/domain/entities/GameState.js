export class GameState {
  constructor(){ this.reset(); }
  reset(){ this.stage=0;this.xp=0;this.playerHP=3;this.bossHP=100;this.bossActive=false;this.finished=false; }
  completeObjective(){ if(this.stage<3){this.stage++;this.xp+=100;} }
  startBoss(){ if(this.stage===3)this.bossActive=true; }
  damageBoss(amount){ if(!this.bossActive)return false;this.bossHP=Math.max(0,this.bossHP-amount);if(this.bossHP===0){this.xp+=500;this.finished=true;}return this.bossHP===0; }
  damagePlayer(amount=1){this.playerHP=Math.max(0,this.playerHP-amount);if(this.playerHP===0)this.finished=true;return this.playerHP===0;}
}
