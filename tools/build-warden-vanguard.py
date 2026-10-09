"""Adapt the licensed static Vanguard into a rigidly articulated game model.
Preserves uploaded source; joins material-compatible components, authors rig/clips.
"""
import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets/characters/warden-vanguard'
SOURCE=OUT/'original/vanguard.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
groups={}
for key,names in {'Chassis':['Chest','Hip','Body','Body.001'],'ArmL':['Hand'],'ArmR':['Hand.001'],'LegL':['Leg'],'LegR':['Leg.001']}.items():
 groups[key]=[m for name in names for m in bpy.data.objects[name].children_recursive if m.type=='MESH']
assert sum(map(len,groups.values()))==499
points=[o.matrix_world@Vector(v) for meshes in groups.values() for o in meshes for v in o.bound_box]
lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)])
scale=2.65/(hi.z-lo.z)
meshes={}
for key,objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();obj=bpy.context.object
 # Bake imported axis transformations and actual metre scale into vertices.
 world=obj.matrix_world.copy()
 for vertex in obj.data.vertices:
  vertex.co=world@vertex.co;vertex.co.z-=lo.z;vertex.co*=scale
 obj.parent=None;obj.matrix_world.identity();obj.name='Vanguard'+key
 # Merge duplicate material slots introduced by joining 499 components.
 old=list(obj.data.materials);unique=[];mapping={}
 for i,mat in enumerate(old):
  if mat not in unique:unique.append(mat)
  mapping[i]=unique.index(mat)
 indices=[mapping[p.material_index] for p in obj.data.polygons]
 obj.data.materials.clear()
 for mat in unique:obj.data.materials.append(mat)
 for polygon,index in zip(obj.data.polygons,indices):polygon.material_index=index
 meshes[key]=obj
for obj in list(bpy.data.objects):
 if obj not in meshes.values():bpy.data.objects.remove(obj,do_unlink=True)
arm_data=bpy.data.armatures.new('VanguardRigidRig');arm=bpy.data.objects.new('VanguardRig',arm_data);bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
pivots={}
for key,obj in meshes.items():
 pts=[v.co for v in obj.data.vertices];minimum=Vector([min(v[i] for v in pts) for i in range(3)]);maximum=Vector([max(v[i] for v in pts) for i in range(3)])
 pivot=(minimum+maximum)/2
 if key.startswith('Arm'):pivot.z=maximum.z-.08
 elif key.startswith('Leg'):pivot.z=maximum.z-.1
 else:pivot=Vector((0,0,1.35))
 bone=arm_data.edit_bones.new(key);bone.head=pivot;bone.tail=pivot+Vector((0,0,.3));pivots[key]=list(pivot)
 # Independent rigid joints: no deformation across armour pieces.
bpy.ops.object.mode_set(mode='OBJECT')
for key,obj in meshes.items():
 group=obj.vertex_groups.new(name=key);group.add(list(range(len(obj.data.vertices))),1.0,'REPLACE')
 modifier=obj.modifiers.new('RigidArticulation','ARMATURE');modifier.object=arm;obj.parent=arm
scene=bpy.context.scene;scene.render.fps=30
clips=['Idle','Walk','Run','Combat','Hit','Defeated']
for clip in clips:
 action=bpy.data.actions.new(clip);arm.animation_data_create();arm.animation_data.action=action
 for frame in range(61):
  t=frame/60;wave=math.sin(t*math.tau)
  for key,bone in arm.pose.bones.items():
   bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
   side=1 if key.endswith('L') else -1
   if clip in ['Walk','Run']:
    amount=.30 if clip=='Walk' else .40
    if key.startswith('Leg'):
     bone.rotation_euler.x=side*wave*amount;bone.location.y=max(0,side*wave)*(.055 if clip=='Walk' else .09)
    if key.startswith('Arm'):bone.rotation_euler.x=-side*wave*.10
   elif clip=='Combat':
    if key.startswith('Arm'):bone.rotation_euler.x=-.16*(math.sin(math.pi*t)**2)
   elif clip=='Hit':
    if key=='Chassis':bone.rotation_euler.x=.045*(math.sin(math.pi*t)**2)
   elif clip=='Defeated':
    if key=='Chassis':bone.rotation_euler.x=.09*(math.sin(math.pi*t)**2)
    if key.startswith('Arm'):bone.rotation_euler.y=side*.12*(math.sin(math.pi*t)**2)
   elif clip=='Idle' and key.startswith('Arm'):bone.rotation_euler.x=side*.012*wave
   bone.keyframe_insert('rotation_euler',frame=frame);bone.keyframe_insert('location',frame=frame)
  scene.frame_set(frame);bpy.context.view_layer.update()
  for key in ['LegL','LegR']:
   bone=arm.pose.bones[key];obj=meshes[key].evaluated_get(bpy.context.evaluated_depsgraph_get())
   low=min((obj.matrix_world@v.co).z for v in obj.data.vertices)
   desired=.004+(max(0,(1 if key.endswith('L') else -1)*wave)*(.055 if clip=='Walk' else .09) if clip in ['Walk','Run'] else 0)
   bone.location.y+=desired-low;bone.keyframe_insert('location',frame=frame)
 for curve in action.fcurves:
  for point in curve.keyframe_points:point.interpolation='LINEAR'
 arm.animation_data.action=None
 track=arm.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,0,action)
 if clip=='Walk':strip.scale=.4
 elif clip=='Run':strip.scale=.3
 track.mute=True
scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'warden.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'warden-source.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_frame_range=False,export_skins=True,export_all_influences=False)
# Review actual adapted geometry, excluding the camera from export.
bpy.ops.object.camera_add(location=(4,-6,3.3));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1.4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=3.7;scene.camera=camera
scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='TEXTURE';scene.render.resolution_x=640;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.filepath=str(ROOT/'docs/character-renewal/evidence/vanguard/adapted.png');bpy.ops.render.render(write_still=True)
report={'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceBytes':SOURCE.stat().st_size,'sourceMeshes':499,'sourceTriangles':42294,'heightMeters':2.65,'rig':'five rigid articulated joints, vertex weights 1.0; source had no skin/clips','joints':pivots,'clips':clips,'meshGroups':{k:len(v.data.polygons) for k,v in meshes.items()},'authoredLoopSeconds':{'Idle':2,'Walk':.8,'Run':.6,'Combat':2,'Hit':2,'Defeated':2},'gameplayRootMotion':False,'sourcePreserved':True}
(OUT/'adaptation-report.json').write_text(json.dumps(report,indent=2)+'\n')
