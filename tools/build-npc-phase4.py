"""Author the three stationary mission NPCs from verified Quaternius CC0 sources.

Outputs are isolated review assets; never overwrites published characters.
"""
import bpy, bmesh, math, json, hashlib
from pathlib import Path
from mathutils import Matrix, Vector
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'assets/characters/npc-phase4'
OUT.mkdir(parents=True, exist_ok=True)
library = ROOT/'assets/character-library'
sources = json.loads((library/'inspection.json').read_text())['results']
checks = json.loads((library/'checksums.json').read_text())['files']
for item in checks:
    assert hashlib.sha256((library/'originals'/item['path']).read_bytes()).hexdigest() == item['sha256'], item['path']

DESIGNS = [
    {'id':'juan','name':'Juan','role':'DevOps','source':'Casual_Hoodie.gltf','height':1.76},
    {'id':'sara','name':'Sara','role':'Backend','source':'modular-women/Individual Characters/glTF/Casual.gltf','height':1.70},
    {'id':'david','name':'David','role':'LAB','source':'Suit.gltf','height':1.82},
]
reports = []
for design in DESIGNS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene; scene.render.fps = 30
    source = next(item for item in sources if item['source'].endswith(design['source']))
    bpy.ops.import_scene.gltf(filepath=source['inspectionFile'])
    arm = next(obj for obj in scene.objects if obj.type == 'ARMATURE')
    arm.name = 'NPCRig'
    action_sources = {track.name:track.strips[0].action for track in arm.animation_data.nla_tracks}
    arm.animation_data.action = None
    for track in list(arm.animation_data.nla_tracks): arm.animation_data.nla_tracks.remove(track)
    for bone in arm.pose.bones: bone.matrix_basis = Matrix.Identity(4)
    scene.frame_set(0)
    for obj in list(scene.objects):
        if obj.type == 'MESH' and (not obj.vertex_groups or obj.name == 'Pistol'):
            bpy.data.objects.remove(obj, do_unlink=True)
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']

    def material(name, color, roughness=.85, metallic=0):
        mat = bpy.data.materials.new(design['name']+name); mat.use_nodes = True
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*color,1)
        shader.inputs['Roughness'].default_value = roughness
        shader.inputs['Metallic'].default_value = metallic
        return mat

    def tint(name, color, roughness=.85):
        mat = bpy.data.materials.get(name)
        if mat is None: return None
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*color,1)
        shader.inputs['Roughness'].default_value = roughness
        return mat

    trim = material('GraphiteTrim',(.014,.021,.028))
    metal = material('BrushedMetal',(.30,.34,.36),.38,.65)
    ivory = material('CottonIvory',(.72,.71,.67),.96)
    blue = material('TechnologyBlue',(.027,.24,.38),.62)
    amber = material('LABAmber',(.76,.30,.045),.75)
    teal = material('BackendTeal',(.018,.15,.16),.84)
    denim = material('GraphiteDenim',(.026,.039,.059),.95)
    # Authentic source face, hands, hair and shoes are retained and personalized.
    tint('Skin', {'juan':(.50,.29,.16),'sara':(.62,.38,.25),'david':(.65,.44,.29)}[design['id']],.88)
    tint('Eye',(.011,.013,.017),.45)
    tint('Eyebrows',(.035,.026,.021),.85)
    if design['id']=='juan':
        hoodie=tint('Purple',(.16,.031,.041)); tint('White',(.66,.65,.60),.95)
        tint('Hair',(.036,.022,.013),.88); tint('LightBlue',(.026,.039,.059),.95)
    elif design['id']=='sara':
        tint('Hair_Brown',(.030,.018,.010));tint('Hair_Blond',(.065,.029,.013),.86)
        tint('White',(.018,.15,.16));tint('Grey',(.018,.026,.031),.94)
        tint('Brown',(.12,.070,.027));tint('Orange',(.030,.045,.061),.95)
        legs=next(obj for obj in meshes if 'Legs' in obj.name)
        legs.data.materials.append(denim)
        for poly in legs.data.polygons:
            if legs.data.materials[poly.material_index].name not in ['Skin']:poly.material_index=len(legs.data.materials)-1
    else:
        coat=tint('Suit',(.72,.73,.70),.94); tint('Suit.001',(.026,.039,.059),.95)
        tint('White',(.055,.10,.13),.94); tint('Tie',(.60,.23,.035),.90)
        tint('Hair',(.26,.28,.29),.89); tint('Eyebrows',(.14,.15,.16),.86);tint('Black',(.017,.021,.023),.82)
        body=next(obj for obj in meshes if obj.name=='Suit_Body')
        # A suit's closed bottom must not become a solid cap across the thighs
        # when lengthened into a coat. Open that underside and flare the cloth
        # outside the trousers, retaining the original skin weights.
        bm=bmesh.new();bm.from_mesh(body.data)
        caps=[face for face in bm.faces
              if body.data.materials[face.material_index]==coat
              and max(vertex.co.z for vertex in face.verts)<1.09
              and abs(face.normal.z)>.70]
        bmesh.ops.delete(bm,geom=caps,context='FACES')
        bm.to_mesh(body.data);bm.free();body.data.update()
        hem={index for poly in body.data.polygons if body.data.materials[poly.material_index]==coat for index in poly.vertices if body.data.vertices[index].co.z<1.09}
        lowest=min(body.data.vertices[index].co.z for index in hem)
        for index in hem:
            vertex=body.data.vertices[index]
            flare=max(0,1-(vertex.co.z-lowest)/(1.09-lowest))
            vertex.co.x*=1+.30*flare
            vertex.co.y=-.055+(vertex.co.y+.055)*(1+.85*flare)
            vertex.co.z-=.17*flare

    # Nearest-source weights keep seams and small fabric details moving with clothing.
    positions=[]; weights=[]
    for obj in meshes:
        for vertex in obj.data.vertices:
            positions.append(vertex.co.copy())
            weights.append([(obj.vertex_groups[g.group].name,g.weight) for g in vertex.groups])
    tree=KDTree(len(positions))
    for i,point in enumerate(positions):tree.insert(point,i)
    tree.balance()
    def attach(obj,bone=None):
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        if obj.type!='MESH':bpy.ops.object.convert(target='MESH');obj=bpy.context.object
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        obj.parent=arm
        if bone:obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))),1,'REPLACE')
        else:
            for vertex in obj.data.vertices:
                _,index,_=tree.find(vertex.co)
                for name,weight in weights[index]:
                    group=obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                    group.add([vertex.index],weight,'REPLACE')
        modifier=obj.modifiers.new('NPCSkinning','ARMATURE');modifier.object=arm
        for poly in obj.data.polygons:poly.use_smooth=True
        meshes.append(obj)
        return obj
    def box(name,center,size,mat,bevel=.004,bone=None):
        bpy.ops.mesh.primitive_cube_add(size=1,location=center);obj=bpy.context.object;obj.name=design['name']+name;obj.dimensions=size
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);obj.data.materials.append(mat)
        if bevel:
            modifier=obj.modifiers.new('RoundedDetail','BEVEL');modifier.width=bevel;modifier.segments=2
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        return attach(obj,bone)
    def tube(name,points,radius,mat,bone=None):
        curve=bpy.data.curves.new(design['name']+name,'CURVE');curve.dimensions='3D';curve.resolution_u=4;curve.bevel_depth=radius;curve.bevel_resolution=2
        spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
        for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
        obj=bpy.data.objects.new(design['name']+name,curve);scene.collection.objects.link(obj);curve.materials.append(mat)
        return attach(obj,bone)
    def front(x,z):
        values=[p.y for p in positions if abs(p.x-x)<.032 and abs(p.z-z)<.035]
        return min(values) if values else -.12
    def badge(x,z,mat):
        y=front(x,z)-.016
        box('StaffBadge',(x,y,z),(.055,.008,.035),trim,.004)
        box('BadgeAccent',(x-.016,y-.006,z),(.006,.004,.023),mat,.001)
        for height in [z-.006,z+.005]:box('BadgeLine',(x+.006,y-.006,height),(.027,.003,.002),ivory,.0006)
    def glasses():
        for side in [-1,1]:
            x=side*eye_x;y=eye_y-.007;z=eye_z
            tube('OpticalFrame',[(x-.027,y,z+.017),(x+.027,y,z+.017),(x+.026,y,z-.014),(x-.027,y,z-.014),(x-.027,y,z+.017)],.0016,metal,'Head')
            tube('OpticalTemple',[(side*(eye_x+.028),y,z+.012),(side*.089,-.062,z+.012),(side*.089,.001,z)],.0015,trim,'Head')
        tube('OpticalBridge',[(-.008,eye_y-.007,eye_z+.008),(0,eye_y-.017,eye_z+.010),(.008,eye_y-.007,eye_z+.008)],.0017,metal,'Head')

    # Replace the source's square black eye treatment with curved sclera/irises,
    # and add a subtle mouth. The original authentic head and rig stay intact.
    head=next(obj for obj in meshes if 'Head' in obj.name)
    eye_name='Brown' if design['id']=='sara' else 'Eye'
    eye_points=[head.data.vertices[index].co.copy() for poly in head.data.polygons if head.data.materials[poly.material_index].name==eye_name for index in poly.vertices]
    eye_z=sum(point.z for point in eye_points)/len(eye_points)
    eye_x=sum(abs(point.x) for point in eye_points)/len(eye_points)
    eye_y=min(point.y for point in eye_points)-.002
    iris=material('Iris',(.11,.061,.024) if design['id']!='david' else (.09,.16,.20),.62)
    pupil=material('Pupil',(.004,.005,.006),.4)
    lips=material('NaturalLip',(.29,.13,.092),.86)
    skin_index=next(i for i,mat in enumerate(head.data.materials) if mat.name=='Skin')
    for poly in head.data.polygons:
        if head.data.materials[poly.material_index].name==eye_name:poly.material_index=skin_index
    def eye_disc(name,x,y,z,width,height,mat):
        vertices=[(x,y-.001,z)]+[(x+width*math.cos(i*math.tau/24),y,z+height*math.sin(i*math.tau/24)) for i in range(24)]
        faces=[(0,i+1,(i+1)%24+1) for i in range(24)]
        data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.materials.append(mat)
        obj=bpy.data.objects.new(design['name']+name,data);scene.collection.objects.link(obj);attach(obj,'Head')
    for side in [-1,1]:
        eye_disc('Sclera',side*eye_x,eye_y,eye_z,.017,.0075,ivory)
        eye_disc('Iris',side*eye_x,eye_y-.002,eye_z,.0050,.0062,iris)
        eye_disc('Pupil',side*eye_x,eye_y-.0035,eye_z,.0022,.0035,pupil)
        tube('UpperEyelid',[(side*eye_x-.018,eye_y-.001,eye_z),(side*eye_x,eye_y-.001,eye_z+.008),(side*eye_x+.018,eye_y-.001,eye_z)],.0012,trim,'Head')
    mouth_z=eye_z-.085
    def mouth_front(x):
        points=[v.co.y for v in head.data.vertices if abs(v.co.x-x)<.020 and abs(v.co.z-mouth_z)<.009]
        return min(points)-.0015 if points else -.13
    tube('Mouth',[(-.019,mouth_front(-.019),mouth_z+.002),(0,mouth_front(0),mouth_z),(.019,mouth_front(.019),mouth_z+.002)],.0012,lips,'Head')

    if design['id']=='juan':
        for side in [-1,1]:
            tube('HoodDrawcord',[(side*.055,front(side*.055,1.48)-.012,1.48),(side*.047,front(side*.047,1.40)-.016,1.40)],.003,ivory,'Chest')
            box('CordTip',(side*.047,front(side*.047,1.40)-.018,1.393),(.006,.007,.015),metal,.002,'Chest')
        badge(.11,1.36,blue)
        # A compact laptop sleeve and padded backpack communicate the DevOps role.
        box('LaptopBackpack',(0,.174,1.265),(.235,.105,.32),trim,.024,'Torso')
        box('PackPocket',(0,.240,1.20),(.18,.027,.11),hoodie,.012,'Torso')
        for side in [-1,1]:
            tube('BackpackStrap',[(side*.075,.164,1.41),(side*.103,.005,1.486),(side*.112,front(side*.112,1.39)-.014,1.39),(side*.127,-.115,1.19)],.012,trim)
        tube('CloudRoleEmblem',[(-.031,front(0,1.26)-.015,1.27),(-.020,front(0,1.26)-.015,1.292),(.001,front(0,1.26)-.015,1.302),(.027,front(0,1.26)-.015,1.281),(.031,front(0,1.26)-.015,1.264),(-.031,front(0,1.26)-.015,1.264)],.002,blue,'Chest')
        glasses()
    elif design['id']=='sara':
        badge(.095,1.36,teal)
        tube('BackendChestEmblem',[(-.024,front(0,1.27)-.015,1.28),(-.038,front(0,1.27)-.015,1.266),(-.024,front(0,1.27)-.015,1.252)],.002,ivory,'Chest')
        tube('BackendChestEmblem',[(.024,front(0,1.27)-.015,1.28),(.038,front(0,1.27)-.015,1.266),(.024,front(0,1.27)-.015,1.252)],.002,ivory,'Chest')
        box('LaptopSatchel',(-.178,.087,.98),(.12,.072,.213),trim,.018,'Hips')
        box('SatchelTealPocket',(-.182,.13,.96),(.091,.015,.103),teal,.010,'Hips')
        tube('SatchelStrap',[(-.18,.06,.98),(-.12,front(-.12,1.20)-.018,1.20),(.115,front(.115,1.40)-.018,1.40),(.12,.005,1.49)],.009,trim)
        box('Smartwatch',(.55,-.11,1.44),(.029,.029,.044),trim,.006,'Wrist.L')
        box('WatchDisplay',(.55,-.128,1.44),(.021,.007,.029),blue,.002,'Wrist.L')
        for side in [-1,1]:box('SmallSilverEarring',(side*.080,-.049,1.666),(.009,.008,.015),metal,.003,'Head')
    else:
        badge(.12,1.37,amber)
        glasses()
        tube('CoatPocketOpening',[(.081,front(.1,1.26)-.015,1.26),(.142,front(.1,1.26)-.015,1.26)],.0025,metal,'Chest')
        for x in [.10,.117]:
            tube('LabPen',[(x,front(.1,1.26)-.021,1.259),(x,front(.1,1.30)-.020,1.309)],.002,blue,'Chest')
        box('DiagnosticTablet',(-.182,.047,.951),(.104,.027,.160),trim,.008,'Hips')
        box('DiagnosticDisplay',(-.182,.026,.954),(.084,.006,.129),blue,.004,'Hips')
        for z in [1.18,1.09,.98]:
            box('CoatButton',(0,front(0,z)-.014,z),(.008,.006,.008),metal,.003)

    # Smooth matching source corners without welding vertices or changing weights.
    # Material boundaries preserve clothing edges and eyebrows.
    for obj in meshes:
        data=obj.data;data.update();averages={}
        def key(index,material_index):
            return (*[round(value,5) for value in data.vertices[index].co],material_index)
        for poly in data.polygons:
            poly.use_smooth=True
            for index in poly.vertices:
                k=key(index,poly.material_index)
                averages[k]=averages.get(k,Vector((0,0,0)))+poly.normal*poly.area
        normals=[(0,0,1)]*len(data.loops)
        for poly in data.polygons:
            for index in poly.loop_indices:
                value=averages[key(data.loops[index].vertex_index,poly.material_index)]
                normals[index]=tuple(value.normalized()) if value.length else tuple(poly.normal)
        data.normals_split_custom_set(normals)

    # Export only stationary repose, conversation gesture and optional greeting.
    # Walk/run/combat clips and source weapon/helper meshes are intentionally absent.
    kept=[]
    for name,source_name in [('Idle','Idle_Neutral'),('Interact','Interact'),('Wave','Wave')]:
        action=action_sources[source_name].copy();action.name=name
        track=arm.animation_data.nla_tracks.new();track.name=name
        strip=track.strips.new(name,0,action);strip.action_frame_start=action.frame_range[0];strip.action_frame_end=action.frame_range[1];track.mute=True
        kept.append(action)
    for action in list(bpy.data.actions):
        if action not in kept:bpy.data.actions.remove(action)
    # Rename after removing originals, which occupied Idle/Interact/Wave names.
    for track,action in zip(arm.animation_data.nla_tracks,kept):action.name=track.name
    root=bpy.data.objects.new('NPCVisual',None);scene.collection.objects.link(root);arm.parent=root
    height=source['restMeshBounds']['size'][1];scale=design['height']/height
    root.scale=(scale,)*3;root.rotation_euler.z=math.pi;root.location.z=.005
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:obj.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();mesh=bpy.context.object;mesh.name='NPCCharacterMesh'
    # Floor correction belongs to authored animation, not movement or game physics.
    sole={vertex.index for vertex in mesh.data.vertices if vertex.co.z<.18 and any(mesh.vertex_groups[g.group].name.startswith(('Foot','Toes')) and g.weight>.5 for g in vertex.groups)}
    if not sole:raise RuntimeError('No sole vertices for '+design['name'])
    for track in arm.animation_data.nla_tracks:
        action=track.strips[0].action;arm.animation_data.action=action
        start,end=action.frame_range;contacts=[]
        for i in range(int(round((end-start)*2))+1):
            frame=start+i*.5;scene.frame_set(int(frame),subframe=frame-int(frame))
            obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
            # All standing surfaces matter: some source toe vertices are weighted
            # to calf/helper bones rather than Foot/Toes and must also clear floor.
            low=min((obj.matrix_world@vertex.co).z for vertex in obj.data.vertices)
            # In these modular rigs the leg chains are siblings of Hips. Move
            # their common skeleton root vertically; the game entity stays fixed.
            skeleton_root=arm.pose.bones['Root']
            skeleton_root.matrix=Matrix.Translation((0,0,(.004-low)/scale))@skeleton_root.matrix
            contacts.append((frame,skeleton_root.location.copy()))
        for frame,location in contacts:
            arm.pose.bones['Root'].location=location;arm.pose.bones['Root'].keyframe_insert('location',frame=frame)
        for curve in action.fcurves:
            for point in curve.keyframe_points:point.interpolation='LINEAR'
        for curve in action.fcurves:
            for point in curve.keyframe_points:point.co.x*=2;point.handle_left.x*=2;point.handle_right.x*=2
        track.strips[0].action_frame_start*=2;track.strips[0].action_frame_end*=2
        track.strips[0].frame_start=0;track.strips[0].frame_end=(end-start)*2
    scene.render.fps=60
    arm.animation_data.action=None
    for bone in arm.pose.bones:bone.matrix_basis=Matrix.Identity(4)
    scene.frame_set(0)
    root['identity']=design['name']+' — '+design['role'];root['sourceLicense']='Quaternius CC0 1.0 Universal'
    root['facing']='GLB -Z; existing 180 degree model adapter retained'
    root['gameplayIntegration']='Phase 4 isolated proposal; visual approval required before phase 5'
    scene['designStatus']='awaiting-visual-approval'
    directory=OUT/design['id'];directory.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(directory/(design['id']+'.blend')),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(directory/(design['id']+'.glb')),export_format='GLB',export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_extras=True)
    reports.append({**design,'source':source['source'],'bones':len(arm.data.bones),'exportedClips':[t.name for t in arm.animation_data.nla_tracks],'status':'awaiting-visual-approval','gameplayChanged':False,'originalsModified':False})
(OUT/'build-report.json').write_text(json.dumps({'phase':4,'npcDesigns':reports,'wardenStatus':'awaiting-selected-source-file'},indent=2)+'\n')
print('LORA25_PHASE4_NPCS_BUILT')
