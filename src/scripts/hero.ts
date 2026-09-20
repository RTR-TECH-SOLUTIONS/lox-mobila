import { HERO_SCALE, toMillimetres, formatMm } from '../lib/hero-measure';

const hero = document.querySelector<HTMLElement>('[data-hero]');

if (hero) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Secventa de intrare: clasa se pune doar daca JS ruleaza si miscarea e permisa.
  // Fara ea, hero-ul e direct in starea finala, cu fotografia si cotele vizibile.
  if (!reduce.matches) {
    document.documentElement.classList.add('has-intro');
    // dupa ce se termina, scoatem clasa ca animatiile sa nu se reia la re-render
    window.setTimeout(() => document.documentElement.classList.remove('has-intro'), 3200);
  }

  // Firele de par: doar mouse, doar ecran mare, doar cu miscare permisa.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  const cross = hero.querySelector<HTMLElement>('[data-crosshair]');
  const read = hero.querySelector<HTMLElement>('[data-crosshair-read]');

  if (cross && read && fine.matches && !reduce.matches) {
    cross.hidden = false;
    let raf = 0;
    let pending: { x: number; y: number } | null = null;

    const paint = () => {
      raf = 0;
      if (!pending) return;
      const { x, y } = pending;
      const r = hero.getBoundingClientRect();
      const mm = toMillimetres((x - r.left) / r.width, (y - r.top) / r.height, HERO_SCALE);
      cross.style.setProperty('--cx', `${(x - r.left).toFixed(0)}px`);
      cross.style.setProperty('--cy', `${(y - r.top).toFixed(0)}px`);
      read.textContent = `X ${formatMm(mm.x)} · Y ${formatMm(mm.y)}`;
    };

    hero.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        // peste text si controale firele dispar: altfel citirea se suprapune peste copy
        const overContent = (e.target as HTMLElement).closest('a, button, h1, p, li, label');
        cross.toggleAttribute('data-on', !overContent);
        pending = { x: e.clientX, y: e.clientY };
        if (!raf) raf = requestAnimationFrame(paint);
      },
      { passive: true },
    );

    hero.addEventListener('pointerleave', () => cross.removeAttribute('data-on'));
  }
}

export {};
