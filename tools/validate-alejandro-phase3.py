import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/characters/alejandro-phase3'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'alejandro.blend'))
scene=bpy.context.scene;arm=bpy.data.objects['AlejandroRig'];mesh=bpy.data.objects['AlejandroCharacterMesh']
sole_indices={i for p in mesh.data.polygons if mesh.data.materials[p.material_index].name=='AlejandroRubberSole' for i in p.vertices}
results=[]
for t in arm.animation_data.nla_tracks:
 action=t.strips[0].action;arm.animation_data.action=action
 values=[]
 for i in range(31):
  frame=action.frame_range[0]+(action.frame_range[1]-action.frame_range[0])*i/30
  scene.frame_set(int(frame),subframe=frame-int(frame));deps=bpy.context.evaluated_depsgraph_get();obj=mesh.evaluated_get(deps)
  points=[obj.matrix_world@v.co for v in obj.data.vertices]
  lo=min(p.z for p in points);hi=max(p.z for p in points);sole=min(points[j].z for j in sole_indices)
  if not all(math.isfinite(p[k]) for p in points for k in range(3)):raise RuntimeError('Nonfinite animation '+action.name)
  values.append({'frame':frame,'minimumZ':lo,'maximumZ':hi,'soleMinimumZ':sole})
 results.append({'clip':action.name,'samples':values,'minimumZ':min(x['minimumZ'] for x in values),'lowestSole':min(x['soleMinimumZ'] for x in values),'highestSole':max(x['soleMinimumZ'] for x in values)})
 if results[-1]['minimumZ']<-.001:raise RuntimeError('Ground penetration: '+action.name)
 if action.name!='Defeated' and results[-1]['highestSole']>.025:raise RuntimeError('Unexpected floating feet: '+action.name)
arm.animation_data.action=None
scene.frame_set(0)
report={'blenderVersion':bpy.app.version_string,'evaluatedSkinnedGeometry':True,'samplesPerClip':31,'results':results,'originalsModified':False}
(OUT/'geometry-validation.json').write_text(json.dumps(report,indent=2)+'\n')
for x in results:print('CLIP',x['clip'],'lowest',x['minimumZ'],'soleRange',x['lowestSole'],x['highestSole'])
