"""Regradeaza fotografiile generate ca sa se vada mobila, nu doar atmosfera.

Se ruleaza o singura data, manual: `python3 scripts/regrade.py`.
Originalele se mute la prima rulare in `src/assets/images/_raw/` si de acolo se
citeste mereu, deci scriptul e idempotent: o a doua rulare da acelasi rezultat,
nu unul de doua ori mai luminos.

Curba lucreaza doar pe L din LAB, deci temperatura culorii ramane neatinsa, si
se stinge spre alb cu (1-x)^1.2, ca luminile sa nu se arda.
"""

from __future__ import annotations

import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "src" / "assets" / "images"
RAW = IMAGES / "_raw"

# Mediana de luminanta tintita, pe folder. Hero-ul ramane mai jos: peste el
# vine gradientul si textul alb.
TARGETS = {"services": 56, "projects": 56, "workshop": 52}

GAMMA_MIN, GAMMA_MAX = 0.52, 0.94
# Ridicarea umbrelor aplatizeaza imaginea; o strangem inapoi in jurul mijlocului.
CONTRAST = 1.06
ROLLOFF = 1.2
QUALITY = 88


def curve(x: np.ndarray, gamma: float) -> np.ndarray:
    """Ridica umbrele si mijlocul, lasa luminile pe loc."""
    return x + (np.power(x, gamma) - x) * np.power(1.0 - x, ROLLOFF)


def solve_gamma(median: float, target: float) -> float:
    """Gamma care duce mediana imaginii la tinta, in limitele admise."""
    x = median / 255.0
    y = target / 255.0
    if x <= 0.0 or x >= 1.0 or y <= x:
        return 1.0
    wanted = x + (y - x) / ((1.0 - x) ** ROLLOFF)
    if wanted >= 1.0:
        return GAMMA_MIN
    return min(GAMMA_MAX, max(GAMMA_MIN, math.log(wanted) / math.log(x)))


def regrade(src: Path, dst: Path, target: int) -> tuple[float, float, float, float]:
    rgb = Image.open(src).convert("RGB")
    lab = np.asarray(rgb.convert("LAB"), dtype=np.float32)
    lightness = lab[..., 0]

    before = float(np.median(lightness))
    gamma = solve_gamma(before, target)

    lifted = curve(lightness / 255.0, gamma)
    lifted = np.clip(0.5 + (lifted - 0.5) * CONTRAST, 0.0, 1.0)
    lab[..., 0] = lifted * 255.0

    # Ridicarea lui L la a/b constant spala culoarea; o compensam proportional
    # cu cat am ridicat, fara sa depasim 12%.
    lift = float(np.mean(lab[..., 0])) / max(float(np.mean(lightness)), 1.0)
    chroma = min(1.12, max(1.0, 1.0 + (lift - 1.0) * 0.45))
    for ch in (1, 2):
        lab[..., ch] = np.clip((lab[..., ch] - 128.0) * chroma + 128.0, 0, 255)

    out = Image.fromarray(lab.astype(np.uint8), mode="LAB").convert("RGB")
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    after = np.asarray(out.convert("L"), dtype=np.float32)
    return before, float(np.median(after)), gamma, float((after >= 250).mean())


def main() -> None:
    for folder, target in TARGETS.items():
        for current in sorted((IMAGES / folder).glob("*.jpg")):
            raw = RAW / folder / current.name
            if not raw.exists():
                raw.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(current, raw)

            before, after, gamma, blown = regrade(raw, current, target)
            print(
                f"{folder}/{current.name:32s} mediana {before:5.1f} -> {after:5.1f}"
                f"  gamma {gamma:.2f}  lumini arse {blown * 100:.2f}%"
            )


if __name__ == "__main__":
    main()
