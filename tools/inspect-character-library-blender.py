# Import validation only; never saves over an original source.
import bpy,json,os
from pathlib import Path
root=str(Path(__file__).resolve().parents[1]/'assets/character-library')
report=json.load(open(root+'/inspection.json'))
results=[]
for item in report['results']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=item['inspectionFile'])
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 armatures=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
 results.append({'source':item['source'],'meshes':len(meshes),'armatures':len(armatures),'bones':[len(o.data.bones) for o in armatures],'importedActions':len(bpy.data.actions),'importSucceeded':True})
with open(root+'/blender-inspection.json','w') as f:json.dump({'blenderVersion':bpy.app.version_string,'models':results,'originalsModified':False},f,indent=2)
print('LORA25_BLENDER_INSPECTION_OK',len(results))
