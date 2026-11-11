# Turns his AI-made paper pictures in tools/textures-src into what the design page's newspaper is printed on (design.css):
#   news-paper.webp  blank newsprint, tiled under the whole page
#   news-fold.webp   the strip around the crease of a folded sheet, laid once across the page under the front page
# Both are multiplied onto the page's own paper colour, so they are stored as near-white: only fibres, specks and the crease.
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
