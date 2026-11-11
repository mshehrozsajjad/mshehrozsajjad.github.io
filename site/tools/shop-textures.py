# Turns his AI-made texture pictures in tools/textures-src into what the side projects' shopfront wears (src/ai/stall.js):
#   shop-counter-top.webp    varnished oak, planks running along the counter
#   shop-counter-front.webp  vertical pine planks for its front
#   shop-cardboard.webp      blank kraft card, under every carton's print
#   shop-canvas.webp         undyed canvas: its weave under the awning's painted stripes
# Run: python tools/shop-textures.py   (needs pillow)
from PIL import Image

SRC, OUT = 'tools/textures-src', 'public/assets/textures'
# the size the scene draws each at; anything bigger is only download (the weave is drawn small, into every stripe)
for name, size in [('counter-top', 1024), ('counter-front', 1024), ('cardboard', 1024), ('canvas', 512)]:
    im = Image.open(f'{SRC}/shop-{name}.jpg').convert('RGB')
    im.thumbnail((size, size))
    im.save(f'{OUT}/shop-{name}.webp', quality=86, method=6)
    print(name, im.size)
