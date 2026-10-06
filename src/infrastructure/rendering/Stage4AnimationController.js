import * as pc from 'playcanvas';

export class Stage4AnimationController {
 constructor(entity){this.entity=entity;this.state='idle';this.speed=0;}
 configure(){if(!this.entity.anim)this.entity.addComponent('anim',{activate:true});return this;}
 setLocomotion(speed,running=false){this.speed=Math.max(0,speed);this.state=this.speed<.05?'idle':running?'run':'walk';return this.state;}
 setCombat(active){if(active)this.state='combat';else if(this.speed<.05)this.state='idle';return this.state;}
 setHit(){this.state='hit';return this.state;}
 setDefeated(){this.state='defeated';return this.state;}
}
