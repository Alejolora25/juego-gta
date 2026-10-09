import bpy, math, os
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];DESIGN=os.environ.get('LORA25_ALEJANDRO_VARIANT','alejandro-phase3');OUT=ROOT/'assets/characters'/DESIGN/'review'
bpy.ops.wm.open_mainfile(filepath=str(OUT.parent/'alejandro.blend'))
scene=bpy.context.scene
rig=bpy.data.objects['AlejandroRig'];rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(0)
root=bpy.data.objects['AlejandroVisual'];mesh=bpy.data.objects['AlejandroCharacterMesh']
root.rotation_euler.z=0;root.location.x=-1.6
for x,angle in [(0,math.radians(-42)),(1.6,math.pi)]:
 r=root.copy();scene.collection.objects.link(r);r.location.x=x;r.rotation_euler.z=angle
 a=rig.copy();a.data=rig.data.copy();a.parent=r;scene.collection.objects.link(a)
 m=mesh.copy();m.parent=a;scene.collection.objects.link(m)
 for mod in m.modifiers:
  if mod.type=='ARMATURE':mod.object=a
mat=bpy.data.materials.new('StudioBackdrop');mat.diffuse_color=(.46,.49,.51,1)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.data.materials.append(mat)
world=bpy.data.worlds.new('NeutralStudio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.68,.71,1);world.node_tree.nodes['Background'].inputs[1].default_value=.25;scene.world=world
for name,pos,power,size in [('Key',(-3,-4,5),550,4),('Fill',(3,-2,3),280,3),('Rim',(2,3,4),650,3)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
 obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
cam_data=bpy.data.cameras.new('StudioCamera');cam=bpy.data.objects.new('StudioCamera',cam_data);scene.collection.objects.link(cam);scene.camera=cam
cam.location=(0,-9,3.1);cam.rotation_euler=(Vector((0,0,.94))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=5.5
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.use_denoising=False
scene.render.resolution_x=1500;scene.render.resolution_y=920;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'alejandro-three-views.png');bpy.ops.render.render(write_still=True)
# Portrait of the same rendered mesh/materials, not a generated concept image.
for o in scene.objects:
 if o.type=='MESH' and o!=mesh and o!=floor:o.hide_render=True
root.location.x=0
cam.location=(.28,-1.4,1.77);cam.rotation_euler=(Vector((0,-.015,1.59))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.ortho_scale=.72
scene.render.resolution_x=900;scene.render.resolution_y=1000
scene.render.filepath=str(OUT/'alejandro-portrait.png');bpy.ops.render.render(write_still=True)
print('LORA25_PHASE3_STUDIO_DONE')
