"""Render the Knightfall Staunton set with Blender 4.3 and Pillow.
blender -b -P art/render-pieces.py
For the 2D board: blender -b -P art/render-pieces.py -- --flat
For WebGL: blender -b -P art/render-pieces.py -- --models
"""
import bpy
from mathutils import Vector
from math import sin, cos, pi, radians, atan2
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess
import sys

flat = '--flat' in sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else False

OUT=Path(__file__).resolve().parent.parent / 'public/pieces'
if flat:
    OUT = OUT / 'flat'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=False
scene.render.threads_mode='FIXED'
scene.render.threads=6
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.resolution_x=320
scene.render.resolution_y=384
scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'

def material(name, rgb, roughness=.23, metallic=.12):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value=(*rgb,1)
    b.inputs['Metallic'].default_value=metallic
    b.inputs['Roughness'].default_value=roughness
    b.inputs['Coat Weight'].default_value=.31
    b.inputs['Coat Roughness'].default_value=.17
    return m

ivory=material('warm white porcelain',(.81,.69,.54),.217,.11)
cream=material('polished ivory piping',(.74,.60,.40),.24,.25)
ebony=material('obsidian violet',(.041,.030,.059),.228,.22)
plum=material('black nickel piping',(.074,.054,.10),.235,.28)
white_eye=material('ivory detail',(.30,.227,.15),.23,.13)
black_eye=material('obsidian detail',(.015,.011,.023),.19,.13)
world=bpy.data.worlds.new('ambient studio')
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.47,.46,.59,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.world=world

def light(name,loc,power,size,colour,shape='DISK',size_y=0):
    d=bpy.data.lights.new(name,'AREA')
    d.energy=power
    d.shape=shape
    d.size=size
    if shape=='RECTANGLE':d.size_y=size_y
    d.color=colour
    ob=bpy.data.objects.new(name,d)
    scene.collection.objects.link(ob)
    ob.location=loc
    ob.rotation_euler=(Vector((0,0,.6))-ob.location).to_track_quat('-Z','Y').to_euler()
light('large warm key',(-4,-4,6),520,4.3,(1,.939,.857))
light('right vertical reflection',(4,-1,3.5),290,1.3,(.84,.86,1),'RECTANGLE',4.2)
light('rim and crown',(0,4,4.2),650,3.4,(.72,.68,1))
light('broad frontal fill',(0,-4,1.1),60,3.0,(.89,.85,1))
cam=bpy.data.cameras.new('orthographic')
camera=bpy.data.objects.new('camera',cam)
scene.collection.objects.link(camera)
focus=Vector((0,0,.52))
# A centered orthographic view keeps one anchor valid for every sprite.
elevation = radians(12 if flat else 42)
if flat:
    focus = Vector((0, 0, .66))
camera.location=focus+Vector((0,-9*cos(elevation),9*sin(elevation)))
camera.rotation_euler=(focus-camera.location).to_track_quat('-Z','Y').to_euler()
cam.type='ORTHO'
cam.ortho_scale=1.5
scene.camera=camera

def mesh(name,verts,faces,mat,smooth=True):
    m=bpy.data.meshes.new(name)
    m.from_pydata(verts,[],faces)
    m.update()
    ob=bpy.data.objects.new(name,m)
    scene.collection.objects.link(ob)
    m.materials.append(mat)
    if smooth:
        for f in m.polygons:f.use_smooth=True
    return ob

def lathe(name,profile,mat,segments=96):
    verts=[(max(.00001,r)*cos(t*2*pi/segments), max(.00001,r)*sin(t*2*pi/segments),z) for r,z in profile for t in range(segments)]
    faces=[]
    for j in range(len(profile)-1):
        for i in range(segments):
            a=j*segments+i
            b=j*segments+(i+1)%segments
            faces.append((a,b,b+segments,a+segments))
    faces+=[tuple(reversed(range(segments))),tuple(range(len(verts)-segments,len(verts)))]
    return mesh(name,verts,faces,mat)

def ellipsoid(name,loc,scale,mat,rot=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc)
    o=bpy.context.object
    o.name=name
    o.scale=scale
    o.rotation_euler.y=rot
    o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=True
    return o

def rim(r,z,mat,fat=.009):
    return lathe('turned bead',[(r+fat*cos(a*pi/8),z+fat*sin(a*pi/8)) for a in range(17)],mat)

def base(r,mat,trim):
    return lathe('turned plinth',[(r*a,z) for a,z in [
        (.81,.007),(.91,.009),(.96,.019),(.992,.033),(1,.048),(.991,.059),
        (.971,.070),(.947,.076),(.925,.080),(.923,.089),(.945,.097),(.95,.106),
        (.939,.116),(.905,.123),(.866,.13),(.835,.147),(.798,.164),(.76,.177),
        (.715,.188),(.697,.201),(.710,.206),(.732,.212),(.736,.221),
        (.723,.230),(.685,.236),(.57,.240),(.01,.241)
    ]],mat)

def stem(r,zend,collar,mat,thick=1):
    h=zend-.222
    lathe('curved baluster',[(r*rr*thick,.223+h*zz) for rr,zz in [
        (.69,0),(.65,.04),(.57,.085),(.49,.16),(.42,.26),(.37,.37),(.334,.50),
        (.322,.64),(.337,.76),(.367,.86),(.419,.934),(.50,.985),(.53,1)]],mat)
    lathe('overhanging collar',[(rr*collar,zend+dz) for rr,dz in [
        (.70,-.028),(.86,-.024),(.965,-.014),(1,-.004),(.995,.006),(.947,.018),
        (.80,.026),(.742,.032),(.744,.040),(.81,.045),(.86,.052),
        (.865,.060),(.83,.068),(.711,.072),(.5,.073)]],mat)

def horse(mat,trim,detail):
    # The crest, chest, cheeks, forehead and muzzle share overlapping rounded
    # carving surfaces. Elliptical lofts narrow behind the jaw.
    horse_parts_before=set(bpy.data.objects)
    ring_n=48
    neck_sections=[
        (.015,.175,.127,.238),(.026,.208,.150,.275),(.036,.222,.153,.327),
        (.043,.209,.144,.414),(.050,.181,.124,.518),(.060,.145,.107,.651),
        (.056,.119,.102,.729),(.035,.123,.104,.828),(.004,.118,.108,.901),
        (-.015,.092,.091,.943)]
    verts=[(cx+rx*cos(i*2*pi/ring_n),ry*sin(i*2*pi/ring_n),z) for cx,rx,ry,z in neck_sections for i in range(ring_n)]
    faces=[(j*ring_n+i,j*ring_n+(i+1)%ring_n,(j+1)*ring_n+(i+1)%ring_n,(j+1)*ring_n+i) for j in range(len(neck_sections)-1) for i in range(ring_n)]
    faces.extend([tuple(reversed(range(ring_n))),tuple(range(len(verts)-ring_n,len(verts)))])
    ob=mesh('arched neck',verts,faces,mat)
    sub=ob.modifiers.new('sculpt smoothing','SUBSURF');sub.levels=2
    # Cross-sections sag forward toward the muzzle.
    face_sections=[(.125,.844,.112,.054),(.09,.857,.142,.09),(.045,.868,.151,.112),
                   (0,.861,.145,.124),(-.054,.849,.132,.121),(-.103,.833,.116,.106),
                   (-.15,.81,.093,.088),(-.206,.776,.079,.077),(-.248,.752,.076,.070),
                   (-.293,.737,.074,.061),(-.317,.741,.055,.04),(-.325,.745,.020,.019)]
    verts=[(x,ry*cos(i*2*pi/ring_n),z+rz*sin(i*2*pi/ring_n)) for x,z,rz,ry in face_sections for i in range(ring_n)]
    faces=[(j*ring_n+i,(j+1)*ring_n+i,(j+1)*ring_n+(i+1)%ring_n,j*ring_n+(i+1)%ring_n) for j in range(len(face_sections)-1) for i in range(ring_n)]
    faces.extend([tuple(range(ring_n)),tuple(reversed(range(len(verts)-ring_n,len(verts))))])
    o=mesh('carved face',verts,faces,mat)
    sub=o.modifiers.new('smooth carving','SUBSURF');sub.levels=2
    for s in [-1,1]:
        ellipsoid('lower jaw',(-.101,.055*s,.765),(.113,.057,.054),mat,-.39)
        ellipsoid('sculpted cheek',(-.039,.082*s,.82),(.080,.036,.083),mat,.18)
        ellipsoid('eye rail',(-.113,.094*s,.888),(.048,.022,.015),mat,-.24)
        ellipsoid('eye',(-.117,.098*s,.871),(.021,.012,.015),detail,-.23)
        ellipsoid('nostril',(-.275,.057*s,.757),(.020,.008,.011),detail,-.48)
        # Small pointed tulip-shaped ears.
        n=16;levels=[(.008,.053*s,.958,.037,.031),(.005,.063*s,.992,.030,.027),
                      (.017,.080*s,1.052,.017,.015),(.027,.09*s,1.074,.003,.002)]
        verts=[(x+rx*cos(i*2*pi/n),y+ry*sin(i*2*pi/n),z) for x,y,z,rx,ry in levels for i in range(n)]
        faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(levels)-1) for i in range(n)]
        ob=mesh('tapered ear',verts,faces,mat)
        sub=ob.modifiers.new('soft ear','SUBSURF');sub.levels=2
    # Thick ridges follow the outer curve of the mane down the back.
    mane=[(.076,.949,.100),(.106,.911,.110),(.129,.866,.106),(.145,.820,.104),
          (.154,.774,.101),(.163,.725,.098),(.182,.679,.098),(.20,.628,.099),
          (.219,.577,.095),(.235,.529,.088),(.246,.477,.081),(.246,.431,.070)]
    for x,z,d in mane:
        ellipsoid('mane ridge',(x,0,z),(.046,.083,d),mat,-.50)
    group=bpy.data.objects.new('knight profile',None)
    scene.collection.objects.link(group)
    for ob in set(bpy.data.objects)-horse_parts_before-{group}:ob.parent=group
    group.rotation_euler.z=radians(8 if flat else 23)

def rook(mat):
    stem(.30,.586,.207,mat,1.22)
    lathe('castle wall',[(.14,.638),(.17,.646),(.193,.657),(.204,.676),(.205,.721),(.197,.737),(.15,.744),(.138,.735),(.001,.735)],mat)
    for k in range(6):
        a0=2*pi*k/6+.06; a1=2*pi*(k+.68)/6
        pts=[a0+(a1-a0)*i/7 for i in range(8)]
        verts=[(r*cos(a),r*sin(a),z) for z in [.721,.814] for r in [.201,.144] for a in pts]
        faces=[]
        for i in range(7):
            faces.extend([(i,i+1,17+i,16+i),(8+i,24+i,25+i,9+i),(16+i,17+i,25+i,24+i)])
        faces.extend([(0,16,24,8),(7,15,31,23)])
        o=mesh('battlement',verts,faces,mat,False)
        mod=o.modifiers.new('subtle edge bevel','BEVEL');mod.width=.009;mod.segments=3
        o.modifiers.new('soft normals','WEIGHTED_NORMAL')

def bishop(mat):
    stem(.30,.703,.189,mat)
    mitre=lathe('split mitre',[(.087,.760),(.104,.775),(.135,.795),(.153,.824),(.161,.855),(.157,.887),
         (.145,.92),(.126,.95),(.102,.982),(.076,1.01),(.054,1.033),(.033,1.056),(.021,1.074)],mat)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(-.096,0,1.01))
    cut=bpy.context.object
    cut.dimensions=(.030,.56,.32)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    cut.rotation_euler.y=-.54
    b=mitre.modifiers.new('mitre diagonal notch','BOOLEAN');b.operation='DIFFERENCE';b.object=cut
    bpy.context.view_layer.objects.active=mitre
    bpy.ops.object.modifier_apply(modifier=b.name)
    bpy.data.objects.remove(cut,do_unlink=True)
    ellipsoid('bishop tip',(0,0,1.083),(.036,.036,.037),mat)

def queen(mat):
    stem(.319,.806,.218,mat)
    lathe('queen coronet',[(.105,.866),(.121,.885),(.131,.917),(.144,.949),(.165,.975),(.183,.992),(.192,1.005),(.188,1.018),(.171,1.027)],mat)
    segs=112
    verts=[]
    for r,z,amp in [(.176,1.012,0),(.189,1.04,.013),(.197,1.071,.041),(.18,1.074,.041),(.155,1.044,.017)]:
        for i in range(segs):
            a=i*2*pi/segs
            crest=(.5+.5*cos(7*a))**2
            verts.append(((r+.009*crest)*cos(a),(r+.009*crest)*sin(a),z+amp*crest))
    faces=[(j*segs+i,j*segs+(i+1)%segs,(j+1)*segs+(i+1)%segs,(j+1)*segs+i) for j in range(4) for i in range(segs)]
    mesh('seven-prong diadem',verts,faces,mat)
    for i in range(7):
        a=i*2*pi/7
        ellipsoid('crown pearl',(.202*cos(a),.202*sin(a),1.113),(.022,.022,.024),mat)
    ellipsoid('queen cap',(0,0,1.039),(.148,.148,.082),mat)
    ellipsoid('queen finial',(0,0,1.142),(.049,.049,.052),mat)

def king(mat):
    stem(.332,.842,.217,mat)
    lathe('royal crown',[(.101,.903),(.13,.923),(.152,.95),(.178,.979),(.192,1.012),(.201,1.044),
         (.204,1.064),(.196,1.083),(.166,1.099),(.125,1.107),(.096,1.119),(.064,1.13),(.05,1.143)],mat)
    rim(.198,1.063,mat,.011)
    profile=[(-.038,1.112),(.038,1.112),(.032,1.213),(.098,1.21),(.098,1.27),(.032,1.264),
              (.04,1.342),(-.04,1.342),(-.032,1.264),(-.098,1.27),(-.098,1.21),(-.032,1.213)]
    n=len(profile)
    verts=[(x,y,z) for y in [-.037,.037] for x,z in profile]
    faces=[tuple(range(n)),tuple(reversed(range(n,2*n)))]+[(i,n+i,n+(i+1)%n,(i+1)%n) for i in range(n)]
    cross=mesh('rounded cross',verts,faces,mat,False)
    cross.rotation_euler.z=.16
    b=cross.modifiers.new('rounded edges','BEVEL');b.width=.012;b.segments=4
    cross.modifiers.new('polished normals','WEIGHTED_NORMAL')

def make(col,piece):
    mat,trim,detail=(ivory,cream,white_eye) if col=='w' else (ebony,plum,black_eye)
    r={'p':.251,'n':.298,'b':.30,'r':.31,'q':.319,'k':.332}[piece]
    base(r,mat,trim)
    rim(r*.928,.085,trim,.005)
    if piece=='p':
        stem(.251,.416,.143,mat)
        ellipsoid('pawn head',(0,0,.579),(.131,.131,.141),mat)
    elif piece=='n':horse(mat,trim,detail)
    elif piece=='r':rook(mat)
    elif piece=='b':bishop(mat)
    elif piece=='q':queen(mat)
    elif piece=='k':king(mat)
def export_models():
    models = []
    for kind in "pnbrqk":
        before = set(bpy.data.objects)
        make('w', kind)
        bpy.context.view_layer.update()
        parts = [ob for ob in set(bpy.data.objects) - before if ob.type == 'MESH']
        bpy.ops.object.select_all(action='DESELECT')
        for ob in parts:
            # Bake the sculpt and parent transform before joining the carved details.
            matrix = ob.matrix_world.copy()
            ob.parent = None
            ob.matrix_world = matrix
            bpy.context.view_layer.objects.active = ob
            for modifier in list(ob.modifiers):
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            if len(ob.data.polygons) > 220:
                low = ob.modifiers.new('game resolution', 'DECIMATE')
                low.ratio = .13
                bpy.ops.object.modifier_apply(modifier=low.name)
            ob.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        model = bpy.context.view_layer.objects.active
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        model.name = kind
        models.append(model)
    bpy.ops.object.select_all(action='DESELECT')
    for model in models:
        model.select_set(True)
    dest = OUT.parent / 'models' / 'staunton.glb'
    dest.parent.mkdir(exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(dest), use_selection=True, export_texcoords=False,
        export_animations=False, export_cameras=False, export_lights=False)

if '--models' in sys.argv:
    export_models()
    sys.exit(0)

# Every flat sprite has the same square canvas. Different pieces keep their visual
# weight, while the broad profile and low camera make the crowns legible at 40px.
flat_heights = {'k': 216, 'q': 209, 'b': 200, 'n': 192, 'r': 178, 'p': 151}
encode_flat = """
from PIL import Image, ImageFilter
import sys
im = Image.open(sys.argv[1]).convert('RGBA')
im = im.crop(im.getchannel('A').getbbox())
height = int(sys.argv[3])
width = round(im.width * height / im.height * 1.20)
im = im.resize((width, height), Image.Resampling.LANCZOS)
tile = Image.new('RGBA', (256, 256))
tile.alpha_composite(im, ((256 - width) // 2, (256 - height) // 2))
if sys.argv[4] == 'w':
    # A narrow warm contour separates ivory from the light squares at phone sizes.
    alpha = tile.getchannel('A').filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(.8))
    edge = Image.new('RGBA', tile.size, (84, 64, 56, 0))
    edge.putalpha(alpha.point(lambda value: round(value * .72)))
    edge.alpha_composite(tile)
    tile = edge
tile.save(sys.argv[2], quality=94, method=6, exact=True)
"""
temp = TemporaryDirectory()
for col in ['w','b']:
    for piece in ['n','k','q','b','p','r']:
        before=set(bpy.data.objects)
        make(col,piece)
        scene.render.filepath=str(Path(temp.name)/f'{col}{piece}.png')
        bpy.ops.render.render(write_still=True)
        if flat:
            subprocess.run(['python3', '-c', encode_flat, scene.render.filepath, str(OUT/f'{col}{piece}.webp'), str(flat_heights[piece]), col], check=True)
        else:
            subprocess.run(['python3', '-c', "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGBA').save(sys.argv[2], quality=93, method=6, exact=True)", scene.render.filepath, str(OUT/f'{col}{piece}.webp')], check=True)
        for ob in set(bpy.data.objects)-before:bpy.data.objects.remove(ob,do_unlink=True)
temp.cleanup()
