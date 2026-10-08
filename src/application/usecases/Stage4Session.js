export const STAGE4_DIALOGS=[
 {name:'Juan · DevOps',text:'El pipeline está bloqueado. Activa el nodo de validación del distrito.'},
 {name:'Sara · Backend',text:'Buen trabajo. Ahora verifica el servicio Backend antes del despliegue.'},
 {name:'David · Lab',text:'La anomalía viene del Firewall Warden. La arena de seguridad acaba de abrirse.'}
];

export class Stage4Session {
 constructor({state,actor,warden,combat,bossEncounter,projectiles,controls=null,hud=null}){
  Object.assign(this,{state,actor,warden,combat,bossEncounter,projectiles,controls,hud});
 }
 reset(){
  this.projectiles.clear();this.state.reset();this.combat.playerCooldown=this.combat.enemyCooldown=0;this.bossEncounter.setLock(false);
  this.actor.setPosition(0,this.actor.__stage4GroundLift??0,108);this.warden.setPosition(0,this.warden.__stage4GroundLift??0,-150);this.warden.enabled=false;
  if(this.controls){this.controls.locked=false;this.controls.setCombat(false);}
  this.hud?.combat(false);this.hud?.sync(this.state);return this.state;
 }
 missionDialog(result){if(!result?.completed)return false;this.hud?.sync(this.state);const dialog=STAGE4_DIALOGS[result.stage];if(!dialog)return false;this.hud?.dialog(dialog.name,dialog.text);return true;}
 activateBoss(){this.warden.enabled=true;}
 finish(win){this.bossEncounter.setLock(false);this.projectiles.clear();if(this.controls){this.controls.locked=false;this.controls.setCombat(false);}this.hud?.combat(false);this.hud?.sync(this.state);this.hud?.finish(win);}
}
