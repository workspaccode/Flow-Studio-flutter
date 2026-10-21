"""Turn villa3d.py renders into Flow Studio assets (src/assets.json).

usage: python3 tools/blender/pack.py <render dir> [src/assets.json] [--name villa3d] [--width 1200]

For each view v<k> it crops the house and its parts to one shared frame, writes the house as WebP,
the lit windows as an overlay (lit render minus day render), each part at full render resolution,
and records slots (part boxes) and cables (paths) as fractions of the house image.
"""
import base64, io, json, os, sys
from PIL import Image, ImageChops

PARTS = {'solar': 'roof', 'inverter': 'wall', 'meter': 'meter', 'battery': 'battery'}
SUFFIX = {0: '', 1: '-fr', 2: '-bl', 3: '-br'}
FACING = {0: 'fl', 1: 'fr', 2: 'bl', 3: 'br'}


def webp(im, q=90):
    b = io.BytesIO()
    im.save(b, 'WEBP', quality=q, method=6, exact=False)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


def bbox(im, thresh=12):
    return im.getchannel('A').point(lambda a: 255 if a > thresh else 0).getbbox()


def overlay(day, lit):
    """Keep the lit pixels where they differ from the day render (windows), transparent elsewhere."""
    diff = ImageChops.difference(day.convert('RGB'), lit.convert('RGB'))
    d = diff.convert('L').point(lambda v: min(255, v * 3))
    a = ImageChops.multiply(d, lit.getchannel('A'))
    out = lit.copy()
    out.putalpha(a)
    return out


def pack(rdir, name, width):
    assets, views = {}, {}
    for k in (0, 1, 2, 3):
        d = os.path.join(rdir, 'v%d' % k)
        if not os.path.exists(os.path.join(d, 'meta.json')):
            continue
        meta = json.load(open(os.path.join(d, 'meta.json')))
        host = Image.open(os.path.join(d, 'host.png')).convert('RGBA')
        parts = {p: Image.open(os.path.join(d, p + '.png')).convert('RGBA') for p in PARTS if os.path.exists(os.path.join(d, p + '.png'))}
        # parts may be rendered at a higher pixel density than the house (same camera): f = their scale
        dens = {p: im.width / host.width for p, im in parts.items()}
        pbox = {p: (lambda b, f: b and tuple(v / f for v in b))(bbox(im), dens[p]) for p, im in parts.items()}
        boxes = [bbox(host)] + list(pbox.values())
        x0 = min(b[0] for b in boxes if b); y0 = min(b[1] for b in boxes if b)
        x1 = max(b[2] for b in boxes if b); y1 = max(b[3] for b in boxes if b)
        fx, fy = meta['feed']
        x0, y0, x1, y1 = min(x0, fx - 20), min(y0, fy - 20), max(x1, fx + 20), max(y1, fy + 20)
        pad = int((x1 - x0) * .015)
        x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(host.width, x1 + pad), min(host.height, y1 + pad)
        W, H = x1 - x0, y1 - y0
        s = min(1., width / W)
        size = (round(W * s), round(H * s))
        key = name + SUFFIX[k]
        a = {'src': webp(host.crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS)), 'width': size[0], 'height': size[1]}
        lp = os.path.join(d, 'host_lit.png')
        if os.path.exists(lp):
            lit = overlay(host, Image.open(lp).convert('RGBA'))
            a['lit'] = {'src': webp(lit.crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS), 88)}
        fr = lambda px, py: [round((px - x0) / W, 5), round((py - y0) / H, 5)]
        slots = {}
        for p, im in parts.items():
            b = pbox[p]
            if not b:
                continue
            pk = name + '-' + p + SUFFIX[k]
            crop = im.crop(bbox(im))
            # parts stay at render resolution (sharper when enlarged), capped at 900 px
            ps = min(1., 900 / max(crop.size))
            crop = crop.resize((max(1, round(crop.width * ps)), max(1, round(crop.height * ps))), Image.LANCZOS)
            assets[pk] = {'src': webp(crop, 92), 'width': crop.width, 'height': crop.height}
            slots[PARTS[p]] = {'x': round((b[0] - x0) / W, 5), 'y': round((b[1] - y0) / H, 5),
                               'w': round((b[2] - b[0]) / W, 5), 'h': round((b[3] - b[1]) / H, 5), 'kind': pk}
        fp = fr(fx, fy)
        slots['feed'] = {'x': round(fp[0] - .004, 5), 'y': round(fp[1] - .004, 5), 'w': .008, 'h': .008, 'kind': 'grid-feed'}
        a['slots'] = slots
        a['cables'] = {c: [fr(*pt) for pt in pts] for c, pts in meta['cables'].items()}
        a['facing'] = FACING[k]
        assets[key] = a
        views[FACING[k]] = key
        print(key, size, 'parts', sorted(slots))
    for key, a in assets.items():
        if 'slots' in a:
            a['views'] = views
    return assets


if __name__ == '__main__':
    args = sys.argv[1:]
    name = args[args.index('--name') + 1] if '--name' in args else 'villa3d'
    width = int(args[args.index('--width') + 1]) if '--width' in args else 1200
    pos = [x for i, x in enumerate(args) if not x.startswith('--') and (i == 0 or not args[i - 1].startswith('--'))]
    rdir = pos[0]
    target = pos[1] if len(pos) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets.json')
    new = pack(rdir, name, width)
    data = json.load(open(target))
    data.update(new)
    json.dump(data, open(target, 'w'), separators=(',', ':'))
    print('wrote', len(new), 'assets to', target, '(%.1f KB)' % (sum(len(json.dumps(v)) for v in new.values()) / 1024))
