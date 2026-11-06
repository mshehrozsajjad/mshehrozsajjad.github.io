# Traces each glyph from a scanned handwriting sheet and writes the font as an OTF and a WOFF2.
# Run: pip install numpy pillow scipy fonttools brotli potracer
#      pdftoppm -r 300 -png "Writing.pdf" scan
#      python build_font.py calligraphr scan-1.png ../../public/fonts/shehroz-hand "Shehroz Hand"     (Writing.pdf)
#      python build_font.py inktotype   scan-1.png ../../public/fonts/shehroz-print "Shehroz Print"  (Writing 2.pdf)
# Keep the .woff2; the .otf is for installing it on a computer.
# Letters were written at uneven heights, so each is placed by its class: caps and ascenders on the baseline,
# x-height letters on the baseline and scaled to a shared x-height, descenders hung from the x-height.
import sys
import numpy as np
import potrace
from scipy import ndimage
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
import cells, inktotype

TEMPLATES = {"calligraphr": cells.glyph_cells, "inktotype": inktotype.glyph_cells}

UPM, CAP, XH, SIDE, SPACE = 1000, 700, 420, 40, 300
DOTTED = set("ij!?:;\"")                      # glyphs whose small marks are real
XHEIGHT = set("acemnorsuvwxz")
HANGING = set("gpqy")                          # top sits on the x-height
EXTRA = {"’": "'", "‘": "'", "“": '"', "”": '"'}

def despeck(ch, keep):
    lab, n = ndimage.label(keep, structure=np.ones((3, 3)))
    sizes = ndimage.sum(keep, lab, range(1, n + 1))
    if ch in DOTTED or n < 2:
        return keep
    return np.isin(lab, 1 + np.nonzero(sizes >= .2 * sizes.max())[0])

def place(ch, h, base_scale, xh_px):
    """Returns (scale, units from glyph bottom to baseline) for a glyph h pixels tall."""
    if ch in XHEIGHT:
        s = float(np.clip(XH / (xh_px * base_scale), .6, 1.3)) * base_scale
        return s, 0
    if ch in HANGING:
        s = float(np.clip(XH / (xh_px * base_scale), .6, 1.3)) * base_scale
        return s, h * s - XH
    if ch == "j":
        return base_scale, 280
    if ch in ",;":
        return base_scale, 120 if ch == "," else h * base_scale - XH
    if ch in "'\"":
        return base_scale, -(CAP - h * base_scale)
    if ch == "f":
        return base_scale, 200
    if ch in "()":
        return base_scale, .2 * h * base_scale   # parentheses hang a little below the line
    if ch == "-":
        return base_scale, -(XH / 2 - h * base_scale / 2)
    return base_scale, 0                         # capitals, digits, & @ # and the rest sit on the line

def draw(pen, keep, scale, drop):
    keep = ndimage.gaussian_filter(keep.astype(float), 2.5) > .5  # soften scanner jaggies before tracing
    ys, xs = np.nonzero(keep)
    x0, y1 = xs.min(), ys.max()
    tx = lambda p: ((p.x - x0) * scale + SIDE, (y1 - p.y) * scale - drop)
    for curve in potrace.Bitmap(~keep).trace(turdsize=20, alphamax=1.1, opttolerance=0.4):
        pen.moveTo(tx(curve.start_point))
        for seg in curve.segments:
            if seg.is_corner:
                pen.lineTo(tx(seg.c)); pen.lineTo(tx(seg.end_point))
            else:
                pen.curveTo(tx(seg.c1), tx(seg.c2), tx(seg.end_point))
        pen.closePath()
    return round((xs.max() - x0) * scale + 2 * SIDE)

def height(keep):
    ys, _ = np.nonzero(keep)
    return ys.max() - ys.min()

def build(template, scan, out, family):
    cut = [(ch, despeck(ch, keep)) for ch, _, keep in TEMPLATES[template](cells.load(scan))]
    base_scale = CAP / float(np.median([height(k) for ch, k in cut if ch.isupper() and ch not in "JQ"]))
    xh_px = float(np.median([height(k) for ch, k in cut if ch in XHEIGHT]))
    names, cmap, strings, metrics = [".notdef", "space"], {32: "space"}, {}, {}
    for name in (".notdef", "space"):
        strings[name] = T2CharStringPen(SPACE, None).getCharString(); metrics[name] = (SPACE, 0)
    for ch, keep in cut:
        name = f"uni{ord(ch):04X}"
        scale, drop = place(ch, height(keep), base_scale, xh_px)
        pen = T2CharStringPen(0, None)
        metrics[name] = (draw(pen, keep, scale, drop), SIDE)
        strings[name] = pen.getCharString()
        names.append(name); cmap[ord(ch)] = name
    for ch, src in EXTRA.items():
        cmap[ord(ch)] = f"uni{ord(src):04X}"
    fb = FontBuilder(UPM, isTTF=False)
    fb.setupGlyphOrder(names)
    fb.setupCharacterMap(cmap)
    ps = family.replace(" ", "") + "-Regular"
    fb.setupCFF(ps, {"FullName": family}, strings, {})
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=950, descent=-350)
    fb.setupNameTable({"familyName": family, "styleName": "Regular"})
    fb.setupOS2(sTypoAscender=950, sTypoDescender=-350, usWinAscent=1000, usWinDescent=400, sxHeight=XH, sCapHeight=CAP)
    fb.setupPost()
    fb.save(out + ".otf")
    fb.font.flavor = "woff2"; fb.save(out + ".woff2")
    missing = [c for c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!?.,'" if ord(c) not in cmap]
    assert not missing, missing
    print("glyphs", len(names))

if __name__ == "__main__":
    build(*sys.argv[1:5])
