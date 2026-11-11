# Turns his AI-made paper pictures in tools/textures-src into what the design page's newspaper is printed on (design.css):
#   news-paper.webp  blank newsprint, tiled under the whole page
#   news-fold.webp   the strip around the crease of a folded sheet, laid once across the page under the front page
#   news-tear.webp   a torn edge of the sheet, laid over the foot of a brand page's picture (brand.css)
# The first two are multiplied onto the page's own paper colour, so they are stored as near-white: only fibres, specks and the crease.
# Run: python tools/news-textures.py   (needs pillow)
from PIL import Image


def lifted(im, strength):
    """Scale so the sheet's own paper tone becomes white; fibres, specks and shading keep their depth below it."""
    tone = sorted(im.resize((64, 64)).getdata())[int(64 * 64 * .9)]
    # ...and what sits below the paper tone is deepened a little, or it is lost once multiplied onto the page
    return im.point(lambda v: max(0, min(255, round(255 - (255 - v * 255 / tone) * strength))))


SRC, OUT = 'tools/textures-src', 'public/assets/textures'
paper = Image.open(f'{SRC}/news-paper.jpg').convert('L')
from PIL import ImageFilter
paper = lifted(paper.filter(ImageFilter.MedianFilter(5)), .7).resize((1024, 1024))   # the specks go and the tone stays: clean stock, not a dirty sheet
paper.save(f'{OUT}/news-paper.webp', quality=82, method=6); print('paper', paper.size)
fold = Image.open(f'{SRC}/news-fold.jpg').convert('L')
w, h = fold.size
fold = lifted(fold.crop((0, int(h * .40), w, int(h * .58))).filter(ImageFilter.MedianFilter(5)), 1.3).resize((1600, 288))   # the crease and its shading
fold.save(f'{OUT}/news-fold.webp', quality=82, method=6); print('fold', fold.size)

# the tear: his photo has the sheet above a dark desk. Turned over, the sheet rises from below with its torn edge on top;
# the desk becomes transparent, the sheet takes the page's paper colour (its torn fibres stay lighter), and the foot
# fades out so the strip joins the page's own paper without a seam.
PAPER = (236, 229, 213)   # --paper in design.css
tear = Image.open(f'{SRC}/news-tear.jpg').convert('L').transpose(Image.FLIP_TOP_BOTTOM)
w, h = tear.size
tear = tear.crop((0, int(h * .44), w, int(h * .62))).resize((2000, 360), Image.LANCZOS)
w, h = tear.size
tone = sorted(tear.resize((64, 16)).getdata())[int(64 * 16 * .8)]
alpha = tear.point(lambda v: max(0, min(255, round((v - 95) * 255 / 70))))   # desk out, sheet in, soft across the fibres
fade = Image.linear_gradient('L').resize((w, h)).point(lambda v: 255 if v < 150 else max(0, round(255 - (v - 150) * 255 / 95)))   # opaque, then gone by the foot
from PIL import ImageChops
alpha = ImageChops.multiply(alpha, fade)
rgb = Image.merge('RGB', [tear.point(lambda v, c=c: max(0, min(255, round(c + (v - tone) * 1.1)))) for c in PAPER])
rgb.putalpha(alpha)
rgb.save(f'{OUT}/news-tear.webp', quality=86, method=6); print('tear', rgb.size)
