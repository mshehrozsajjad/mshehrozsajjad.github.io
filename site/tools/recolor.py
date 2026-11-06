# Repaints the red polo and the green sweater in the cut-out photos in the site's blue (--signal, #2D2BE0),
# keeping the knit's light and shade. Skin is warm too, so the red mask needs a saturated, deep red, not just a red hue.
# Run: python tools/recolor.py public/assets/photos/shehroz-front.webp [more files]   (rewrites them in place)
#      python tools/recolor.py --mask in.webp out.png                                     (shows what would be repainted)
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

BLUE_HUE = 241 / 360   # hue of #2D2BE0
BLUE_SAT = .8

def hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.select([d == 0, mx == r, mx == g], [0, ((g - b) / np.maximum(d, 1e-6)) % 6, (b - r) / np.maximum(d, 1e-6) + 2],
                  (r - g) / np.maximum(d, 1e-6) + 4) / 6
    return h, s, mx

def rgb_from(h, s, v):
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    return np.stack([np.choose(i, c) for c in ((v, q, p, p, t, v), (t, v, v, q, p, p), (p, p, t, v, v, q))], -1)

def garment(strict, loose, body):
    """The strict patches at the garment's height are the garment (a shadow or the neck can split it, e.g. the collar);
    grow them through looser pixels that touch them, then fill the knit's gaps. Lips sit above the beard, so they
    never join."""
    lab, n = ndimage.label(strict)
    if not n:
        return np.zeros_like(strict)
    sizes = ndimage.sum(strict, lab, range(1, n + 1))
    if sizes.max() < .01 * body.sum():                                # no garment of this colour in the photo
        return np.zeros_like(strict)
    boxes = ndimage.find_objects(lab)
    top = boxes[np.argmax(sizes)][0].start                             # where the biggest patch, the shirt, begins
    keep = [i + 1 for i, (ys, _) in enumerate(boxes) if sizes[i] >= .003 * sizes.max() and ys.stop > top + 2]
    seed = np.isin(lab, keep)
    grown, _ = ndimage.label(loose | seed)
    m = np.isin(grown, np.unique(grown[seed]))
    return ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=3))

def clothes_mask(rgb, alpha):
    h, s, v = hsv(rgb)
    hue, body = h * 360, alpha > .5
    # measured: the knit sits at hue 345-360 or 0-8 with saturation ~0.75-0.85; shadowed skin at hue 10-30, so hue
    # alone keeps the face, neck and lips out, and the saturation floor can drop low enough to take the dark seams
    reddish = (hue < 10) | (hue > 340)
    red = garment(reddish & (s > .65) & (v > .1) & body, reddish & (s > .3) & (v > .03) & body, body)
    # the sweater is near black; capping brightness keeps the light, grey-green fringe at the outline out
    greenish = (hue > 100) & (hue < 210) & (v < .45)
    green = garment(greenish & (s > .15) & (v > .06) & body, greenish & (s > .07) & (v > .02) & body, body)
    return ndimage.gaussian_filter((red | green).astype(float), 1.5)  # soft edge so the seam doesn't show

def recolor(src):
    a = np.array(Image.open(src).convert("RGBA")).astype(float) / 255
    rgb, alpha = a[..., :3], a[..., 3]
    m = clothes_mask(rgb, alpha)
    _, s, v = hsv(rgb)
    blue = rgb_from(np.full_like(v, BLUE_HUE), np.maximum(s, BLUE_SAT) * np.clip(v * 4, 0, 1), v)  # deepest shadows stay near black
    out = rgb * (1 - m[..., None]) + blue * m[..., None]
    return Image.fromarray((np.dstack([out, alpha]) * 255).round().astype("uint8")), m

if __name__ == "__main__":
    if sys.argv[1] == "--mask":
        _, m = recolor(sys.argv[2])
        Image.fromarray((m * 255).astype("uint8")).save(sys.argv[3])
    else:
        for f in sys.argv[1:]:
            img, _ = recolor(f)
            img.save(f, quality=88, method=6)
            print("recoloured", f)
