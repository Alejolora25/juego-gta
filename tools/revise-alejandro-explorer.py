"""Derive a recoverable explorer design from the immutable approved phase 3 rig.

This is an isolated character deliverable, never a replacement of a game asset.
"""
import bpy, math, json, hashlib
import numpy as np
from pathlib import Path
from mathutils import Matrix
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT/'assets/characters/alejandro-phase3'
OUT = ROOT/'assets/characters/alejandro-explorer'
OUT.mkdir(parents=True, exist_ok=True)
original = (BASE/'alejandro.blend').read_bytes()
assert hashlib.sha256(original).hexdigest() == 'c5fb01700f5ea9d83630a4c96d27292ef76e8de1097e94d5ac78098a57dcbdec'
bpy.ops.wm.open_mainfile(filepath=str(BASE/'alejandro.blend'))
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
arm = bpy.data.objects['AlejandroRig']
body = bpy.data.objects['AlejandroCharacterMesh']
root = bpy.data.objects['AlejandroVisual']
arm.animation_data.action = None
for track in arm.animation_data.nla_tracks: track.mute = True
for bone in arm.pose.bones: bone.matrix_basis = Matrix.Identity(4)
scene.frame_set(0)

def material(name, color, roughness=.75, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return mat

def recolor(name, color, roughness=None):
    mat = bpy.data.materials[name]
    shader = mat.node_tree.nodes.get('Principled BSDF')
    for link in list(mat.node_tree.links):
        if link.to_socket == shader.inputs['Base Color']: mat.node_tree.links.remove(link)
    shader.inputs['Base Color'].default_value = (*color, 1)
    if roughness is not None: shader.inputs['Roughness'].default_value = roughness
    return mat

cargo = recolor('AlejandroGraphiteDenim', (.43, .36, .25), .94)
cargo.name = 'AlejandroSandCargo'
tee = recolor('AlejandroCottonIvory', (.016, .025, .039), .9)
tee.name = 'AlejandroBlackTechnologyTee'
hair = recolor('AlejandroChestnutHair', (.026, .014, .008), .74)
black = bpy.data.materials['AlejandroGraphiteTrim']
metal = recolor('AlejandroBrushedMetal', (.20, .23, .25), .38)
accent = recolor('AlejandroMutedTeal', (.019, .17, .32), .45)
accent.name = 'AlejandroExplorerBlue'
rubber = recolor('AlejandroRubberSole', (.19, .19, .17), .97)
shoe = recolor('AlejandroSneakerUpper', (.045, .049, .047), .82)
shoe.name = 'AlejandroTrailShoe'
stitch = material('AlejandroSandStitch', (.61, .53, .39), .92)
lettering = material('AlejandroBlueLettering', (.12, .29, .48), .83)
lens = material('AlejandroBlueAviatorLens', (.013, .077, .22), .16, .78)
frame = material('AlejandroAviatorFrame', (.055, .060, .067), .24, .85)

# Fingerless gloves reuse the real hand surface; finger geometry stays visible.
glove_index = list(body.data.materials).index(black)
for poly in body.data.polygons:
    if body.data.materials[poly.material_index].name != 'AlejandroWarmSkin': continue
    palm = 0
    for i in poly.vertices:
        weights = body.data.vertices[i].groups
        if weights:
            dominant = body.vertex_groups[max(weights, key=lambda w:w.weight).group].name
            palm += dominant in ['hand_l', 'hand_r']
    if palm == len(poly.vertices): poly.material_index = glove_index

# Retain the woven jacket image, but tint it toward the reference's dark navy.
jacket = bpy.data.materials['AlejandroTechnicalNavy']
for node in jacket.node_tree.nodes:
    if node.type == 'TEX_IMAGE':
        img = node.image
        pixels = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
        pixels[:, :3] *= np.array([.55, .55, .67])
        img.pixels.foreach_set(pixels.ravel()); img.update(); img.pack()

tree = KDTree(len(body.data.vertices))
for v in body.data.vertices: tree.insert(v.co, v.index)
tree.balance()
added = []
def attach(obj, bone=None):
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if obj.type != 'MESH': bpy.ops.object.convert(target='MESH'); obj = bpy.context.object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.parent = arm
    if bone:
        obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    else:
        for v in obj.data.vertices:
            _, i, _ = tree.find(v.co)
            for weight in body.data.vertices[i].groups:
                name = body.vertex_groups[weight.group].name
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([v.index], weight.weight, 'REPLACE')
    modifier = obj.modifiers.new('ExplorerSkinning', 'ARMATURE'); modifier.object = arm
    for poly in obj.data.polygons: poly.use_smooth = True
    added.append(obj)
    return obj

def box(name, center, size, mat, bevel=.004, bone=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object; obj.name = name; obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new('RoundedEdges', 'BEVEL')
        modifier.width = bevel; modifier.segments = 2
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return attach(obj, bone)

def tube(name, points, radius, mat, bone=None):
    curve = bpy.data.curves.new(name, 'CURVE'); curve.dimensions = '3D'
    curve.resolution_u = 4; curve.bevel_depth = radius; curve.bevel_resolution = 2
    spline = curve.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co; p.handle_left_type = 'AUTO'; p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve); scene.collection.objects.link(obj)
    curve.materials.append(mat)
    return attach(obj, bone)

# Soft short-beard tint painted in the original face UVs, preserving skin detail.
# Only actual face triangles are rasterized; the texture's hands stay untouched.
skin = bpy.data.materials['AlejandroWarmSkin']
bsdf = skin.node_tree.nodes.get('Principled BSDF')
skin_image_node = next(node for node in skin.node_tree.nodes if node.type == 'TEX_IMAGE' and 'Dark' in node.image.name)
image = skin_image_node.image
width, height = image.size
pixels = np.array(image.pixels[:], dtype=np.float32).reshape(height, width, 4)
mask = np.zeros((height, width), dtype=np.float32)
uvs = body.data.uv_layers.active.data
body.data.calc_loop_triangles()
def smooth(a, b, x):
    value = np.clip((x-a)/(b-a), 0, 1)
    return value*value*(3-2*value)
for tri in body.data.loop_triangles:
    if body.data.materials[tri.material_index] != skin: continue
    points = np.array([body.data.vertices[i].co[:] for i in tri.vertices])
    if points[:, 2].max() < 1.60 or points[:, 2].min() > 1.69 or points[:, 1].min() > -.025: continue
    texcoords = np.array([uvs[i].uv[:] for i in tri.loops])*[width-1, height-1]
    lower = np.maximum(np.floor(texcoords.min(axis=0)).astype(int), 0)
    upper = np.minimum(np.ceil(texcoords.max(axis=0)).astype(int), [width-1, height-1])
    xs, ys = np.meshgrid(np.arange(lower[0], upper[0]+1), np.arange(lower[1], upper[1]+1))
    a, b, c = texcoords
    det = (b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(det) < 1e-8: continue
    wa = ((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/det
    wb = ((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/det
    wc = 1-wa-wb
    local = wa[..., None]*points[0]+wb[..., None]*points[1]+wc[..., None]*points[2]
    x, y, z = (local[..., i] for i in range(3))
    cheek_limit = 1.637+.40*np.abs(x)
    jaw = (1-smooth(cheek_limit-.004, cheek_limit+.004, z))*smooth(1.596, 1.613, z)
    moustache = smooth(1.646, 1.650, z)*(1-smooth(1.658, 1.663, z))*(1-smooth(.019, .030, np.abs(x)))
    amount = np.maximum(jaw, moustache)*(1-smooth(-.025, .005, y))
    amount *= ((wa>=-.04)&(wb>=-.04)&(wc>=-.04))
    patch = mask[lower[1]:upper[1]+1, lower[0]:upper[0]+1]
    np.maximum(patch, amount, out=patch)
noise = np.random.default_rng(17).uniform(.82, 1.0, mask.shape)
blend = mask*noise*.69
pixels[:, :, :3] = pixels[:, :, :3]*(1-blend[..., None])+np.array([.10, .065, .045])*blend[..., None]
image.pixels.foreach_set(pixels.ravel()); image.update(); image.pack()

# Blue aviators have thin geometric rims, curved lenses, bridge and ear stems.
outline = [(-.032,.017),(-.022,.024),(.012,.023),(.030,.014),(.029,-.007),(.015,-.020),(-.004,-.026),(-.025,-.018),(-.032,.001)]
for side in [-1, 1]:
    center = side*.036
    edge = [(center+side*x, -.104+.009*(abs(x)/.032)**2, 1.704+z) for x,z in outline]
    tube('AviatorRim', edge+[edge[0]], .0018, frame, 'Head')
    vertices = [(center, -.108, 1.704)]+edge
    faces = [(0, i+1, (i+1)%len(edge)+1) for i in range(len(edge))]
    mesh = bpy.data.meshes.new('CurvedAviatorLens'); mesh.from_pydata(vertices, [], faces); mesh.materials.append(lens)
    obj = bpy.data.objects.new('BlueAviatorLens', mesh); scene.collection.objects.link(obj); attach(obj, 'Head')
    tube('AviatorTemple', [(side*.067,-.097,1.716),(side*.075,-.045,1.720),(side*.081,.005,1.715),(side*.077,.034,1.695)], .0020, frame, 'Head')
    tube('LensUpperBlueGlint', edge[:4], .0008, accent, 'Head')
tube('AviatorBridge', [(-.012,-.105,1.715),(0,-.116,1.719),(.012,-.105,1.715)], .0018, frame, 'Head')

# Technical backpack: external pockets, compression straps, buckles and handle.
box('ExplorerPackTop', (0,.205,1.453), (.239,.105,.058), black, .017, 'spine_02')
box('ExplorerPackRearPocket', (0,.258,1.206), (.176,.038,.125), jacket, .016, 'spine_02')
for side in [-1, 1]:
    box('ExplorerPackSidePocket', (side*.135,.194,1.20), (.054,.075,.158), black, .017, 'spine_02')
    for z in [1.19,1.37]:
        box('PackCompressionWebbing', (side*.137,.240,z), (.046,.008,.019), black, .002, 'spine_02')
        box('PackCompressionBuckle', (side*.136,.247,z), (.019,.007,.027), metal, .002, 'spine_02')
    box('ShoulderHarnessBuckle', (side*.115,-.095,1.375), (.032,.012,.041), metal, .004)
    box('ShoulderHarnessWebbing', (side*.115,-.103,1.375), (.019,.008,.026), black, .001)
    tube('PackBluePiping', [(side*.10,.247,1.14),(side*.105,.250,1.31),(side*.10,.241,1.41)], .0024, accent, 'spine_02')

# Cargo pockets follow thigh bones; belt uses the pelvis, never the game root.
for side, suffix in [(1, 'l'), (-1, 'r')]:
    bone = 'thigh_'+suffix
    box('CargoThighPocket', (side*.183,.003,.77), (.026,.118,.155), cargo, .008, bone)
    box('CargoPocketFlap', (side*.200,.000,.826), (.009,.127,.039), cargo, .003, bone)
    tube('CargoPocketStitch', [(side*.202,-.047,.813),(side*.202,-.047,.715),(side*.202,.051,.715)], .0014, stitch, bone)
    box('CargoUtilityTab', (side*.207,-.029,.819), (.006,.013,.020), black, .001, bone)
    box('TrailShoeAnkleCollar', (side*.1143,.029,.119), (.086,.113,.100), shoe, .018, 'foot_'+suffix)
    tube('TrailShoeBluePiping', [(side*.1143-.032,-.148,.030),(side*.1143,-.157,.031),(side*.1143+.030,-.148,.030)], .0022, accent, 'foot_'+suffix)
box('UtilityBeltFront', (0,-.095,1.028), (.255,.012,.030), black, .004, 'pelvis')
box('UtilityBeltBuckle', (0,-.105,1.028), (.039,.010,.033), metal, .003, 'pelvis')

# A small original mountain emblem, rather than logos taken from the reference.
tube('TechnologyMountainEmblem', [(-.040,-.111,1.326),(-.014,-.114,1.363),(.000,-.116,1.344),(.021,-.115,1.376),(.046,-.109,1.326)], .0023, lettering, 'spine_03')
for side in [-1,1]:
    tube('JacketBlueCuff', [(side*.646,-.003,1.454),(side*.646,.025,1.423),(side*.646,.072,1.422)], .0045, accent, 'lowerarm_'+('l' if side==1 else 'r'))

# Join with identical bind transforms and bone groups; leave all clips unchanged.
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
for obj in added: obj.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
body.data.name = 'AlejandroExplorerCharacter'
# The larger pack changes the resting surface of the defeat pose. Correct that
# clip's pelvis height in the asset; locomotion clips and the game root stay fixed.
defeated = bpy.data.actions['Defeated']
arm.animation_data.action = defeated
contacts = []
start, end = defeated.frame_range
for frame in range(int(start), int(end)+1):
    scene.frame_set(frame)
    obj = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    low = min((obj.matrix_world@v.co).z for v in obj.data.vertices)
    pelvis = arm.pose.bones['pelvis']
    pelvis.matrix = Matrix.Translation((0, 0, max(0, .004-low)/root.scale.z))@pelvis.matrix
    contacts.append((frame, pelvis.location.copy()))
for frame, location in contacts:
    arm.pose.bones['pelvis'].location = location
    arm.pose.bones['pelvis'].keyframe_insert('location', frame=frame)
for curve in defeated.fcurves:
    for point in curve.keyframe_points: point.interpolation = 'LINEAR'
arm.animation_data.action = None
for bone in arm.pose.bones: bone.matrix_basis = Matrix.Identity(4)
scene.frame_set(0)
root['design'] = 'Technology explorer: blue aviators, short beard, navy jacket, sand cargo, technical backpack, watch and trail shoes'
root['previousApprovedDesign'] = 'assets/characters/alejandro-phase3/approval.json; preserved unchanged'
scene['phase'] = '3 revision — explorer design awaiting visual approval'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'alejandro.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'alejandro.glb'), export_format='GLB', export_yup=True, export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_range=False, export_image_format='AUTO', export_extras=True)
report = {'phase':3,'revision':'explorer','status':'awaiting-visual-approval','previousApprovedBlendSHA256':hashlib.sha256(original).hexdigest(),'originalsModified':False,'animationChanges':'Defeated pelvis contact adjusted for the larger pack; other nine actions unchanged','gameplayChanged':False,'license':'CC0 1.0 original Quaternius base; new geometric accessories authored for Lora25','referenceScope':'Human clothing and accessories; no dragon, borrowed logos or scenery integrated'}
(OUT/'build-report.json').write_text(json.dumps(report, indent=2)+'\n')
print('LORA25_EXPLORER_BUILT', OUT)
