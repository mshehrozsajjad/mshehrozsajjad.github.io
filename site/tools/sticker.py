# Turns a background-removed photo into a sticker: haze-free edge, then a solid white outline around the subject.
# Run: python tools/sticker.py in.webp public/assets/photos/shehroz-front   (writes -sm and full sizes as webp)
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

OUTLINE = .014   # outline width as a share of the photo's height

def sticker(src):
    a = np.array(Image.open(src).convert("RGBA")).astype(float) / 255
    # faint background haze left by the cut-out tool would show through the white: drop it, firm the edge
    alpha = np.clip((a[..., 3] - .24) / (.86 - .24), 0, 1)
    r = round(OUTLINE * a.shape[0])
    pad = r + 4
    alpha = np.pad(alpha, pad); rgb = np.pad(a[..., :3], ((pad, pad), (pad, pad), (0, 0)), constant_values=1)
    dist = ndimage.distance_transform_edt(alpha < .5)
    ring = np.clip(r + .5 - dist, 0, 1)
    ring = ndimage.gaussian_filter(ring, 1.2)          # a soft-cut edge, like a die-cut sticker
    out_rgb = rgb * alpha[..., None] + (1 - alpha[..., None])
    out_a = np.maximum(alpha, ring)
    img = Image.fromarray((np.dstack([out_rgb, out_a]) * 255).round().astype("uint8"), "RGBA")
    return img.crop(img.getbbox())

if __name__ == "__main__":
    img = sticker(sys.argv[1])
    for h, suffix in ((1600, ""), (900, "-sm")):
        im = img.resize((round(img.width * h / img.height), h), Image.LANCZOS)
        im.save(f"{sys.argv[2]}{suffix}.webp", quality=84, method=6)
        print(sys.argv[2] + suffix, im.size)
