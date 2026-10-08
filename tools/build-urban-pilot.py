"""Reproducible Blender asset build. Run with --background --python.

Source characters are CC0 Quaternius; no game logic is generated here.
"""
import bpy, math, os, random, json
from mathutils import Vector

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','pilot')
os.makedirs(OUT,exist_ok=True)
with open(os.path.join(OUT,'layout.json')) as f:LAYOUT=json.load(f)
bpy.context.preferences.filepaths.save_version=0
random.seed(25)

def clear():
 bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
 for a in list(bpy.data.actions): bpy.data.actions.remove(a)

def material(name,color,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 return m

def export(name):
 if name in ('brick-shop','plaster-apartments'):
  meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
  bpy.ops.object.select_all(action='DESELECT')
  for o in meshes:o.select_set(True)
  bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join()
  bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
  bpy.context.object.name=name
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,name+'.blend'),compress=True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_yup=True,export_image_format='JPEG',export_image_quality=82)

def characters():
 for name,shirt,pants,skin,height in [
  ('alejandro',(.08,.16,.23),(.07,.09,.12),(.48,.29,.18),1.8),
  ('juan',(.22,.29,.21),(.12,.14,.16),(.57,.37,.24),1.76),
  ('sara',(.43,.25,.18),(.10,.13,.18),(.66,.43,.30),1.68),
  ('david',(.68,.65,.55),(.18,.21,.25),(.39,.23,.15),1.83)]:
  clear();bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,'source','human.glb'))
  arm=bpy.data.objects['Human Armature'];mesh=bpy.data.objects['Human_Mesh']
  arm.animation_data.action=None
  for t in arm.animation_data.nla_tracks:
   t.mute=True;t.name=t.name.split('|')[-1]
   if t.name not in ('Idle','Walk','Run','Punch','Death'):
    arm.animation_data.nla_tracks.remove(t)
  # Source uses X forward, Z up, centimetre-like rig scale. Normalize once
  # on a parent, leaving bone transforms and skin bind matrices intact.
  top=bpy.data.objects.new(name.title()+'Visual',None);bpy.context.collection.objects.link(top)
  for o in list(bpy.context.scene.objects):
   if o!=top and o.parent is None:o.parent=top
  top.scale=(height/5.535,)*3;top.rotation_euler.z=math.pi
  top.location.z=.105
  skinmat=material('Skin',skin,.72);cloth=material('Cotton',shirt,.94);denim=material('Denim',pants,.9);shoe=material('Shoes',(.025,.029,.032),.8);hair=material('Hair',(.035,.021,.014),.9)
  mesh.data.materials.clear()
  for m in [skinmat,cloth,denim,shoe,hair]:mesh.data.materials.append(m)
  for p in mesh.data.polygons:
   verts=[mesh.data.vertices[i] for i in p.vertices]
   z=sum((mesh.matrix_world @ v.co).z for v in verts)/len(verts)
   bones=[]
   for v in verts:
    if v.groups:bones.append(mesh.vertex_groups[max(v.groups,key=lambda g:g.weight).group].name)
   if z>5.12:p.material_index=4
   elif any('Head' in b or 'Neck' in b or 'Hand' in b for b in bones):p.material_index=0
   elif any('Foot' in b or 'Toe' in b for b in bones):p.material_index=3
   elif any('Leg' in b for b in bones) or z<2.65:p.material_index=2
   else:p.material_index=1
   p.use_smooth=True
  # Slightly different proportions, keeping the same animation-compatible rig.
  if name=='sara':
   for v in mesh.data.vertices:
    z=(mesh.matrix_world @ v.co).z
    if 2.7<z<4.5:v.co.y*=.89
  export(name)
 clear();bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,'source','robot.glb'))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 points=[o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
 lo=min(p.z for p in points);hi=max(p.z for p in points)
 root=bpy.data.objects.new('WardenVisual',None);bpy.context.collection.objects.link(root)
 for o in list(bpy.context.scene.objects):
  if o!=root and o.parent is None:o.parent=root
 factor=2.65/(hi-lo);root.scale=(factor,)*3;root.location.z=-lo*factor
 for m in bpy.data.materials:
  if not m.use_nodes:continue
  bs=m.node_tree.nodes.get('Principled BSDF')
  if not bs:continue
  c=bs.inputs['Base Color'].default_value
  if c[0]>.4 and c[1]>.2:bs.inputs['Base Color'].default_value=(.12,.15,.18,1);bs.inputs['Metallic'].default_value=.65;bs.inputs['Roughness'].default_value=.38
 export('warden')

def cube(name,pos,size,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.name=name;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 # Planar UVs in metres instead of Blender's default cube atlas, so a wall
 # does not stretch a tiny fragment of the brick texture across ten metres.
 uv=o.data.uv_layers.active
 for poly in o.data.polygons:
  axis=max(range(3),key=lambda i:abs(poly.normal[i]))
  axes=(1,2) if axis==0 else (0,2) if axis==1 else (0,1)
  for loop in poly.loop_indices:
   co=o.data.vertices[o.data.loops[loop].vertex_index].co
   uv.data[loop].uv=(co[axes[0]]*.5,co[axes[1]]*.5)
 if bevel:
  mod=o.modifiers.new('Edge bevel','BEVEL');mod.width=bevel;mod.segments=2
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o

def texture_material(name,base,brick=False):
 # Baked, embedded 512px texture; no Blender-only shader nodes at runtime.
 m=material(name,base)
 image=bpy.data.images.new(name+'Albedo',width=512,height=512)
 pixels=[]
 for y in range(512):
  row=y//32
  for x in range(512):
   mortar=brick and (y%32<2 or (x+(row%2)*32)%64<2)
   noise=random.uniform(-.035,.035)
   color=(.37,.35,.32) if mortar else tuple(max(.02,min(.95,c+noise)) for c in base)
   pixels.extend((*color,1))
 image.pixels=pixels;image.pack()
 nodes=m.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=image
 m.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
 return m

def buildings():
 for name,base,brick in [('brick-shop',(.43,.27,.19),True),('plaster-apartments',(.65,.62,.53),False)]:
  clear();wall=texture_material(name+'Facade',base,brick);stone=material('Limestone',(.45,.44,.4));trim=material('Frames',(.12,.14,.15),.55,.25);glass=material('Glass',(.085,.14,.18),.18,.5);door=material('Timber',(.20,.13,.08));roof=material('Roof',(.17,.18,.18));canvas=material('Canvas',(.21,.28,.23))
  cube('BuildingShell',(0,0,5),(6,8,10),wall,.07)
  cube('Foundation',(0,0,.18),(6,.0+8,.36),stone)
  cube('RoofCornice',(0,0,10),(6.15,8.15,.25),stone,.04)
  cube('RoofDeck',(0,0,10.16),(5.85,7.85,.12),roof)
  for side in [-1,1]:
   for level in [3.7,6.2,8.7]:
    for x in [-1.8,0,1.8]:
     cube('WindowFrame',(x,side*4.015,level),(1.18,.14,1.5),trim,.02)
     cube('WindowGlass',(x,side*4.095,level),(1.02,.025,1.32),glass)
     cube('WindowSill',(x,side*4.13,level-.78),(1.32,.32,.09),stone)
     cube('WindowMullion',(x,side*4.12,level),(.035,.035,1.36),trim)
   cube('FrontDoor',(-1.6,side*4.035,1.15),(1.1,.13,2.2),door,.03)
   cube('ShopWindow',(.95,side*4.065,1.35),(2.9,.12,1.95),glass)
   awning=cube('Awning',(.8,side*4.45,2.6),(3.8,1,.12),canvas);awning.rotation_euler.x=side*.12
   cube('EntranceStep',(-1.6,side*4.28,.075),(1.3,.55,.15),stone)
   for level in [2.8,5.1,7.6]:cube('FacadeCourse',(0,side*4.025,level),(6.05,.12,.12),stone)
  for x in [-3,3]:
   for level in [3.7,6.2,8.7]:
    for y in [-2.5,0,2.5]:
     cube('SideFrame',(x,y,level),(.1,1.15,1.5),trim)
     cube('SideGlass',(x+math.copysign(.06,x),y,level),(.02,1,1.33),glass)
  cube('RoofVent',(-1,1,10.55),(1.1,1.4,.7),trim,.07)
  cube('Chimney',(1.9,2.5,10.8),(.6,.65,1.4),wall)
  export(name)

def pilot_scene():
 clear()
 asphalt=texture_material('Asphalt',(.15,.16,.17));paving=texture_material('Paving',(.52,.50,.45));paint=material('LanePaint',(.77,.72,.52));soil=texture_material('Soil',(.22,.25,.18));steel=material('LampSteel',(.13,.14,.14),.5,.6)
 cube('PilotGround',(0,108,-.12),(78,52,.16),soil)
 cube('PilotRoad',(0,108,.01),(14,52,.08),asphalt)
 for side in [-1,1]:
  cube('PedestrianPaving',(side*11,108,.06),(8,52,.12),paving)
  cube('Curb',(side*7.15,108,.12),(.30,52,.24),paving)
  for z in [86,105,124]:
   cube('LampPost',(side*8.2,z,2.4),(.12,.12,4.8),steel,.03)
   cube('LampArm',(side*7.8,z,4.76),(1,.12,.12),steel)
   cube('LampHousing',(side*7.4,z,4.69),(.7,.35,.12),steel,.04)
 for z in range(85,132,8):cube('LaneDash',(0,z,.065),(.12,3,.012),paint)
 cube('JuanPlaza',(-28,80,.065),(14,6,.12),paving)
 for index,building in enumerate(LAYOUT['buildings']):
  x,z,kind=building['x'],building['z'],building['model']
  before=set(bpy.context.scene.objects)
  bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,kind+'.glb'))
  # Imported glTF has Blender Z up restored by importer.
  for o in set(bpy.context.scene.objects)-before:
   if o.type=='MESH':o['pilot_part']='building-'+str(index)
   if o.parent is None:o.location.x+=x;o.location.y+=z
 for o in bpy.context.scene.objects:
  if o.parent is None:o.location.y*=-1
 # Bake static draw batching into the asset, with shared materials.
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 shared={}
 for o in meshes:
  group=o.vertex_groups.new(name=o.get('pilot_part','street'))
  group.add(list(range(len(o.data.vertices))),1,'REPLACE')
  for i,m in enumerate(o.data.materials):
   key=m.name.split('.')[0]
   if key not in shared:shared[key]=m
   o.data.materials[i]=shared[key]
 bpy.ops.object.select_all(action='DESELECT')
 for o in meshes:o.select_set(True)
 bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join()
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 bpy.context.object.name='UrbanPilotStatic'
 export('street-pilot')

characters();buildings();pilot_scene()
