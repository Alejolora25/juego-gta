"""Check authored rigid poses, including between exported keyframes."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets/characters/warden-vanguard'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'warden.blend'))
arm=bpy.data.objects['VanguardRig'];scene=bpy.context.scene;reports=[]
for track in arm.animation_data.nla_tracks:track.mute=True
for track in arm.animation_data.nla_tracks:
 action=track.strips[0].action;arm.animation_data.action=action
 mins=[];maxs=[]
 for step in range(121):
  frame=step*.5;scene.frame_set(int(frame),subframe=frame-int(frame));deps=bpy.context.evaluated_depsgraph_get()
  legL=bpy.data.objects['VanguardLegL'].evaluated_get(deps);legR=bpy.data.objects['VanguardLegR'].evaluated_get(deps)
  left=min((legL.matrix_world@v.co).z for v in legL.data.vertices);right=min((legR.matrix_world@v.co).z for v in legR.data.vertices)
  assert min(left,right)>-.001,(track.name,frame,left,right)
  assert min(left,right)<.015,(track.name,frame,'no supporting foot',left,right)
  mins.append(min(left,right));maxs.append(max(left,right))
 reports.append({'clip':track.name,'samples':121,'minimumFootY':min(mins),'maximumFootLift':max(maxs),'groundedSupport':True})
(OUT/'motion-validation.json').write_text(json.dumps({'source':'warden.blend','halfFrameSamples':True,'clips':reports,'scope':'authored geometry; Chromium validates the compressed rig separately'},indent=2)+'\n')
print('VANGUARD_MOTION_VALIDATED',reports)
