// Observe the existing encounter. Only animation clips change; never health,
// cooldowns, movement, collision, projectile origins or gameplay roots.
export function createVanguardPresentation({record,app,state,combat}) {
 let previous=record.entity.getPosition().clone(),hp=state.bossHP,cooldown=combat.enemyCooldown;
 let transient=null,remaining=0,disposed=false;
 const update=dt=>{
  if(disposed)return;
  const position=record.entity.getPosition();
  const moved=Math.hypot(position.x-previous.x,position.z-previous.z)>.0001;
  remaining=Math.max(0,remaining-dt);
  if(!state.bossActive){transient=null;remaining=0;}
  else if(state.bossHP<hp){transient='hit';remaining=.28;}
  else if(combat.enemyCooldown>cooldown+.01){transient='combat';remaining=.55;}
  const clip=state.finished&&state.bossHP<=0?'defeated':!state.bossActive?'idle':remaining>0?transient:moved?'walk':'idle';
  record.skeletal.playSemantic(clip);
  previous.copy(position);hp=state.bossHP;cooldown=combat.enemyCooldown;
 };
 const dispose=()=>{if(disposed)return;disposed=true;app.off('update',update);app.off('destroy',dispose);};
 // Registered after the gameplay listener, so each pose observes its outcome.
 app.on('update',update);app.once('destroy',dispose);
 return {update,dispose};
}
