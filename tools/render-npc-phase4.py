"""Render actual adapted NPC meshes in a common studio for visual approval."""
import bpy,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]/'assets/characters/npc-phase4'
OUT=ROOT/'review';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;characters=[]
for x,id in zip([-1.12,0,1.12],['juan','sara','david']):
 with bpy.data.libraries.load(str(ROOT/id/(id+'.blend')),link=False) as (source,target):target.objects=source.objects
 for obj in target.objects:
  if obj:scene.collection.objects.link(obj)
 root=next(obj for obj in target.objects if obj.name.startswith('NPCVisual'))
 rig=next(obj for obj in target.objects if obj.type=='ARMATURE');mesh=next(obj for obj in target.objects if obj.type=='MESH')
 action=next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='Idle')
 rig.animation_data.action=action;root.rotation_euler.z=-.18;root.location.x=x
 characters.append((id,root,rig,mesh))
scene.frame_set(0)
world=bpy.data.worlds.new('NPCStudio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.68,.71,1);world.node_tree.nodes['Background'].inputs[1].default_value=.25;scene.world=world
floor_mat=bpy.data.materials.new('ReviewFloor');floor_mat.diffuse_color=(.46,.49,.51,1)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.data.materials.append(floor_mat)
for name,pos,power,size in [('Key',(-3,-4,5),550,4),('Fill',(3,-2,3),280,3),('Rim',(2,3,4),650,3)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
 obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('ReviewCamera');cam=bpy.data.objects.new('ReviewCamera',data);scene.collection.objects.link(cam);scene.camera=cam
cam.location=(0,-9,2.8);cam.rotation_euler=(Vector((0,0,.94))-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=4.8
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=False
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.resolution_percentage=100
scene.render.resolution_x=1500;scene.render.resolution_y=1000
for id,root,rig,mesh in characters:root.rotation_euler.z=math.pi
scene.render.filepath=str(OUT/'npc-back.png');bpy.ops.render.render(write_still=True)
for id,root,rig,mesh in characters:root.rotation_euler.z=-.18
scene.render.filepath=str(OUT/'npc-lineup.png');bpy.ops.render.render(write_still=True)
for id,root,rig,mesh in characters:
 for other,_,_,other_mesh in characters:other_mesh.hide_render=other!=id
 root.location.x=0;root.rotation_euler.z=-.2
 cam.location=(.25,-1.4,1.88);cam.rotation_euler=(Vector((0,-.035,1.60))-cam.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=.78
 scene.render.resolution_x=720;scene.render.resolution_y=820
 scene.render.filepath=str(OUT/(id+'-portrait.png'));bpy.ops.render.render(write_still=True)
print('LORA25_PHASE4_STUDIO_DONE')
