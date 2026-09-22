"""Compara doua foldere de capturi: python3 scripts/shot-diff.py .shots/before .shots/after

Un pixel conteaza ca schimbat daca un canal difera cu peste 16 unitati. O captura trece daca
are sub 0,5% pixeli schimbati. Iese cu cod 1 daca vreo captura nu trece.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

LIMIT_LEVEL = 16
LIMIT_SHARE = 0.005

before, after = (Path(p) for p in sys.argv[1:3])
failed = 0
for a in sorted(before.glob('*.png')):
    b = after / a.name
    if not b.exists():
        print('LIPSESTE', a.name)
        failed += 1
        continue
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if ia.size != ib.size:
        print('DIMENSIUNE', a.name, ia.size, ib.size)
        failed += 1
        continue
    diff = ImageChops.difference(ia, ib).convert('L').point(lambda v: 255 if v > LIMIT_LEVEL else 0)
    share = sum(1 for v in diff.getdata() if v) / (ia.size[0] * ia.size[1])
    ok = share < LIMIT_SHARE
    failed += 0 if ok else 1
    print('ok' if ok else 'DIFERIT', a.name, f'{share:.4%}')
sys.exit(1 if failed else 0)
