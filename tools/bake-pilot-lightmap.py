"""Bake a shared static light atlas and split geometry into street/LOD chunks.

The UV1 atlas is shared by all chunks. A white occlusion texture keeps UV1 in
standard glTF; the runtime assigns the external baked atlas as lightMap.
"""
import bpy, bmesh, os, math
from io_scene_gltf2.blender.com.material_helpers import create_settings_group

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','pilot')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'street-pilot.blend'))
bpy.context.preferences.filepaths.save_version=0
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=mesh
mesh.select_set(True)
mesh.data.validate(clean_customdata=True)
bm=bmesh.new();bm.from_mesh(mesh.data)
bmesh.ops.triangulate(bm,faces=list(bm.faces))
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.to_mesh(mesh.data);bm.free();mesh.data.update()
uv0=mesh.data.uv_layers[0]
uv1=mesh.data.uv_layers.new(name='Lightmap')
mesh.data.uv_layers.active=uv1
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(70),island_margin=.006,area_weight=1)
bpy.ops.object.mode_set(mode='OBJECT')
uv1.active_render=True

scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16
scene.render.bake.use_pass_color=False
scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True
scene.render.bake.margin=4
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.68,.76,.88,1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value=1.0
bpy.ops.object.light_add(type='SUN',rotation=(math.radians(38),math.radians(-25),math.radians(-30)))
sun=bpy.context.object;sun.data.energy=2.0;sun.data.angle=.08
image=bpy.data.images.new('PilotLightmap',width=1024,height=1024,float_buffer=True)
image.colorspace_settings.name='Non-Color'
materials=list(set(mesh.data.materials))
# Bake neutral irradiance, not albedo. A temporary material keeps importer
# texture/normal-map conversions out of Cycles while retaining all UV islands.
source_slots=list(mesh.data.materials)
bake_material=bpy.data.materials.new('NeutralIrradiance');bake_material.use_nodes=True
bake_material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.8,.8,.8,1)
node=bake_material.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
bake_material.node_tree.nodes.active=node
for i in range(len(source_slots)):mesh.data.materials[i]=bake_material
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
bpy.ops.object.bake(type='DIFFUSE',uv_layer='Lightmap')
for i,mat in enumerate(source_slots):mesh.data.materials[i]=mat
# Small diffuse sky-floor keeps shadow-facing walls readable in the mobile
# renderer without realtime lights on baked meshes. Preserve directional
# shading above the floor; extend it into atlas padding to avoid black seams.
pixels=list(image.pixels)
for i in range(0,len(pixels),4):
 for channel,floor in enumerate((.24,.26,.28)):
  pixels[i+channel]=max(floor,pixels[i+channel])
image.pixels.foreach_set(pixels);image.update()
image.filepath_raw=os.path.join(OUT,'lightmap.png');image.file_format='PNG';image.save()
image.pack()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'street-lighting.blend'),compress=True)

# This tiny white texture deliberately has no visual occlusion effect. Its UV1
# binding makes the standard glTF exporter preserve the light atlas coordinates.
white=bpy.data.images.new('UV1Carrier',width=1,height=1);white.pixels=[1,1,1,1];white.pack()
group=create_settings_group('glTF Material Output')
for mat in materials:
 nodes=mat.node_tree.nodes
 tex=nodes.new('ShaderNodeTexImage');tex.image=white
 uv=nodes.new('ShaderNodeUVMap');uv.uv_map='Lightmap'
 settings=nodes.new('ShaderNodeGroup');settings.node_tree=group
 mat.node_tree.links.new(uv.outputs['UV'],tex.inputs['Vector'])
 mat.node_tree.links.new(tex.outputs['Color'],settings.inputs['Occlusion'])
mesh.data.uv_layers.active=uv0;uv0.active_render=True

def part(name):
 obj=mesh.copy();obj.data=mesh.data.copy();bpy.context.collection.objects.link(obj)
 group_index=obj.vertex_groups[name].index
 bm=bmesh.new();bm.from_mesh(obj.data);weights=bm.verts.layers.deform.active
 removed=[v for v in bm.verts if v[weights].get(group_index,0)<.5]
 bmesh.ops.delete(bm,geom=removed,context='VERTS');bm.to_mesh(obj.data);bm.free()
 obj.name=name
 return obj

def export(obj,name):
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),use_selection=True,export_animations=False,export_format='GLB',export_image_format='JPEG',export_image_quality=82)

street=part('street');export(street,'street-baked')
for i in range(6):
 high=part('building-'+str(i));export(high,'building-high-'+str(i))
 low=high.copy();low.data=high.data.copy();bpy.context.collection.objects.link(low)
 bpy.context.view_layer.objects.active=low
 modifier=low.modifiers.new('DistanceLOD','DECIMATE');modifier.ratio=.25
 bpy.ops.object.modifier_apply(modifier=modifier.name)
 export(low,'building-low-'+str(i))
print('LIGHTMAP_AND_LOD_READY')
