export class CombatService {
  constructor(state){this.state=state;this.playerCooldown=0;this.enemyCooldown=0;}
  update(dt){this.playerCooldown=Math.max(0,this.playerCooldown-dt);this.enemyCooldown=Math.max(0,this.enemyCooldown-dt);}
  canPlayerShoot(){return this.state.bossActive&&!this.state.finished&&this.playerCooldown<=0;}
  registerPlayerShot(){this.playerCooldown=.22;}
  canBossShoot(distance){return this.state.bossActive&&!this.state.finished&&distance<30&&this.enemyCooldown<=0;}
  registerBossShot(){this.enemyCooldown=1.1;}
  bossHit(){return this.state.damageBoss(12);}
  playerHit(){return this.state.damagePlayer(1);}
}
