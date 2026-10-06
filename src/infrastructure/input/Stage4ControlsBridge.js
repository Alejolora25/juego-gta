export class Stage4ControlsBridge {
 constructor(controls,camera){this.controls=controls;this.camera=camera;}
 snapshot(){
  const cameraDelta=this.controls.consumeCamera();
  if(cameraDelta)this.camera.drag(cameraDelta);
  return {joy:{x:this.controls.move.x,y:this.controls.move.y},running:this.controls.running,cameraYaw:this.camera.yaw,cameraDelta};
 }
 update(playerController,dt){return playerController.update({...this.snapshot(),dt});}
}
