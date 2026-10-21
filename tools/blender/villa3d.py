"""Modern villa, modelled and rendered in Blender (Cycles) for Flow Studio.

Run inside Blender (e.g. through the MCP for Blender add-on) with ARGS = {"out": dir, "views": [0,1,2,3],
"res": 2000, "samples": 160}. For every view it writes, into <out>/v<k>/:
  host.png       the house alone (transparent background, soft ground shadow)
  host_lit.png   the same frame with the windows lit (pack.py turns the difference into an overlay)
  <part>.png     each part alone in the same frame (solar, inverter, meter, battery), with its own shadows
  meta.json      projected part boxes, cable paths and the grid feed point, in pixels of that frame

Views turn the house in 90 degree steps under a fixed camera and sun:
  0 front faces bottom-left, 1 front faces bottom-right (back toward top-left),
  2 back faces bottom-left,  3 back faces bottom-right.
The equipment (inverter, meter, battery) hangs on whichever long facade the camera sees.
"""
import bpy, bmesh, json, math, os
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

A = globals().get('ARGS', {})
OUT = A.get('out', '/tmp/villa3d')
VIEWS = A.get('views', [0, 1, 2, 3])
RES = A.get('res', 2000)
SAMPLES = A.get('samples', 160)
ONLY = A.get('only')  # optional list of passes: host, lit, parts
PART_SAMPLES = A.get('part_samples', .75)  # parts need fewer samples (small, mostly empty)
HERE = os.path.dirname(os.path.abspath(__file__))
RESC = os.path.join(HERE, '..', 'artwork', 'resc-inverter.png')

# ---------------------------------------------------------------- scene
NAME = 'FlowVilla'
if NAME in bpy.data.scenes:
    old = bpy.data.scenes[NAME]
    for o in list(old.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.scenes.remove(old)
for m in list(bpy.data.materials):
    if m.name.startswith('fv_'):
        bpy.data.materials.remove(m)
sc = bpy.data.scenes.new(NAME)
bpy.context.window_manager.windows[0].scene = sc
root = sc.collection

def coll(name):
    c = bpy.data.collections.new('fv_' + name)
    root.children.link(c)
    return c

C = {k: coll(k) for k in ['house', 'solar', 'inverter', 'meter', 'battery', 'ground']}
rig = bpy.data.objects.new('fv_rig', None)
root.objects.link(rig)

# ---------------------------------------------------------------- materials
def mat(name, color, rough=.5, metal=0., spec=.5, coat=0., emit=None, estr=0., transmission=0., ior=1.45, alpha=1.):
    m = bpy.data.materials.new('fv_' + name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Transmission Weight'].default_value = transmission
    b.inputs['IOR'].default_value = ior
    b.inputs['Alpha'].default_value = alpha
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = estr
    return m

def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)

M = {
    'wall': mat('wall', srgb('#f1efea'), .62),
    'wall2': mat('wall2', srgb('#e4e2dd'), .6),
    'slab': mat('slab', srgb('#d9d8d4'), .55),
    'roof': mat('roof', srgb('#c9cacb'), .8),
    'frame': mat('frame', srgb('#3a3f45'), .35, .6),
    'door': mat('door', srgb('#40464d'), .4, .2),
    'rail': mat('rail', srgb('#c8ccd0'), .25, 1.),
    'glassrail': mat('glassrail', srgb('#dfeef5'), .02, transmission=1., ior=1.5),
    'shutter': mat('shutter', srgb('#d7d9db'), .35, .7),
    'deck': mat('deck', srgb('#b9b3aa'), .7),
    'wood': mat('wood', srgb('#9a6a43'), .55),
    'edge': mat('edge', srgb('#8e9296'), .45),
    'paving': mat('paving', srgb('#d9d6d0'), .75),
    'cushion': mat('cushion', srgb('#ecebe7'), .9),
    'dark': mat('dark', srgb('#2b2f34'), .5),
    'pvframe': mat('pvframe', srgb('#c3c8cc'), .3, 1.),
    'steel': mat('steel', srgb('#9aa1a8'), .35, 1.),
    'body': mat('body', srgb('#e2e3e3'), .35, coat=.4),
    'bat': mat('bat', srgb('#f4f4f3'), .3, coat=.6),
    'led': mat('led', srgb('#33c23c'), .4, emit=srgb('#3ddc47'), estr=6.),
    'meterwin': mat('meterwin', srgb('#26313b'), .1),
}

def glass_mat():
    """Window glass: sky reflection over a warm, dim interior; LIT (0..1) turns the interior lights on."""
    m = bpy.data.materials.new('fv_glass')
    m.use_nodes = True
    nt = m.node_tree
    n, l = nt.nodes, nt.links
    b = n['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb('#2c3640'), 1)
    b.inputs['Roughness'].default_value = .03
    b.inputs['Specular IOR Level'].default_value = 1.
    b.inputs['Coat Weight'].default_value = 1.
    # interior: vertical gradient (floor brighter, ceiling dimmer) in object-local Z
    tc = n.new('ShaderNodeTexCoord')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Generated'], sep.inputs[0])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*srgb('#ffad55'), 1)
    ramp.color_ramp.elements[1].color = (*srgb('#ffd393'), 1)
    l.new(sep.outputs['Z'], ramp.inputs[0])
    lit = n.new('ShaderNodeValue')
    lit.name = 'LIT'
    lit.outputs[0].default_value = 0.
    mul = n.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = 3.2
    l.new(lit.outputs[0], mul.inputs[0])
    add = n.new('ShaderNodeMath')  # a faint warm glow even by day
    add.inputs[1].default_value = .14
    l.new(mul.outputs[0], add.inputs[0])
    mix = n.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (*srgb('#d8d2c8'), 1)
    l.new(lit.outputs[0], mix.inputs['Factor'])
    l.new(ramp.outputs['Color'], mix.inputs['B'])
    l.new(mix.outputs['Result'], b.inputs['Emission Color'])
    l.new(add.outputs[0], b.inputs['Emission Strength'])
    return m

M['glass'] = glass_mat()

def set_lit(v):
    M['glass'].node_tree.nodes['LIT'].outputs[0].default_value = v

def pv_mat():
    m = bpy.data.materials.new('fv_pv')
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    b = n['Principled BSDF']
    b.inputs['Roughness'].default_value = .12
    b.inputs['Specular IOR Level'].default_value = .9
    b.inputs['Coat Weight'].default_value = .8
    tc = n.new('ShaderNodeTexCoord')
    br = n.new('ShaderNodeTexBrick')
    br.offset = 0.
    br.inputs['Scale'].default_value = 1.
    br.inputs['Mortar Size'].default_value = .006
    br.inputs['Mortar Smooth'].default_value = .2
    br.inputs['Brick Width'].default_value = 1 / 6
    br.inputs['Row Height'].default_value = 1 / 10
    br.inputs['Color1'].default_value = (*srgb('#1b2a44'), 1)
    br.inputs['Color2'].default_value = (*srgb('#1e3150'), 1)
    br.inputs['Mortar'].default_value = (*srgb('#8a98ab'), 1)
    br.inputs['Bias'].default_value = 0.
    l.new(tc.outputs['UV'], br.inputs['Vector'])
    l.new(br.outputs['Color'], b.inputs['Base Color'])
    return m

M['pv'] = pv_mat()

def resc_mat():
    m = bpy.data.materials.new('fv_resc')
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    b = n['Principled BSDF']
    b.inputs['Roughness'].default_value = .38
    b.inputs['Coat Weight'].default_value = .4
    t = n.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(os.path.abspath(RESC), check_existing=True)
    t.extension = 'CLIP'
    l.new(t.outputs['Color'], b.inputs['Base Color'])
    l.new(t.outputs['Alpha'], b.inputs['Alpha'])
    return m

M['resc'] = resc_mat()

# ---------------------------------------------------------------- geometry helpers
def box(name, x0, x1, y0, y1, z0, z1, m, c='house', bevel=.012):
    me = bpy.data.meshes.new('fv_' + name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('fv_' + name, me)
    o.location = ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    o.scale = (x1 - x0, y1 - y0, z1 - z0)
    o.data.materials.append(m)
    C[c].objects.link(o)
    o.parent = rig
    # apply scale so the bevel is even
    o.data.transform(Matrix.Diagonal((*o.scale, 1)))
    o.scale = (1, 1, 1)
    if bevel:
        bv = o.modifiers.new('bevel', 'BEVEL')
        bv.width = bevel
        bv.segments = 3
        bv.limit_method = 'ANGLE'
        bv.harden_normals = False
    for p in o.data.polygons:
        p.use_smooth = False
    return o

def plane(name, verts, m, c, uv=True):
    me = bpy.data.meshes.new('fv_' + name)
    me.from_pydata(verts, [], [list(range(len(verts)))])
    if uv:
        me.uv_layers.new()
        for i, lp in enumerate(me.uv_layers[0].data):
            lp.uv = [(0, 0), (1, 0), (1, 1), (0, 1)][i]
    o = bpy.data.objects.new('fv_' + name, me)
    o.data.materials.append(m)
    C[c].objects.link(o)
    o.parent = rig
    return o

# Facades: each wall is described in its own frame (u along the wall as seen from outside, z up),
# so windows and equipment are placed once and mapped into the world here.
class Face:
    def __init__(self, origin, udir, normal):
        self.o, self.u, self.n = Vector(origin), Vector(udir), Vector(normal)
    def p(self, u, z, d=0.):
        return self.o + self.u * u + Vector((0, 0, z)) + self.n * d
    def box(self, name, u0, u1, z0, z1, d0, d1, m, c='house', bevel=.008):
        a, b = self.p(u0, z0, d0), self.p(u1, z1, d1)
        return box(name, min(a.x, b.x), max(a.x, b.x), min(a.y, b.y), max(a.y, b.y), min(a.z, b.z), max(a.z, b.z), m, c, bevel)

def window(f, name, u0, u1, z0, z1, mullions=1, sill=True, transom=None):
    fw, d = .06, .07  # frame width, depth out of the wall
    f.box(name + '_glass', u0, u1, z0, z1, 0, .012, M['glass'], bevel=0)
    f.box(name + '_ft', u0 - fw, u1 + fw, z1, z1 + fw, 0, d, M['frame'])
    f.box(name + '_fb', u0 - fw, u1 + fw, z0 - fw, z0, 0, d, M['frame'])
    f.box(name + '_fl', u0 - fw, u0, z0, z1, 0, d, M['frame'])
    f.box(name + '_fr', u1, u1 + fw, z0, z1, 0, d, M['frame'])
    for i in range(1, mullions + 1):
        u = u0 + (u1 - u0) * i / (mullions + 1)
        f.box(name + '_m%d' % i, u - .025, u + .025, z0, z1, 0, d * .8, M['frame'])
    if transom:
        f.box(name + '_t', u0, u1, transom - .025, transom + .025, 0, d * .8, M['frame'])
    if sill:
        f.box(name + '_sill', u0 - .12, u1 + .12, z0 - fw - .05, z0 - fw, 0, .16, M['slab'])

# ---------------------------------------------------------------- the villa
# footprint: ground floor 12 x 8 m (x -6..6, y -4..4); upper floor x -3.5..3, y -2.6..4.
G0, G1 = 0., 3.3          # ground floor walls
S0, S1 = 3.3, 3.55        # first-floor slab
U0, U1 = 3.55, 6.55       # upper floor walls
R0, R1 = 6.55, 6.8        # roof slab

box('plinth', -6.05, 6.05, -4.05, 4.05, 0, .12, M['wall2'])
box('ground', -6, 6, -4, 4, .12, G1, M['wall'], bevel=.02)
box('slab', -6.15, 6.15, -4.15, 4.15, S0, S1, M['edge'], bevel=.02)
box('upper', -3.5, 3.0, -2.6, 4.0, U0, U1, M['wall'], bevel=.02)
box('roof', -3.7, 3.2, -2.8, 4.2, R0, R1, M['edge'], bevel=.02)
box('roofmem', -3.55, 3.05, -2.65, 4.05, R1, R1 + .02, M['roof'], bevel=0)
# a darker vertical fin on the upper floor (architectural accent, like the reference)
box('fin', 2.4, 3.0, -2.75, -2.6, U0, U1, M['wall2'], bevel=.01)
# vertical timber slats: entrance wall (south), upper west wall beside the sliding doors, north stair wall
for i in range(9):
    x = -2.45 + i * .085
    box('slat_s%d' % i, x, x + .055, -4.06, -4.0, .12, 3.25, M['wood'], bevel=.006)
for i in range(16):
    y = 2.1 + i * .11
    box('slat_w%d' % i, -3.56, -3.5, y, y + .07, U0 + .05, U1 - .05, M['wood'], bevel=.006)
for i in range(12):
    x = 2.0 - i * .085
    box('slat_n%d' % i, x - .055, x, 4.0, 4.06, .12, 3.25, M['wood'], bevel=.006)

# terrace decking and glass balustrade around the first-floor slab
box('deck_s', -6.1, 6.1, -4.1, -2.6, S1, S1 + .02, M['deck'], bevel=0)
box('deck_w', -6.1, -3.5, -2.6, 4.1, S1, S1 + .02, M['deck'], bevel=0)
box('deck_e', 3.0, 6.1, -2.6, 4.1, S1, S1 + .02, M['deck'], bevel=0)

def balustrade(name, a, b):
    """Frameless glass with a steel cap rail along an axis-aligned edge."""
    (ax, ay), (bx, by) = a, b
    h0, h1 = S1 + .05, S1 + 1.05
    if ay == by:
        box(name + '_g', min(ax, bx), max(ax, bx), ay - .012, ay + .012, h0, h1, M['glassrail'], bevel=0)
        box(name + '_cap', min(ax, bx) - .02, max(ax, bx) + .02, ay - .03, ay + .03, h1, h1 + .04, M['rail'], bevel=.005)
    else:
        box(name + '_g', ax - .012, ax + .012, min(ay, by), max(ay, by), h0, h1, M['glassrail'], bevel=0)
        box(name + '_cap', ax - .03, ax + .03, min(ay, by) - .02, max(ay, by) + .02, h1, h1 + .04, M['rail'], bevel=.005)

E = 6.05
balustrade('bal_s', (-E, -4.05), (E, -4.05))
balustrade('bal_w', (-E, -4.05), (-E, 4.05))
balustrade('bal_e', (E, -4.05), (E, 4.05))
balustrade('bal_nw', (-E, 4.05), (-3.5, 4.05))
balustrade('bal_ne', (3.0, 4.05), (E, 4.05))

# roof parapet glass, low
def roofrail(a, b, name):
    a, b = Vector(a), Vector(b)
    lo = Vector((min(a.x, b.x), min(a.y, b.y))); hi = Vector((max(a.x, b.x), max(a.y, b.y)))
    box(name, lo.x - .01, hi.x + .01, lo.y - .01, hi.y + .01, R1, R1 + .55, M['glassrail'], bevel=0)
roofrail((-3.65, -2.75), (3.15, -2.75), 'rr_s')
roofrail((-3.65, -2.75), (-3.65, 4.15), 'rr_w')
roofrail((3.15, -2.75), (3.15, 4.15), 'rr_e')
roofrail((-3.65, 4.15), (3.15, 4.15), 'rr_n')

# facades (u runs left to right as seen from outside)
south_g = Face((0, -4, 0), (1, 0, 0), (0, -1, 0))
north_g = Face((0, 4, 0), (-1, 0, 0), (0, 1, 0))
west_g = Face((-6, 0, 0), (0, -1, 0), (-1, 0, 0))
east_g = Face((6, 0, 0), (0, 1, 0), (1, 0, 0))
south_u = Face((0, -2.6, 0), (1, 0, 0), (0, -1, 0))
north_u = Face((0, 4, 0), (-1, 0, 0), (0, 1, 0))
west_u = Face((-3.5, 0, 0), (0, -1, 0), (-1, 0, 0))
east_u = Face((3.0, 0, 0), (0, 1, 0), (1, 0, 0))

# south, ground: living window, entrance, equipment wall (u -0.4..2.9), garage
window(south_g, 'sg_liv', -5.5, -2.5, .55, 2.75, mullions=2)
south_g.box('door', -1.75, -.75, .12, 2.45, 0, .05, M['door'])
south_g.box('door_h', -.95, -.9, 1.0, 1.7, .05, .1, M['rail'])
south_g.box('canopy', -2.2, -.3, 2.75, 2.85, 0, 1.1, M['slab'], bevel=.01)
south_g.box('step1', -2.0, -.5, 0, .12, 0, .9, M['paving'])
south_g.box('step2', -1.9, -.6, .12, .18, 0, .45, M['paving'])
for i in range(19):  # sectional garage door: horizontal ribs
    z = .14 + i * .125
    south_g.box('gar%d' % i, 3.35, 5.65, z, z + .11, 0, .04, M['shutter'], bevel=.004)
south_g.box('gar_h', 3.25, 5.75, 2.55, 2.65, 0, .07, M['frame'])
south_g.box('drive', 3.0, 6.0, 0, .03, 0, 2.6, M['paving'], bevel=0)
# south, upper: sliding glass doors to the terrace, solid wall where the cable runs, a small window
window(south_u, 'su_slide', -3.2, .6, 3.6, 6.15, mullions=3, sill=False)
window(south_u, 'su_win', 1.75, 2.25, 4.4, 5.9, mullions=0)
# north, ground: kitchen windows; equipment zone u -0.4..2.9 kept clear
window(north_g, 'ng_k1', -5.4, -3.6, .6, 2.6, mullions=1)
window(north_g, 'ng_k2', 3.4, 5.4, .6, 2.6, mullions=1)
north_g.box('ng_door', -3.2, -2.3, .12, 2.45, 0, .05, M['door'])
# north, upper: bedroom windows (u = -x)
window(north_u, 'nu_1', -3.1, -.3, 4.1, 6.0, mullions=1)
window(north_u, 'nu_2', 2.0, 3.2, 4.1, 6.0, mullions=0)
# west
window(west_g, 'wg_1', -2.6, 1.6, .55, 2.75, mullions=2)
window(west_u, 'wu_slide', -3.6, 1.6, 3.6, 6.15, mullions=3, sill=False)
# east
window(east_g, 'eg_1', .4, 2.9, .9, 2.6, mullions=1)
window(east_u, 'eu_1', -1.8, 1.8, 4.1, 6.0, mullions=2)

# terrace furniture (west terrace): two loungers, a side table, planters
for i, y in enumerate((-.8, .6)):
    box('lounge%d' % i, -5.6, -3.9, y, y + .75, S1 + .02, S1 + .32, M['cushion'], bevel=.06)
    box('lounge%db' % i, -5.6, -5.2, y, y + .75, S1 + .32, S1 + .75, M['cushion'], bevel=.06)
box('table', -4.9, -4.5, -.05, .35, S1 + .02, S1 + .45, M['frame'], bevel=.02)
for i, (x, y) in enumerate(((-5.6, 3.3), (5.2, -3.6), (5.2, 3.3))):
    box('planter%d' % i, x, x + .6, y, y + .6, S1 + .02, S1 + .5, M['wall2'], bevel=.02)
    me = bpy.data.meshes.new('fv_shrub%d' % i)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=.38)
    bm.to_mesh(me); bm.free()
    sh = bpy.data.objects.new('fv_shrub%d' % i, me)
    sh.location = (x + .3, y + .3, S1 + .75)
    C['house'].objects.link(sh); sh.parent = rig
    sh.data.materials.append(mat('leaf%d' % i, srgb('#5f8f4e'), .8))
    d = sh.modifiers.new('d', 'DISPLACE'); d.strength = .08
    d.texture = bpy.data.textures.get('fv_noise') or bpy.data.textures.new('fv_noise', 'CLOUDS')
    d.texture.noise_scale = .12
    sh.modifiers.new('s', 'SUBSURF').levels = 1
    for p in sh.data.polygons: p.use_smooth = True

# ---------------------------------------------------------------- parts
# roof solar: two rows of six portrait modules, tilted 12 degrees toward the front (south)
PV = []
def pv_row(y0, row):
    w, L, tilt, gap, n = 1.0, 1.7, math.radians(12), .07, 6
    rot = Matrix.Rotation(tilt, 3, 'X')  # north edge up: modules face the front (south)
    nrm = rot @ Vector((0, 0, 1))
    x0 = -.25 - (n * w + (n - 1) * gap) / 2
    for i in range(n):
        x = x0 + i * (w + gap)
        c = Vector((x + w / 2, y0 + L * math.cos(tilt) / 2, R1 + .3 + L * math.sin(tilt) / 2))
        fr = box('pvf%d_%d' % (row, i), -w / 2 - .012, w / 2 + .012, -L / 2 - .012, L / 2 + .012, -.02, .02, M['pvframe'], 'solar', bevel=.004)
        fr.rotation_euler = rot.to_euler()
        fr.location = c - nrm * .02
        corners = [c + rot @ Vector((sx * w / 2, sy * L / 2, .003)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        plane('pv%d_%d' % (row, i), corners, M['pv'], 'solar')
        lo, hi = c.z - L / 2 * math.sin(tilt) - .03, c.z + L / 2 * math.sin(tilt) - .03
        ys, yn = c.y - L / 2 * math.cos(tilt) + .12, c.y + L / 2 * math.cos(tilt) - .12
        for j, lx in enumerate((x + .14, x + w - .14)):
            box('pvl%d_%d_%d' % (row, i, j), lx - .02, lx + .02, ys - .02, ys + .02, R1, lo + .12 * math.tan(tilt), M['steel'], 'solar', bevel=0)
            box('pvl%d_%d_%dn' % (row, i, j), lx - .02, lx + .02, yn - .02, yn + .02, R1, hi - .12 * math.tan(tilt), M['steel'], 'solar', bevel=0)
pv_row(-2.15, 0)
pv_row(.95, 1)

def equipment(f):
    """Inverter, meter and battery on facade f; returns the 3D anchor points for the cables."""
    # RESC inverter: rounded body + the product photo on its face
    iw, ih = .82, .82 * 492 / 556
    ic, iz = 1.45, 1.8  # centre u, centre z of the image
    body_h = ih * 430 / 492
    bz1 = iz + ih / 2 - ih * 8 / 492
    f.box('inv_body', ic - iw / 2 + .012, ic + iw / 2 - .012, bz1 - body_h, bz1, 0, .24, M['body'], 'inverter', bevel=.055)
    a, b, c, d = f.p(ic - iw / 2, iz - ih / 2, .243), f.p(ic + iw / 2, iz - ih / 2, .243), f.p(ic + iw / 2, iz + ih / 2, .243), f.p(ic - iw / 2, iz + ih / 2, .243)
    plane('inv_face', [a, b, c, d], M['resc'], 'inverter')
    # meter box
    mc, mz = 2.52, 1.3
    f.box('meter', mc - .2, mc + .2, mz - .3, mz + .3, 0, .17, M['body'], 'meter', bevel=.025)
    f.box('meter_win', mc - .12, mc + .12, mz + .03, mz + .18, .17, .18, M['meterwin'], 'meter', bevel=0)
    f.box('meter_led', mc - .13, mc - .09, mz - .13, mz - .09, .17, .185, M['led'], 'meter', bevel=0)
    # battery tower on the ground
    bc = .2
    f.box('bat', bc - .43, bc + .43, .03, 1.62, 0, .4, M['bat'], 'battery', bevel=.04)
    f.box('bat_top', bc - .41, bc + .41, 1.45, 1.6, .395, .405, M['dark'], 'battery', bevel=.004)
    f.box('bat_led', bc - .018, bc + .018, .42, 1.3, .4, .41, M['led'], 'battery', bevel=0)
    f.box('bat_foot', bc - .4, bc + .4, 0, .07, .02, .38, M['dark'], 'battery', bevel=.01)
    off = .04  # cables run just off the wall
    inv_top = f.p(ic - .12, bz1, off)
    return {
        'inv': (f.p(ic - iw / 2, bz1 - body_h, 0), f.p(ic + iw / 2, bz1, .24)),
        'meter': (f.p(mc - .2, mz - .3, 0), f.p(mc + .2, mz + .3, .17)),
        'bat': (f.p(bc - .43, 0, 0), f.p(bc + .43, 1.62, .4)),
        'inv_top': inv_top, 'ic': ic, 'iz': iz, 'bz1': bz1, 'body_h': body_h, 'mc': mc, 'mz': mz, 'bc': bc, 'off': off,
    }

def cable_paths(f, e, side):
    """Cable runs along the house surface, as 3D polylines (in rig space)."""
    off, ic, bz1, body_h, mc, mz, bc = e['off'], e['ic'], e['bz1'], e['body_h'], e['mc'], e['mz'], e['bc']
    cu = ic - .18
    if side == 'south':  # roof edge -> down the set-back upper wall -> across the terrace -> down to the inverter
        roof = [Vector((cu, .2, R1 + .25)), Vector((cu, -2.6 - off, R1 + .02)), Vector((cu, -2.6 - off, S1 + .03)),
                Vector((cu, -4.15 - off, S1 + .03)), Vector((cu, -4.0 - off, S0 - .05)), f.p(cu, bz1, off)]
    else:                # north wall is flush: straight down from the roof edge
        roof = [Vector((-cu, 2.4, R1 + .25)), Vector((-cu, 4.2 + off, R1 + .02)), Vector((-cu, 4.0 + off, S1)), f.p(cu, bz1, off)]
    bot = bz1 - body_h
    wall_bat = [f.p(ic - .22, bot, off), f.p(ic - .22, 1.05, off), f.p(bc + .43, 1.05, off)]
    wall_meter = [f.p(ic + .3, bot, off), f.p(ic + .3, bot - .22, off), f.p(mc, bot - .22, off), f.p(mc, mz + .3, off)]
    feed = f.p(mc + .9, 0, 1.6)
    meter_feed = [f.p(mc, mz - .3, off), f.p(mc, .03, off), f.p(mc, .03, .6), feed]
    return {'roof>wall': roof, 'wall>battery': wall_bat, 'wall>meter': wall_meter, 'meter>feed': meter_feed}, feed

# ---------------------------------------------------------------- ground, light, camera, render settings
gp = plane('shadow', [(-40, -40, 0), (40, -40, 0), (40, 40, 0), (-40, 40, 0)], M['paving'], 'ground')
gp.is_shadow_catcher = True

w = sc.world = bpy.data.worlds.new('fv_world')
w.use_nodes = True
wn, wl = w.node_tree.nodes, w.node_tree.links
bg = wn['Background']
bg.inputs['Strength'].default_value = .75
wtc = wn.new('ShaderNodeTexCoord')
wsep = wn.new('ShaderNodeSeparateXYZ')
wl.new(wtc.outputs['Generated'], wsep.inputs[0])
wr = wn.new('ShaderNodeValToRGB')
el = wr.color_ramp.elements
el[0].position, el[0].color = .44, (*srgb('#a9a49b'), 1)
el[1].position, el[1].color = 1., (*srgb('#6f9bd1'), 1)
e2 = el.new(.5); e2.color = (*srgb('#eef3f8'), 1)
e3 = el.new(.62); e3.color = (*srgb('#bcd3ec'), 1)
wmap = wn.new('ShaderNodeMapRange')
wmap.inputs['From Min'].default_value, wmap.inputs['From Max'].default_value = -1., 1.
wl.new(wsep.outputs['Z'], wmap.inputs['Value'])
wl.new(wmap.outputs['Result'], wr.inputs['Fac'])
wl.new(wr.outputs['Color'], bg.inputs['Color'])

sun_d = bpy.data.lights.new('fv_sun', 'SUN')
sun_d.energy = 4.6
sun_d.angle = math.radians(2.5)
sun_d.color = srgb('#fff4e6')
sun = bpy.data.objects.new('fv_sun', sun_d)
root.objects.link(sun)
src = Vector((-.62, -.85, 1.2)).normalized()  # from the camera's left: left facade lit, right facade in shade
sun.rotation_euler = (-src).to_track_quat('-Z', 'Y').to_euler()

cam_d = bpy.data.cameras.new('fv_cam')
cam_d.type = 'ORTHO'
cam = bpy.data.objects.new('fv_cam', cam_d)
root.objects.link(cam)
sc.camera = cam
look = Vector((0, 0, 3.2))
cam.location = look + Vector((1, -1, .98)).normalized() * 60
cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam_d.clip_end = 200

r = sc.render
r.engine = 'CYCLES'
r.film_transparent = True
sc.cycles.film_transparent_glass = True
r.resolution_x, r.resolution_y = RES, int(RES * .8)
r.resolution_percentage = 100
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA'
r.image_settings.color_depth = '8'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 8
try:
    pr = bpy.context.preferences.addons['cycles'].preferences
    pr.compute_device_type = 'METAL'
    pr.refresh_devices()
    for d in pr.devices: d.use = True
    sc.cycles.device = 'GPU'
except Exception:
    pass
sc.view_settings.view_transform = 'AgX'
try:
    sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
sc.view_settings.exposure = .25

# ---------------------------------------------------------------- per view
def show_only(names, catchers=()):
    """Render the given collections; others hidden, `catchers` (collections) become shadow catchers."""
    for k, c in C.items():
        vis = k in names or k in catchers or k == 'ground'
        c.hide_render = not vis
        for o in c.objects:
            o.is_shadow_catcher = (k in catchers) or k == 'ground'
            # a catcher only receives: the house must not add its own shadow to a part's image
            o.visible_shadow = k not in catchers
            # glass cannot catch shadows cleanly (it leaves a haze); leave it out of part renders
            o.hide_render = k in catchers and any(m and m.name == 'fv_glassrail' for m in o.data.materials) if o.data and hasattr(o.data, 'materials') else False

def project(v):
    """Rig-space point -> pixel in the full render frame."""
    co = world_to_camera_view(sc, cam, rig.matrix_world @ v)
    return [co.x * r.resolution_x, (1 - co.y) * r.resolution_y]

def proj_box(a, b):
    xs, ys = [], []
    for x in (a.x, b.x):
        for y in (a.y, b.y):
            for z in (a.z, b.z):
                px = project(Vector((x, y, z)))
                xs.append(px[0]); ys.append(px[1])
    return [min(xs), min(ys), max(xs), max(ys)]

def fit(margin=.08):
    """Ortho scale + shift so everything fits the frame with a margin."""
    vl = sc.view_layers[0]
    S0 = 30.
    cam_d.ortho_scale, cam_d.shift_x, cam_d.shift_y = S0, 0, 0
    vl.update()
    pts = []
    for key, c in C.items():
        if key == 'ground': continue
        for o in c.objects:
            for v in o.bound_box:
                wv = o.matrix_world @ Vector(v)
                pts.append(world_to_camera_view(sc, cam, wv))
                # where this corner's shadow lands on the ground, so the soft shadow stays in frame
                pts.append(world_to_camera_view(sc, cam, wv - src * (wv.z / src.z)))
    aspect = r.resolution_x / r.resolution_y
    x0, x1 = min(p.x for p in pts), max(p.x for p in pts)
    y0, y1 = min(p.y for p in pts), max(p.y for p in pts)
    wx, wy = (x1 - x0) * S0, (y1 - y0) * S0 / aspect          # world extents in the image plane
    S = max(wx, wy * aspect) / (1 - 2 * margin)
    cam_d.ortho_scale = S
    cam_d.shift_x = ((x0 + x1) / 2 - .5) * S0 / S
    cam_d.shift_y = ((y0 + y1) / 2 - .5) * S0 / aspect / S
    vl.update()

def steps():
    """Yields one output path per render; the runner renders it in the background, then resumes here."""
    for k in VIEWS:
        # clear the previous view's equipment
        for name in ('inverter', 'meter', 'battery'):
            for o in list(C[name].objects): bpy.data.objects.remove(o, do_unlink=True)
        rig.rotation_euler = (0, 0, math.radians(90 * k))
        side = 'south' if k in (0, 1) else 'north'
        f = south_g if side == 'south' else north_g
        e = equipment(f)
        cables, feed = cable_paths(f, e, side)
        sc.view_layers[0].update()
        fit()
        d = os.path.join(OUT, 'v%d' % k)
        os.makedirs(d, exist_ok=True)
        want = ONLY or ['host', 'lit', 'parts']
        set_lit(0)
        if 'host' in want:
            show_only(['house'])
            yield os.path.join(d, 'host.png')
        if 'lit' in want:
            show_only(['house'])
            set_lit(1)
            yield os.path.join(d, 'host_lit.png')
            set_lit(0)
        sol = [rig.matrix_world.inverted() @ (o.matrix_world @ Vector(b)) for o in C['solar'].objects for b in o.bound_box]
        meta = {
            'view': k, 'side': side, 'frame': [r.resolution_x, r.resolution_y],
            'boxes': {
                'solar': proj_box(Vector((min(v.x for v in sol), min(v.y for v in sol), min(v.z for v in sol))),
                                  Vector((max(v.x for v in sol), max(v.y for v in sol), max(v.z for v in sol)))),
                'inverter': proj_box(*e['inv']), 'meter': proj_box(*e['meter']), 'battery': proj_box(*e['bat']),
            },
            'cables': {name: [project(v) for v in pts] for name, pts in cables.items()},
            'feed': project(feed),
        }
        if 'parts' in want:
            # parts at double pixel density (same camera), each rendered only inside its own region
            r.resolution_percentage = 200
            r.use_border, r.use_crop_to_border = True, False
            sc.cycles.samples = max(16, int(SAMPLES * PART_SAMPLES))
            W, H = r.resolution_x, r.resolution_y
            for part in ('solar', 'inverter', 'meter', 'battery'):
                x0, y0, x1, y1 = meta['boxes'][part]
                m = max(x1 - x0, y1 - y0) * (.25 if part == 'solar' else .9)  # room for shadows
                r.border_min_x, r.border_max_x = max(0, (x0 - m) / W), min(1, (x1 + m) / W)
                r.border_min_y, r.border_max_y = max(0, 1 - (y1 + m) / H), min(1, 1 - (y0 - m) / H)
                show_only([part], catchers=['house'])
                yield os.path.join(d, part + '.png')
            r.use_border = False
            r.resolution_percentage = 100
            sc.cycles.samples = SAMPLES
        json.dump(meta, open(os.path.join(d, 'meta.json'), 'w'), indent=1)
        log('view %d done' % k)


# Background runner: each render is started like F12 (INVOKE_DEFAULT) so Blender's window stays responsive;
# render_complete schedules the next step. Progress goes to <out>/progress.txt, ending with "DONE" or "FAILED".
os.makedirs(OUT, exist_ok=True)
PROGRESS = os.path.join(OUT, 'progress.txt')
open(PROGRESS, 'w').close()

def log(msg):
    with open(PROGRESS, 'a') as fh:
        fh.write(msg + '\n')

G = steps()
prefs_view = bpy.context.preferences.view
_display = prefs_view.render_display_type

def _finish(msg):
    prefs_view.render_display_type = _display
    for h in (bpy.app.handlers.render_complete, bpy.app.handlers.render_cancel):
        for fn in [fn for fn in h if getattr(fn, '__name__', '').startswith('_fv_')]:
            h.remove(fn)
    log(msg)

def _fv_next():
    try:
        path = next(G)
    except StopIteration:
        _finish('DONE')
        return None
    except Exception as ex:
        import traceback
        _finish('FAILED ' + traceback.format_exc())
        return None
    r.filepath = path
    log('render ' + os.path.relpath(path, OUT))
    win = bpy.context.window_manager.windows[0]
    with bpy.context.temp_override(window=win, screen=win.screen):
        res = bpy.ops.render.render('INVOKE_DEFAULT', write_still=True, scene=sc.name)
    if 'RUNNING_MODAL' not in res:
        _finish('FAILED could not start render: %s' % res)
    return None

def _fv_done(*_):
    bpy.app.timers.register(_fv_next, first_interval=.3)

def _fv_cancel(*_):
    _finish('FAILED cancelled')

for h in (bpy.app.handlers.render_complete, bpy.app.handlers.render_cancel):
    for fn in [fn for fn in h if getattr(fn, '__name__', '').startswith('_fv_')]:
        h.remove(fn)
bpy.app.handlers.render_complete.append(_fv_done)
bpy.app.handlers.render_cancel.append(_fv_cancel)
prefs_view.render_display_type = 'NONE'
bpy.app.timers.register(_fv_next, first_interval=.2)
print('queued renders ->', OUT)
