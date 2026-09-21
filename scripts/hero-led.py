"""Imparte fotografia hero in straturi de lumina aditive, cate unul pe zona LED.

Baza e fotografia stinsa (K din luminozitate). Fiecare strat = fotografia * (1-K) * masca zonei,
iar mastile se normalizeaza ca suma lor + stratul `amb` sa dea exact 1. Pe pagina straturile se
aduna cu `mix-blend-mode: plus-lighter`, deci toate aprinse = fotografia originala.

Doua cadre: `led-a` (lat, desktop) si `ledm-a` (vertical, telefon). Zonele au aceleasi chei in
ambele, ca fiecare strat de pe pagina sa aiba o varianta pentru fiecare ecran; cheia da momentul
si felul aprinderii (vezi Hero.astro). Coordonatele sunt in pixeli pe latimea previzualizarii
(`preview`) si se scaleaza la sursa.
Ruleaza: python3 scripts/hero-led.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src/assets/images/hero-led"
K = 0.07
FEATHER = 18
QUALITY = 88

FRAMES = {
    "": {
        "src": "led-a.png",
        "preview": 2000,
        "zones": {
            "s1": [(160, 100, 478, 238)],
            "s2": [(160, 238, 478, 362)],
            "s3": [(160, 362, 478, 500)],
            "bs": [(478, 375, 1565, 550)],
            "vt": [(1735, 50, 1835, 745), (1760, 745, 1830, 1131)],
            "tk": [(120, 730, 300, 830), (0, 830, 300, 1131), (1700, 730, 1975, 800)],
            "is": [(300, 850, 1720, 1131)],
        },
    },
    "m-": {
        "src": "ledm-a.png",
        "preview": 790,
        "zones": {
            "s1": [(45, 90, 175, 242)],
            "s2": [(45, 242, 175, 362)],
            "s3": [(45, 362, 175, 535)],
            "bs": [(15, 530, 665, 745)],
            "vt": [(690, 50, 735, 1035), (690, 1035, 742, 1396)],
            "tk": [(0, 1000, 160, 1396)],
            "is": [(150, 995, 690, 1396)],
        },
    },
}


def mask(rects, size, scale):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for x0, y0, x1, y1 in rects:
        d.rectangle([x0 * scale, y0 * scale, x1 * scale, y1 * scale], fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(FEATHER)), np.float32) / 255


def save(arr, name):
    Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8)).save(OUT / name, quality=QUALITY)


def split(prefix, frame):
    img = Image.open(ROOT / "src/assets/images/_raw/hero" / frame["src"]).convert("RGB")
    lit = np.asarray(img, np.float32)
    scale = img.width / frame["preview"]

    masks = {k: mask(v, img.size, scale) for k, v in frame["zones"].items()}
    total = np.maximum(sum(masks.values()), 1.0)
    masks = {k: m / total for k, m in masks.items()}
    masks["amb"] = np.clip(1 - sum(masks.values()), 0, 1)

    save(lit * K, f"{prefix}off.jpg")
    for k, m in masks.items():
        save(lit * (1 - K) * m[..., None], f"{prefix}{k}.jpg")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for prefix, frame in FRAMES.items():
        split(prefix, frame)
        print("ok:", frame["src"])
    # Banda de jos (plintele si insula aprinse) sta sub blocul de contact de pe prima pagina.
    wide = Image.open(ROOT / "src/assets/images/_raw/hero" / FRAMES[""]["src"]).convert("RGB")
    wide.crop((0, int(wide.height * 0.55), wide.width, wide.height)).save(OUT / "glow.jpg", quality=QUALITY)


if __name__ == "__main__":
    main()
