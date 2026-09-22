"""Genereaza placeholdere gri pentru pozele de continut (proiecte, servicii, atelier).

Fiecare placeholder are dimensiunea originalului, ca incadrarile sa ramana la fel.
Pe el scrie doar „POZĂ".
Ruleaza: python3 scripts/placeholders.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent / 'src/assets/images'
OUT = ROOT / 'placeholder'
FOLDERS = ['projects', 'services', 'workshop']
BG = (58, 58, 58)
FG = (200, 196, 190)
FONT = '/System/Library/Fonts/Helvetica.ttc'

for folder in FOLDERS:
    (OUT / folder).mkdir(parents=True, exist_ok=True)
    for src in sorted((ROOT / folder).glob('*.jpg')):
        w, h = Image.open(src).size
        im = Image.new('RGB', (w, h), BG)
        d = ImageDraw.Draw(im)
        base = min(w, h)
        big = ImageFont.truetype(FONT, int(base * 0.07))
        # Serviciile si atelierul au textul jos, peste poza: eticheta urca in partea de sus.
        cx, cy = w / 2, h * {'services': 0.38, 'workshop': 0.28}.get(folder, 0.5)
        d.text((cx, cy), 'POZĂ', font=big, fill=FG, anchor='mm')
        im.save(OUT / folder / src.name, quality=80)
        print(folder, src.name, w, h)
