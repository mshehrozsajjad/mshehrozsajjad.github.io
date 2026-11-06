# Cuts each handwritten glyph out of the Calligraphr scan.
# Rough grid positions were read off a 60dpi render; each cell then snaps to the real printed lines nearby (the scan is skewed).
import numpy as np
from PIL import Image
from scipy import ndimage

COLS = [118, 252, 388, 522, 657, 792, 925, 1060, 1195]
# each row's writing area: (dashed line under the label strip, solid line at the bottom)
ROWS = [(212, 360), (394, 534), (572, 710), (750, 888), (930, 1062), (1104, 1240), (1268, 1414), (1450, 1592)]
LAYOUT = ["!\"',.:", ";?ABCD", "EFGHIJKL", "MNOPQRST", "UVWXYZab", "cdefghij", "klmnopqr", "stuvwxyz"]
SCALE, SEARCH, INSET = 5, 45, 12

def load(path):
    return np.array(Image.open(path).convert('L')) < 128

def snap(profile, guess):
    lo = max(guess - SEARCH, 0)
    return lo + int(np.argmax(profile[lo:guess + SEARCH]))

def cell_box(ink, r, c):
    t, b = (v * SCALE for v in ROWS[r])
    l, rr = COLS[c] * SCALE, COLS[c + 1] * SCALE
    band = ink[t + 60:b - 60]
    l, rr = snap(band.sum(0), l), snap(band.sum(0), rr)
    cols = ink[:, l + 60:rr - 60]
    t, b = snap(cols.sum(1), t), snap(cols.sum(1), b)
    return l + INSET, t + INSET, rr - INSET, b - INSET

def glyph_cells(ink):
    for r, chars in enumerate(LAYOUT):
        for c, ch in enumerate(chars):
            box = cell_box(ink, r, c)
            crop = ink[box[1]:box[3], box[0]:box[2]]
            lab, _ = ndimage.label(crop, structure=np.ones((3, 3)))
            keep = np.zeros_like(crop)
            h, w = crop.shape
            for i, (ys, xs) in enumerate(ndimage.find_objects(lab), 1):
                gh, gw = ys.stop - ys.start, xs.stop - xs.start
                size = (lab[ys, xs] == i).sum()
                edge = ys.start == 0 or xs.start == 0 or ys.stop == h or xs.stop == w
                # leftover grid touches the cell edge or spans it, and is a thin (maybe skewed) line; scan specks are tiny
                if ((edge or max(gh / h, gw / w) > .5) and size / max(gh, gw) < 10) or size < 400:
                    continue
                keep |= lab == i
            yield ch, box, keep

if __name__ == '__main__':
    ink = load('hw/hi-1.png')
    sheet = Image.new('L', (120 * 8, 120 * 8), 255)
    for i, (ch, box, keep) in enumerate(glyph_cells(ink)):
        sheet.paste(Image.fromarray((~keep * 255).astype('uint8')).resize((120, 120)), ((i % 8) * 120, (i // 8) * 120))
    sheet.save('hw/sheet.png')
