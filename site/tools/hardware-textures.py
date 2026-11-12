"""The hardware page's two surfaces, from the photographs in tools/textures-src:
  plate-metal.jpg  the brushed metal of the cureVision rating plate
  panel-coat.jpg   the coated faceplate of the selector panel at the foot of the page
Each is cut to the shape it fills and saved small. Run from site/:  python3 tools/hardware-textures.py"""
from PIL import Image

SRC, OUT = 'tools/textures-src/', 'public/assets/textures/'
# name: (width, height) of the saved texture, about twice the size it is shown at
SURFACES = {'plate-metal': (900, 720), 'panel-coat': (1800, 720)}

for name, (w, h) in SURFACES.items():
    im = Image.open(f'{SRC}{name}.jpg').convert('RGB')
    # the middle of the photograph, at the shape wanted: its edges are where the light falls off
    scale = max(w/im.width, h/im.height)
    im = im.resize((round(im.width*scale), round(im.height*scale)), Image.LANCZOS)
    left, top = (im.width - w)//2, (im.height - h)//2
    im.crop((left, top, left + w, top + h)).save(f'{OUT}{name}.webp', quality=80)
    print(name, (w, h))
