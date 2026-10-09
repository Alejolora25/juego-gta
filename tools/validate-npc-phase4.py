"""Evaluate real deformed geometry and standing-foot stability in Blender."""
import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'assets/characters/npc-phase4'
results=[]
for id in ['juan','sara','david']:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/id/(id+'.blend')))
 scene=bpy.context.scene;rig=bpy.data.objects['NPCRig'];mesh=bpy.data.objects['NPCCharacterMesh'];root=bpy.data.objects['NPCVisual']
 foot_bones=[bone for bone in rig.pose.bones if bone.name.startswith('Foot.')]
 assert len(foot_bones)==2
 for track in rig.animation_data.nla_tracks:
  rig.animation_data.action=track.strips[0].action;start,end=rig.animation_data.action.frame_range
  samples=[]
  for i in range(31):
   frame=start+(end-start)*i/30;scene.frame_set(int(frame),subframe=frame-int(frame))
   obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());points=[obj.matrix_world@v.co for v in obj.data.vertices]
   assert all(math.isfinite(p[k]) for p in points for k in range(3))
   feet=[tuple(rig.matrix_world@bone.head) for bone in foot_bones]
   samples.append({'timeSeconds':frame/scene.render.fps,'minimumZ':min(p.z for p in points),'feet':feet,'root':tuple(root.location)})
  foot_drift=max(math.hypot(s['feet'][foot][0]-samples[0]['feet'][foot][0],s['feet'][foot][1]-samples[0]['feet'][foot][1]) for s in samples for foot in [0,1])
  minimum=min(s['minimumZ'] for s in samples);maximum=max(s['minimumZ'] for s in samples)
  assert minimum>=-.001,(id,track.name,'penetration',minimum)
  assert maximum<.025,(id,track.name,'floating',maximum)
  if track.name=='Idle':assert foot_drift<.003,(id,'idle walking feet',foot_drift)
  assert all(s['root']==samples[0]['root'] for s in samples)
  results.append({'id':id,'clip':track.name,'minimumZ':minimum,'highestMinimumZ':maximum,'horizontalFootDriftMetres':foot_drift,'samples':samples})
  print('NPC',id,track.name,'minimum',minimum,'foot drift',foot_drift)
(ROOT/'geometry-validation.json').write_text(json.dumps({'evaluatedSkinnedGeometry':True,'samplesPerClip':31,'results':results,'gameplayChanged':False},indent=2)+'\n')
