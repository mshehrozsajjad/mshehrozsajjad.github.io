# Cuts each handwritten glyph out of the InkToType 76-character scan (8 columns, faint dotted guides, a tiny printed
# label in each cell's top-left corner). Positions were read off a 60dpi render and are scaled x5 for 300dpi.
import numpy as np
from scipy import ndimage
from cells import load  # same thresholding as the Calligraphr sheet

LABEL_X = [138, 278, 420, 560, 700, 840, 980, 1125]
LABEL_Y = [297, 437, 588, 730, 873, 1017, 1158, 1297, 1440, 1583]
LAYOUT = ["ABCDEFGH", "IJKLMNOP", "QRSTUVWX", "YZabcdef", "ghijklmn", "opqrstuv", "wxyz0123", "456789.,", "!?'\"-():", ";&@#"]
SCALE, CELL_W, CELL_H, LABEL = 5, 140, 140, 36   # LABEL: the printed letter's corner, in 60dpi px

def glyph_cells(ink):
    for r, chars in enumerate(LAYOUT):
        for c, ch in enumerate(chars):
            x0, y0 = (LABEL_X[c] - 10) * SCALE, (LABEL_Y[r] - 10) * SCALE
            box = (x0, y0, x0 + CELL_W * SCALE, y0 + CELL_H * SCALE)
            crop = ink[box[1]:box[3], box[0]:box[2]]
            lab, _ = ndimage.label(crop, structure=np.ones((3, 3)))
            keep = np.zeros_like(crop)
            for i, (ys, xs) in enumerate(ndimage.find_objects(lab), 1):
                gh, gw = ys.stop - ys.start, xs.stop - xs.start
                size = (lab[ys, xs] == i).sum()
                in_label = ys.stop < LABEL * SCALE and xs.stop < LABEL * SCALE and max(gh, gw) < 130
                guide = size / max(gh, gw) < 9 and ch != "-"   # dotted guide lines are long and hairline-thin
                if in_label or guide or size < 300:
                    continue
                keep |= lab == i
            yield ch, box, keep

if __name__ == '__main__':
    import sys
    from PIL import Image
    ink = load(sys.argv[1])
    sheet = Image.new('L', (120 * 8, 120 * 10), 255)
    for i, (ch, box, keep) in enumerate(glyph_cells(ink)):
        sheet.paste(Image.fromarray((~keep * 255).astype('uint8')).resize((120, 120)), ((i % 8) * 120, (i // 8) * 120))
    sheet.save(sys.argv[2])
