export class HudController{
 constructor($){this.$=$;this.missions=['Habla con Juan en DevOps.','Encuentra a Sara en Backend.','Llega al LAB y habla con David.','⚠️ Entra a la arena norte y derrota al Firewall Warden.'];}
 sync(state){this.$('xp').textContent=`XP ${state.xp}`;this.$('hp').textContent='❤️'.repeat(state.playerHP)+'🖤'.repeat(3-state.playerHP);this.$('mt').textContent=this.missions[state.stage]||this.missions[3];this.$('bossFill').style.width=`${state.bossHP}%`;}
 combat(active){this.$('bossHud').style.display=active?'block':'none';this.$('shoot').style.display=active?'block':'none';this.$('crosshair').style.display=active?'block':'none';}
 objective(distance,angle){this.$('distance').textContent=`${Math.round(distance)} m`;const a=this.$('arrow');a.textContent='➤';a.style.transform=`rotate(${angle}rad)`;a.title='Dirección del objetivo';}
 dialog(name,text){this.$('who').textContent=name;this.$('speech').textContent=text;this.$('dialog').style.display='flex';}
 finish(win){this.$('end').style.display='flex';this.$('endTitle').textContent=win?'🏆 Firewall Warden derrotado':'💀 Has caído';this.$('endText').textContent=win?'Capítulo 1 completado. El Distrito Tech vuelve a estar bajo control.':'Reintenta el capítulo y mantente en movimiento durante el combate.';}
}
