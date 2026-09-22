"""Logoul pentru fundal deschis: literele albe devin aproape negre, alama ramane.
Rulat o data: python3 scripts/logo-variants.py"""
from PIL import Image

INK = (21, 20, 18)

for name in ('lox-logo', 'lox-logo-full'):
    im = Image.open(f'src/assets/brand/{name}.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            # alb sau gri deschis, nesaturat: literele si tagline-ul; alama are saturatie mare
            if a and max(r, g, b) - min(r, g, b) < 40 and min(r, g, b) > 120:
                px[x, y] = (*INK, a)
    im.save(f'src/assets/brand/{name}-dark.png', optimize=True)
    print('scris', f'{name}-dark.png', im.size)
