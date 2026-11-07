# Turns the photos in tools/textures-src into the layers the library card uses (home.css, "pick a side"):
#   card-frame.webp   the card's rim as a 9-slice for border-image: the photo's real rounded corner on all four corners,
#                     its real straight edge along the sides, the loose fibres reaching past the edge
#   card-grain.webp   the paper itself, for the middle of the card: the photo's interior with its lighting flattened,
#                     mirrored into a 2x2 tile so it repeats without a seam
#   stamp.webp        one real rubber-stamp impression as an ink mask (white, alpha = how much ink landed)
#   paperclip.webp    the paperclip, cut out of its dark background
# Both card layers are flattened to the same cream, and the rim fades out on its inner side over the grain (which the
# card lays under it, from FADE[0] in), so the two meet without a line.
# Run: uv run --with numpy --with pillow --with scipy python tools/card-textures.py
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = 'tools/textures-src', 'public/assets/textures'
CREAM = np.array([241, 234, 218]) / 255   # the card's flattened paper colour
TILT = 42.8      # degrees the card photo is turned so its edges run straight (measured from its left edge)
SCALE = .3       # output px per photo px for the rim (drawn at about half that in CSS, sharp on 2x screens)
GRAIN = .4       # ... and for the paper in the middle, coarser, so one photo's worth of grain covers more card
BAND = 220       # photo px of the rim each slice holds: the whole curve (radius ~130), some paper inside it...
OUT_PX = 50      # ... and this much outside the edge, for the loose fibres
FADE = (85, 135) # photo px in from the paper's edge where the rim fades out over the grain (home.css lays the grain
                 # from ~73px in, i.e. 10px on screen, so it is always under the fade)


def save(arr, name, size=None, quality=82):
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).round().astype('uint8'))
    if size:
        img = img.resize(size, Image.LANCZOS)
    img.save(f'{OUT}/{name}.webp', quality=quality, alpha_quality=90, method=6)
    print(f'{name}.webp', img.size)


def card():
    im = Image.open(f'{SRC}/card-corner.webp').convert('RGB').rotate(TILT, Image.BICUBIC, expand=True, fillcolor=(0, 0, 0))
    rgb = np.asarray(im).astype(float) / 255
    lum = rgb @ [.299, .587, .114]
    alpha = np.clip((lum - .3) / .35, 0, 1)   # the paper against the dark backdrop, fibres partly through
    solid = alpha > .99
    # flatten the light: divide out the paper's own smooth tone (blurred over paper only) and set it to one cream
    w = ndimage.gaussian_filter(solid.astype(float), 40)
    tone = np.dstack([ndimage.gaussian_filter(rgb[..., c] * solid, 40) for c in range(3)]) / np.maximum(w, 1e-6)[..., None]
    tone = np.where(w[..., None] > .2, tone, np.median(rgb[solid], axis=0))
    flat = np.clip(rgb / np.maximum(tone, 1e-3) * CREAM, 0, 1)

    # where the corner is: the bottom edge's row and the right edge's column, read just past the curve (the right edge
    # leans a little, so reading it further up would put the corner off by a few dozen px)
    rows, cols = np.nonzero(solid)
    right0 = int(np.median([np.nonzero(solid[y])[0].max() for y in range(rows.max() - 900, rows.max() - 500, 10)]))
    bottom = int(np.median([np.nonzero(solid[:, x])[0].max() for x in range(right0 - 320, right0 - 160, 4)]))
    right = int(np.median([np.nonzero(solid[y])[0].max() for y in range(bottom - 320, bottom - 160, 4)]))
    inner = BAND - OUT_PX
    # then settle the corner exactly: where the tile meets the sides (its first column and first row) the paper's edge
    # must sit exactly `inner` in, or a little step shows at every join
    for _ in range(3):
        bottom = int(np.median([np.nonzero(solid[:, x])[0].max() for x in range(right - inner - 6, right - inner + 6)]))
        right = int(np.median([np.nonzero(solid[y])[0].max() for y in range(bottom - inner - 6, bottom - inner + 6)]))
    rgba = np.dstack([flat, alpha])
    tile = rgba[bottom - inner:bottom + OUT_PX, right - inner:right + OUT_PX]          # bottom-right corner
    # its two arms come from different edges (the bottom one clean, the right one fibrous) but every side is the clean
    # one, so keep the bottom half and mirror it across the diagonal, blended softly through the curve
    yy, xx = np.mgrid[:BAND, :BAND]
    keep = np.clip(((yy - xx) / 24 + 1) / 2, 0, 1)[..., None]   # 1 below the diagonal (the bottom arm), 0 above
    tile = tile * keep + tile.transpose(1, 0, 2) * (1 - keep)
    L = 420                                                                            # straight edge taken per side
    # the side: the clean bottom edge, each column slid up or down so the paper's edge sits exactly where the corner's
    # does (the photo is a degree or so off level, which would otherwise leave a step where side meets corner)
    pad = 80
    strip = rgba[bottom - inner - pad:bottom + OUT_PX + pad, right - inner - L:right - inner]
    edge = np.array([np.nonzero(paper_rows)[0].max() for paper_rows in (strip[..., 3] > .99).T])
    edge = np.round(ndimage.uniform_filter1d(edge.astype(float), 41)).astype(int)   # follow the lean, not the fibres
    side = np.stack([strip[e - inner:e + OUT_PX, x] for x, e in enumerate(edge)], axis=1)

    # the 9-slice: corners are the one real corner turned four ways; each side is the real edge turned to face out
    n = 2 * BAND + L
    frame = np.zeros((n, n, 4))
    rot = lambda a, k: np.rot90(a, k)
    frame[n - BAND:, n - BAND:] = tile                          # bottom right
    frame[:BAND, n - BAND:] = rot(tile, 1)                      # top right
    frame[:BAND, :BAND] = rot(tile, 2)                          # top left
    frame[n - BAND:, :BAND] = rot(tile, 3)                      # bottom left
    frame[n - BAND:, BAND:n - BAND] = side                      # bottom
    frame[BAND:n - BAND, n - BAND:] = rot(side, 1)              # right
    frame[:BAND, BAND:n - BAND] = rot(side, 2)                  # top
    frame[BAND:n - BAND, :BAND] = rot(side, 3)                  # left
    # the rim keeps the real edge, corner and fibres, and fades out further in, so the grain under it shows through
    paper = ndimage.binary_fill_holes(frame[..., 3] > .5)
    depth = ndimage.distance_transform_edt(paper)
    frame[..., 3] *= 1 - np.clip((depth - FADE[0]) / (FADE[1] - FADE[0]), 0, 1)
    s = round(n * SCALE)
    save(frame, 'card-frame', (s, s))
    print('  slice', round(BAND * SCALE), 'outset share', round(OUT_PX / BAND, 3))

    # the middle: the largest clean stretch of paper well inside the card (the photo's diagonal cuts the top left off)
    y1, x1 = bottom - inner - 40, right - inner - 40
    # how far clean paper runs left from x1 on each row above y1 (the diagonal shortens it towards the top)
    paper = ndimage.binary_fill_holes(alpha > .5)   # the smudges and specks are still paper
    run = np.array([np.argmin(paper[y, :x1][::-1]) if not paper[y, :x1].all() else x1 for y in range(y1)])
    # the rectangle (ending at the corner's inner edge) with the most paper: each height h allows the shortest run in it
    h = max(range(300, y1, 10), key=lambda h: h * run[y1 - h:y1].min())
    wdt = int(run[y1 - h:y1].min()) - 20
    print('  grain', wdt, 'x', h, 'photo px')
    grain = flat[y1 - h:y1, x1 - wdt:x1]
    top = np.concatenate([grain, grain[:, ::-1]], 1)   # the patch and its mirror images: every edge meets its twin
    grain = np.concatenate([top, top[::-1]], 0)
    save(grain, 'card-grain', (round(2 * wdt * GRAIN), round(2 * h * GRAIN)), quality=78)


def stamp():
    im = np.asarray(Image.open(f'{SRC}/stamps.webp').convert('L')).astype(float) / 255
    box = im[600:1200, 800:1580]   # the middle impression (firm, a little patchy at the edges) with paper round it
    paper = np.percentile(box, 95)
    ink = np.clip((paper - box) / (paper - .2), 0, 1) ** .9
    blobs, _ = ndimage.label(ndimage.binary_dilation(ink > .2, iterations=6))
    sizes = np.bincount(blobs.ravel())
    sizes[0] = 0
    ink *= np.isin(blobs, np.nonzero(sizes > sizes.max() * .05)[0])   # the frame and its bar, not a neighbour's corner
    ys, xs = np.nonzero(ink > .3)
    ink = ink[max(0, ys.min() - 6):ys.max() + 7, max(0, xs.min() - 6):xs.max() + 7]
    h, w = ink.shape
    save(np.dstack([np.ones((h, w, 3)), ink]), 'stamp', (480, round(480 * h / w)))


def paperclip():
    rgb = np.asarray(Image.open(f'{SRC}/paperclip.webp').convert('RGB')).astype(float) / 255
    lum = rgb @ [.299, .587, .114]
    backdrop = np.median(lum)
    alpha = np.clip((lum - backdrop - .05) / .2, 0, 1)
    ys, xs = np.nonzero(alpha > .3)
    pad = 8
    crop = np.dstack([rgb, alpha])[ys.min() - pad:ys.max() + pad, xs.min() - pad:xs.max() + pad]
    h, w = crop.shape[:2]
    save(crop, 'paperclip', (420, round(420 * h / w)))


if __name__ == '__main__':
    card()
    stamp()
    paperclip()
