# Turns the worn-paperback photos in tools/textures-src into the layers the bookshelf uses (home.css, "pick a side"),
# so every book keeps its own colour and still looks handled:
#   *-mask.webp    the photo's outline: softly rounded, slightly uneven corners and edges, the face's real shape
#   *-detail.webp  scratches, stains and creases as grey around 50%, laid over the print with hard-light, so they show
#                  on dark boards as well as light ones (and wear the printed title too)
#   *-wear.webp    the whitened, torn-through paper, as a transparent layer of bare paper on top of the colour
#   pages.webp     the page block's fore-edge, turned so its lines run the way the face stands
# Run: python tools/book-textures.py   (needs numpy, pillow, scipy)
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = 'tools/textures-src', 'public/assets/textures'
PAPER = np.array([239, 233, 220]) / 255   # the colour of bare card where the print has worn off
GAIN = 3.2                                 # how strongly the detail shows
WEAR = 1                                   # how much bare paper shows (the photos are of a well-kept book)

def faces(name, size):
    im = Image.open(f'{SRC}/paperback-{name}.webp').convert('RGBA')
    a = np.asarray(im).astype(float) / 255
    ys, xs = np.nonzero(a[..., 3] > .5)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]   # trim the empty margin around the paper
    rgb, alpha = a[..., :3], a[..., 3]
    lum = rgb[..., 0] * .299 + rgb[..., 1] * .587 + rgb[..., 2] * .114
    inside = alpha > .5
    # the paper's own tone, smoothed, so only the marks on it are left: lighter or darker than the paper around them
    fill = np.where(inside, lum, np.median(lum[inside]))
    base = ndimage.gaussian_filter(fill, sigma=lum.shape[0] / 60)
    detail = np.clip(ndimage.gaussian_filter(fill - base, .7) * GAIN + .5, 0, 1)   # minus the pixel noise nobody sees
    # bare paper: the rubbed, lighter bits (clearly above the paper around them)
    wear = np.clip((fill - base - .035) / .08, 0, 1) * inside
    wear = ndimage.gaussian_filter(wear, .6) * WEAR

    def save(arr, suffix, quality):
        img = Image.fromarray((arr * 255).round().astype('uint8')).resize(size, Image.LANCZOS)
        img.save(f'{OUT}/{name}-{suffix}.webp', quality=quality, alpha_quality=70, method=6)
    save(np.dstack([detail] * 3), 'detail', 60)
    save(np.dstack([np.broadcast_to(PAPER, rgb.shape), wear]), 'wear', 60)
    save(np.dstack([np.ones_like(alpha)] * 3 + [alpha]), 'mask', 80)

def pages(size):
    im = Image.open(f'{SRC}/paperback-pages.webp').convert('RGB').rotate(90, expand=True)
    im.resize(size, Image.LANCZOS).save(f'{OUT}/pages.webp', quality=78, method=6)

if __name__ == '__main__':
    faces('cover', (480, 720))   # the largest cover on screen is about 476px wide
    faces('spine', (100, 600))
    pages((120, 480))
    print('written to', OUT)
