"""Author an isolated, editable Alejandro proposal from the verified CC0 base.

Run after tools/inspect-character-library.mjs. Never overwrites a live game asset.
"""
import bpy, bmesh, math, json, os
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
from mathutils.kdtree import KDTree

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters/alejandro-phase3'
OUT.mkdir(parents=True,exist_ok=True)
ART=Path('/workspace/artifacts/lora25-phase3')
ART.mkdir(parents=True,exist_ok=True)
SOURCES=json.loads((ROOT/'assets/character-library/inspection.json').read_text())['results']
def source(suffix):return next(x['inspectionFile'] for x in SOURCES if x['source'].endswith(suffix))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
scene.render.fps=30

def material(name,color,roughness=.8,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metal
 return m

def generated_copy(image,size):
 image.scale(size,size)
 out=bpy.data.images.new(image.name+'-Design',width=size,height=size,alpha=True)
 out.colorspace_settings.name=image.colorspace_settings.name
 out.pixels.foreach_set(image.pixels[:]);out.update();out.pack()
 return out

# Import library first; retain selected actions, remove its mannequin and rig.
bpy.ops.import_scene.gltf(filepath=source('UAL1_Standard.glb'))
source_arm=next(o for o in scene.objects if o.type=='ARMATURE')
source_arm.name='AnimationReferenceRig'
action_map={t.name:t.strips[0].action for t in source_arm.animation_data.nla_tracks}
for t in source_arm.animation_data.nla_tracks:t.mute=True
for o in list(scene.objects):
 if o!=source_arm:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=source('Superhero_Male_FullBody.gltf'))
arm=next(o for o in scene.objects if o.type=='ARMATURE' and o!=source_arm)
arm.name='AlejandroRig'
body=next(o for o in scene.objects if o.name.startswith('SuperHero_Male'))
body.name='AlejandroFaceHandsAndTrousers'
for o in list(scene.objects):
 if o.type=='MESH' and not o.vertex_groups:bpy.data.objects.remove(o,do_unlink=True)
for m in list(bpy.data.materials):
 if m.use_nodes:
  for n in m.node_tree.nodes:
   if n.type=='TEX_IMAGE' and n.image and max(n.image.size)>1024:n.image=generated_copy(n.image,1024)
skin=body.data.materials[0];skin.name='AlejandroWarmSkin'
skin.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.7
hairmat=next(m for m in bpy.data.materials if m.name.startswith('MI_Hair'))
hairmat.name='AlejandroChestnutHair'
hair_bs=hairmat.node_tree.nodes.get('Principled BSDF')
for link in list(hairmat.node_tree.links):
 if link.to_socket==hair_bs.inputs['Base Color']:hairmat.node_tree.links.remove(link)
hair_bs.inputs['Base Color'].default_value=(.055,.026,.012,1)
for obj in scene.objects:
 if obj.type=='MESH' and obj.name.startswith('Eyebrows'):
  for v in obj.data.vertices:v.co.z+=.014*(1-min(abs(v.co.x)/.065,1))
eye=next(m for m in bpy.data.materials if m.name.startswith('MI_Eyes'));eye.name='AlejandroBrownEyes'
jacket=material('AlejandroTechnicalNavy',(.025,.055,.084),.86)
tee=material('AlejandroCottonIvory',(.70,.68,.60),.97)
denim=material('AlejandroGraphiteDenim',(.036,.044,.053),.95)
shoe=material('AlejandroSneakerUpper',(.075,.081,.087),.83)
rubber=material('AlejandroRubberSole',(.34,.36,.35),.98)
accent=material('AlejandroMutedTeal',(.045,.21,.21),.7)
metal=material('AlejandroBrushedMetal',(.29,.34,.36),.37,.65)
black=material('AlejandroGraphiteTrim',(.014,.018,.022),.8)
beard=material('AlejandroShortStubble',(.105,.060,.038),.97)

# Fabric grain is an embedded image, usable by glTF/PlayCanvas as well as Blender.
grain=bpy.data.images.new('NavyFabric128',width=128,height=128)
values=[]
for y in range(128):
 for x in range(128):
  weave=(.94 if (x+y)%3 else 1.07)+(math.sin(x*17+y*37)*.02)
  values.extend((.025*weave,.055*weave,.084*weave,1))
grain.pixels.foreach_set(values);grain.pack()
tex=jacket.node_tree.nodes.new('ShaderNodeTexImage');tex.image=grain
jacket.node_tree.links.new(tex.outputs['Color'],jacket.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

raw_positions=[v.co.copy() for v in body.data.vertices]
raw_weights=[[(body.vertex_groups[g.group].name,g.weight) for g in v.groups if g.weight>.001] for v in body.data.vertices]
tree=KDTree(len(raw_positions))
for i,p in enumerate(raw_positions):tree.insert(p,i)
tree.balance()

def front(x,z):
 candidates=[p.y for p in raw_positions if abs(p.x-x)<.035 and abs(p.z-z)<.035]
 return min(candidates) if candidates else -.08

def attach(obj,bone=None):
 if obj.type!='MESH':
  bpy.context.view_layer.objects.active=obj
  bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
  bpy.ops.object.convert(target='MESH');obj=bpy.context.object
 bpy.context.view_layer.objects.active=obj
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 obj.parent=arm
 if bone:
  obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))),1,'REPLACE')
 else:
  for v in obj.data.vertices:
   _,index,_=tree.find(v.co)
   for name,weight in raw_weights[index]:
    group=obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
    group.add([v.index],weight,'REPLACE')
 mod=obj.modifiers.new('AlejandroSkinning','ARMATURE');mod.object=arm
 for p in obj.data.polygons:p.use_smooth=True
 return obj

def box(name,center,size,mat,bevel=.005,bone=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=center)
 obj=bpy.context.object;obj.name=name;obj.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 obj.data.materials.append(mat)
 if bevel:
  b=obj.modifiers.new('Tailored rounded edges','BEVEL');b.width=bevel;b.segments=3
  bpy.ops.object.modifier_apply(modifier=b.name)
 return attach(obj,bone)

def tube(name,points,radius,mat,bone=None):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=8
 curve.bevel_depth=radius;curve.bevel_resolution=2
 spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for p,co in zip(spline.bezier_points,points):
  p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 obj=bpy.data.objects.new(name,curve);scene.collection.objects.link(obj);curve.materials.append(mat)
 return attach(obj,bone)

def dominant(poly):
 names=[]
 for i in poly.vertices:
  vertex=body.data.vertices[i]
  if vertex.groups:names.append(body.vertex_groups[max(vertex.groups,key=lambda g:g.weight).group].name)
 return max(set(names),key=names.count) if names else ''

def is_coat(poly):
 p=poly.center;bone=dominant(poly)
 return 1.035<p.z<1.565 and abs(p.x)<.685 and not(abs(p.x)<.072 and p.z>1.495)

def is_opening(poly):
 p=poly.center
 return p.y<-.035 and abs(p.x)<.031+max(0,p.z-1.18)*.19 and p.z>1.035

# Tailored shell keeps source skin weights; removing hidden body faces avoids
# z-fighting and wasting geometry underneath the jacket and shoes.
body.data.update()
# Split the authentic source surface at garment boundaries before assigning
# regions. New boundary vertices interpolate UVs and skin weights; seams do
# not follow an arbitrary zigzag of pre-existing triangles.
bm=bmesh.new();bm.from_mesh(body.data)
cuts=[((0,0,z),(0,0,1)) for z in [1.035,1.18,1.475,1.495,1.565]]
cuts += [((x,0,0),(1,0,0)) for x in [-.685,-.072,-.031,.031,.072,.685]]
cuts += [((.031,0,1.18),(1,0,-.19)),((-.031,0,1.18),(-1,0,-.19))]
for point,normal in cuts:
 if normal==(0,0,1):geom=list(bm.verts)+list(bm.edges)+list(bm.faces)
 else:
  selected=[f for f in bm.faces if 1.035-1e-6<f.calc_center_median().z<1.565+1e-6]
  geom=list({v for f in selected for v in f.verts})+list({e for f in selected for e in f.edges})+selected
 bmesh.ops.bisect_plane(bm,geom=geom,plane_co=point,plane_no=normal,dist=1e-6)
bm.to_mesh(body.data);bm.free();body.data.update()
coat_faces={p.index for p in body.data.polygons if is_coat(p) and not is_opening(p)}
coat=body.copy();coat.data=body.data.copy();scene.collection.objects.link(coat);coat.name='AlejandroTailoredJacket'
bm=bmesh.new();bm.from_mesh(coat.data);bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm,geom=[p for p in bm.faces if p.index not in coat_faces],context='FACES')
bm.to_mesh(coat.data);bm.free()
coat.data.materials.clear();coat.data.materials.append(jacket)
for p in coat.data.polygons:p.material_index=0;p.use_smooth=True
for v in coat.data.vertices:v.co+=v.normal*.007

body.data.materials.clear()
for m in [skin,tee,denim,beard]:body.data.materials.append(m)
remove=[]
for p in body.data.polygons:
 bone=dominant(p);co=p.center
 if p.index in coat_faces or bone.startswith(('foot','ball')):remove.append(p.index);continue
 if bone.startswith(('thigh','calf','pelvis')) or co.z<1.035:p.material_index=2
 elif bone.startswith(('Head','neck','hand','index','middle','pinky','ring','thumb')):p.material_index=0
 else:p.material_index=1
 if co.z>1.475 and abs(co.x)<.083:p.material_index=0
 p.use_smooth=True
bm=bmesh.new();bm.from_mesh(body.data);bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm,geom=[p for p in bm.faces if p.index in remove],context='FACES')
bm.to_mesh(body.data);bm.free()
for v in body.data.vertices:
 groups=[body.vertex_groups[g.group].name for g in v.groups if g.weight>.2]
 if any(n.startswith(('thigh','calf')) for n in groups) and v.co.z>.12:v.co+=v.normal*.007

# Hair is a genuine matching CC0 hairstyle, bound to Head rather than floating.
before=set(scene.objects)
bpy.ops.import_scene.gltf(filepath=source('Hair_SimpleParted.gltf'))
for o in set(scene.objects)-before:
 if o.type=='MESH':
  o.name='AlejandroSidePartHair';o.data.materials.clear();o.data.materials.append(hairmat)
  for p in o.data.polygons:p.material_index=0
  attach(o,'Head')
 else:bpy.data.objects.remove(o,do_unlink=True)

# Collars, zipper tapes, pocket openings and shoulder seams are authored as
# geometry, bound using the source's weights so details follow the garment.
for side in [-1,1]:
 points=[(side*(.031+max(0,z-1.18)*.19),front(side*.05,z)-.018,z) for z in [1.04,1.15,1.28,1.38,1.48]]
 tube('JacketZipperTape',points,.0055,black)
 tube('JacketZipperTeeth',[(x,y-.003,z) for x,y,z in points],.0018,metal)
 tube('WaistPocket',[(side*x,front(side*x,1.145)-.020,1.145) for x in [.075,.10,.145]],.004,black)
 tube('ShoulderSeam',[(side*.10,front(side*.10,1.465)-.015,1.465),(side*.16,-.032,1.49),(side*.25,.062,1.49)],.0028,accent)
 tube('CrewCollar',[(side*.01,-.070,1.475),(side*.053,-.049,1.477),(side*.066,-.014,1.48)],.007,tee)
tube('TailoredCollar',[(.074*math.cos(a),.012+.067*math.sin(a),1.503) for a in [i*math.tau/24 for i in range(25)]],.008,jacket)
box('LeftChestID',(.12,front(.12,1.37)-.020,1.37),(.059,.006,.032),black,.004)
box('IDTealMark',(.103,front(.12,1.37)-.024,1.37),(.005,.004,.018),accent,.002)
for z in [1.363,1.374]:box('IDEtchedLine',(.126,front(.12,1.37)-.025,z),(.024,.003,.0025),metal,.0007)
box('ZipperPull',(.034,front(.034,1.21)-.026,1.21),(.009,.007,.022),metal,.002)

# Sculpted shoe profile with bevelled sole, heel and laces, not a cuboid foot.
sole_objects=[]
for side,suffix in [(1,'l'),(-1,'r')]:
 center=side*.1143
 outline=[(-.044,.091),(-.052,.06),(-.052,-.025),(-.048,-.105),(-.027,-.158),(.025,-.158),(.049,-.112),(.054,-.023),(.050,.065),(.041,.092)]
 vertices=[]
 for z,scale in [(-.006,.94),(.005,1),(.030,.97)]:
  vertices.extend([(center+x*scale,y,z) for x,y in outline])
 n=len(outline);faces=[]
 for ring in range(2):
  for i in range(n):faces.append((ring*n+i,ring*n+(i+1)%n,(ring+1)*n+(i+1)%n,(ring+1)*n+i))
 faces.extend([tuple(reversed(range(n))),tuple(range(2*n,3*n))])
 mesh=bpy.data.meshes.new('SoleProfile');mesh.from_pydata(vertices,[],faces);mesh.materials.append(rubber)
 obj=bpy.data.objects.new('SneakerSole_'+suffix,mesh);scene.collection.objects.link(obj)
 bevel=obj.modifiers.new('SoleChamfer','BEVEL');bevel.width=.0025;bevel.segments=2
 bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)
 sole_objects.append(attach(obj,'foot_'+suffix))
 box('SneakerUpper_'+suffix,(center,-.030,.058),(.095,.224,.077),shoe,.029,'foot_'+suffix)
 box('HeelCounter_'+suffix,(center,.075,.063),(.080,.022,.061),black,.008,'foot_'+suffix)
 for y in [-.066,-.036,-.006]:tube('SneakerLace',[(center-.029,y,.097),(center,y-.004,.100),(center+.029,y,.097)],.0023,tee,'foot_'+suffix)
 tube('SneakerTealDetail',[(center-side*.049,-.073,.053),(center-side*.049,-.025,.059),(center-side*.045,.02,.055)],.003,accent,'foot_'+suffix)

# Small laptop pack and padded straps distinguish a working engineer from a
# generic combat avatar. All surfaces remain part of the same skinned rig.
box('CompactLaptopPack',(0,.182,1.265),(.237,.094,.355),black,.029,'spine_02')
box('PackWovenFront',(0,.233,1.275),(.195,.018,.285),jacket,.024,'spine_02')
box('PackTealTab',(0,.246,1.32),(.038,.005,.013),accent,.003,'spine_02')
for side in [-1,1]:
 tube('PaddedPackStrap',[(side*.087,.181,1.44),(side*.108,.06,1.492),(side*.113,-.072,1.41),(side*.132,-.105,1.25),(side*.118,.11,1.12)],.012,black)
 tube('PackStitch',[(side*.095,.235,1.15),(side*.106,.235,1.30),(side*.094,.235,1.40)],.0018,metal,'spine_02')
tube('PackCarryLoop',[(-.047,.17,1.43),(-.045,.17,1.47),(.045,.17,1.47),(.047,.17,1.43)],.006,black,'spine_02')
box('SmartwatchBand',(.683,.066,1.454),(.027,.072,.060),black,.007,'lowerarm_l')
box('SmartwatchFrame',(.682,.005,1.454),(.027,.012,.037),metal,.004,'lowerarm_l')
box('SmartwatchScreen',(.682,-.003,1.454),(.020,.004,.028),accent,.002,'lowerarm_l')

# Retarget local pose deltas while preserving destination bone lengths/bind
# matrices. Sharing bone names is not sufficient for copying absolute tracks.
scale=1.78/1.845
root=bpy.data.objects.new('AlejandroVisual',None);scene.collection.objects.link(root)
arm.parent=root;root.scale=(scale,)*3
source_arm.animation_data.action=None
for t in source_arm.animation_data.nla_tracks:t.mute=True
arm.animation_data_create()
clips=[('Idle','Idle_Loop'),('Walk','Walk_Loop'),('Run','Sprint_Loop'),('Interact','Interact'),('Combat','Pistol_Aim_Neutral'),('Shoot','Pistol_Shoot'),('Hit','Hit_Chest'),('Defeated','Death01')]
rest_source={b.name:(b.parent.matrix_local.inverted()@b.matrix_local if b.parent else b.matrix_local.copy()) for b in source_arm.data.bones}
rest_target={b.name:(b.parent.matrix_local.inverted()@b.matrix_local if b.parent else b.matrix_local.copy()) for b in arm.data.bones}
records=[]
for name,original in clips:
 reference=action_map[original];source_arm.animation_data.action=reference
 source_start,source_end=reference.frame_range
 action=bpy.data.actions.new(name);arm.animation_data.action=action
 frames=int(round(source_end-source_start))+1
 previous={}
 for frame in range(frames):
  scene.frame_set(int(round(source_start))+frame)
  for bone in arm.pose.bones:
   src=source_arm.pose.bones[bone.name]
   local=src.parent.matrix.inverted()@src.matrix if src.parent else src.matrix.copy()
   s=rest_source[bone.name];t=rest_target[bone.name]
   delta=local.to_quaternion()@s.to_quaternion().inverted()
   desired=(delta@t.to_quaternion()).to_matrix().to_4x4()
   desired.translation=t.translation+(local.translation-s.translation)
   bone.matrix_basis=t.inverted()@desired
   bone.rotation_mode='QUATERNION'
   if bone.name in previous and bone.rotation_quaternion.dot(previous[bone.name])<0:bone.rotation_quaternion.negate()
   previous[bone.name]=bone.rotation_quaternion.copy()
   bone.keyframe_insert('rotation_quaternion',frame=frame)
   bone.keyframe_insert('location',frame=frame)
  # Correct the authored sole contact in the animation asset, never the game
  # controller. The lowest shoe surface stays on the floor throughout locomotion.
  if name in ['Idle','Walk','Run','Combat','Shoot','Interact','Hit']:
   scene.frame_set(frame);bpy.context.view_layer.update()
   deps=bpy.context.evaluated_depsgraph_get()
   low=min((o.evaluated_get(deps).matrix_world@v.co).z for o in sole_objects for v in o.evaluated_get(deps).data.vertices)
   correction=(-low+.002)/scale
   pelvis=arm.pose.bones['pelvis'];pelvis.matrix=Matrix.Translation((0,0,correction))@pelvis.matrix
   pelvis.keyframe_insert('location',frame=frame)
 records.append({'name':name,'source':original,'frames':frames,'durationSeconds':(frames-1)/30})
 for curve in action.fcurves:
  for point in curve.keyframe_points:point.interpolation='LINEAR'
 arm.animation_data.action=None
 track=arm.animation_data.nla_tracks.new();track.name=name
 strip=track.strips.new(name,0,action);strip.action_frame_start=0;strip.action_frame_end=frames-1;track.mute=True

# Short looking/turning transitions: rotate the body above planted feet; heading
# remains controlled by the existing player controller, not an animated root.
idle=bpy.data.actions.get('Idle')
arm.animation_data.action=idle;scene.frame_set(0)
idle_pose={b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in arm.pose.bones}
arm.animation_data.action=None
for name,sign in [('TurnLeft',1),('TurnRight',-1)]:
 action=bpy.data.actions.new(name);arm.animation_data.action=action
 for frame in range(19):
  amount=math.sin(math.pi*frame/18)*sign
  for bone in arm.pose.bones:
   loc,rotation=idle_pose[bone.name];bone.location=loc;bone.rotation_quaternion=rotation
  for bone_name,degrees in [('spine_02',12),('spine_03',9),('neck_01',8),('Head',10)]:
   bone=arm.pose.bones[bone_name]
   bone.rotation_quaternion=bone.rotation_quaternion@Quaternion((0,1,0),math.radians(degrees)*amount)
  for bone in arm.pose.bones:
   bone.keyframe_insert('rotation_quaternion',frame=frame)
   bone.keyframe_insert('location',frame=frame)
 for curve in action.fcurves:
  for point in curve.keyframe_points:point.interpolation='LINEAR'
 arm.animation_data.action=None
 track=arm.animation_data.nla_tracks.new();track.name=name
 strip=track.strips.new(name,0,action);strip.action_frame_start=0;strip.action_frame_end=18;track.mute=True
 records.append({'name':name,'source':'authored above Idle_Loop','frames':19,'durationSeconds':.6})

bpy.data.objects.remove(source_arm,do_unlink=True)
used={t.strips[0].action for t in arm.animation_data.nla_tracks}
for action in list(bpy.data.actions):
 if action not in used:bpy.data.actions.remove(action)
for bone in arm.pose.bones:bone.matrix_basis=Matrix.Identity(4)
arm.animation_data.action=None
scene.frame_set(0)

# Bind-pose floor and expected existing visual-facing adapter: humans must face
# -Z in glTF so PilotCharacterSystem's existing 180-degree adapter faces +Z.
# Blender character faces -Y; a pi rotation around Z exports a -Z front.
root.rotation_euler.z=math.pi
root.location.z=.008

# Join skinned surfaces without baking a pose, retaining UVs, weights and rig.
meshes=[o for o in scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.object.join();body=bpy.context.object;body.name='AlejandroCharacterMesh'
body.data.name='AlejandroTailoredCharacter'
# Final contact pass on the actual joined skinned geometry, including fractional
# samples. Correcting only pre-join integer poses leaves interpolation dips.
sole_indices={i for p in body.data.polygons if body.data.materials[p.material_index].name=='AlejandroRubberSole' for i in p.vertices}
for track in arm.animation_data.nla_tracks:
 action=track.strips[0].action;arm.animation_data.action=action
 contacts=[]
 start,end=action.frame_range
 for i in range(int(round((end-start)*2))+1):
  frame=start+i*.5;scene.frame_set(int(frame),subframe=frame-int(frame))
  obj=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
  indices=range(len(obj.data.vertices)) if track.name=='Defeated' else sole_indices
  low=min((obj.matrix_world@obj.data.vertices[j].co).z for j in indices)
  clearance=.013 if track.name=='Run' else .003
  pelvis=arm.pose.bones['pelvis'];pelvis.matrix=Matrix.Translation((0,0,(clearance-low)/scale))@pelvis.matrix
  contacts.append((frame,pelvis.location.copy()))
 for frame,location in contacts:
  arm.pose.bones['pelvis'].location=location
  arm.pose.bones['pelvis'].keyframe_insert('location',frame=frame)
 for curve in action.fcurves:
  for point in curve.keyframe_points:point.interpolation='LINEAR'
arm.animation_data.action=None
for bone in arm.pose.bones:bone.matrix_basis=Matrix.Identity(4)
scene.frame_set(0)
# Preserve half-frame contact corrections in the glTF export's sampled tracks.
# Doubling frame coordinates and FPS keeps clip durations unchanged.
for track in arm.animation_data.nla_tracks:
 action=track.strips[0].action
 for curve in action.fcurves:
  for point in curve.keyframe_points:
   point.co.x*=2;point.handle_left.x*=2;point.handle_right.x*=2
 strip=track.strips[0];strip.action_frame_end*=2;strip.frame_end=strip.action_frame_end
scene.render.fps=60
arm['source']='Quaternius Universal Base Characters Standard, CC0-1.0'
root['design']='Technology engineer: navy technical jacket, ivory crew tee, graphite trousers, side-part hair, compact laptop pack and smartwatch'
root['forwardInGLTF']='-Z; existing ModelFacing adapter rotates visual by 180 degrees'
root['gameplayIntegration']='not integrated; phase 3 visual approval required'
root['animationMotion']='in-place; game controls translation and heading'
scene['phase']='3 — design proposal awaiting visual approval'
scene['sourceLicense']='CC0 1.0 Universal; originals and checksums in assets/character-library'

scene.frame_start=0;scene.frame_end=120
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'alejandro.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'alejandro.glb'),export_format='GLB',export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_image_format='AUTO',export_extras=True)
(OUT/'build-report.json').write_text(json.dumps({'authoringTool':bpy.app.version_string,'phase':3,'status':'awaiting-visual-approval','source':'Quaternius Standard Superhero Male, adapted','originalsModified':False,'heightTargetMetres':1.78,'expectedForward':'-Z','clips':records,'gameplayChanged':False},indent=2)+'\n')
print('LORA25_ALEJANDRO_PHASE3_BUILT',OUT)
