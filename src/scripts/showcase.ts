// Galeria orizontala fixata din sectiunea de proiecte.
// Pe desktop scroll-ul vertical se traduce in deplasare orizontala, cu inertie.
// In rest (mobil, ecran foarte scund, miscare redusa) ramane caruselul nativ.

const SCROLL_FACTOR = 0.85; // cati px de scroll vertical pe px orizontal
const EASE = 0.11;
const PARALLAX = 46; // cursa maxima a imaginii in rama, px

const root = document.querySelector<HTMLElement>('[data-showcase]');

if (root) {
  const viewport = root.querySelector<HTMLElement>('[data-sc-viewport]')!;
  const track = root.querySelector<HTMLElement>('[data-sc-track]')!;
  const panels = [...root.querySelectorAll<HTMLElement>('[data-sc-panel]')];
  const images = panels.map((p) => p.querySelector<HTMLElement>('[data-sc-img]'));
  const bar = root.querySelector<HTMLElement>('[data-sc-bar]')!;
  const current = root.querySelector<HTMLElement>('[data-sc-current]')!;

  const mq = window.matchMedia(
    '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)',
  );

  let pinned = false;
  let max = 0; // cursa orizontala totala
  let target = 0;
  let x = 0;
  let raf = 0;
  let centers: number[] = [];

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const setIndicators = (pos: number, progress: number) => {
    bar.style.transform = `scaleX(${progress})`;

    const mid = pos + viewport.clientWidth / 2;
    let best = 0;
    centers.forEach((c, i) => {
      if (Math.abs(c - mid) < Math.abs(centers[best]! - mid)) best = i;
    });
    current.textContent = String(best + 1).padStart(2, '0');
  };

  const draw = () => {
    track.style.transform = `translate3d(${-x}px,0,0)`;

    const vw = viewport.clientWidth;
    images.forEach((img, i) => {
      if (!img) return;
      const offset = (centers[i]! - x - vw / 2) / vw; // -1..1 in jurul centrului
      img.style.transform = `translate3d(${clamp(offset, -1.2, 1.2) * -PARALLAX}px,0,0)`;
    });

    setIndicators(x, max ? x / max : 0);
  };

  const tick = () => {
    x += (target - x) * EASE;
    if (Math.abs(target - x) < 0.2) x = target;
    draw();
    raf = x === target ? 0 : requestAnimationFrame(tick);
  };

  const onScroll = () => {
    if (!pinned) return;
    const total = root.offsetHeight - window.innerHeight;
    const progress = total > 0 ? clamp(-root.getBoundingClientRect().top / total, 0, 1) : 0;
    target = progress * max;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onNativeScroll = () => {
    if (pinned) return;
    const range = viewport.scrollWidth - viewport.clientWidth;
    setIndicators(viewport.scrollLeft, range > 0 ? viewport.scrollLeft / range : 0);
  };

  const measure = () => {
    centers = panels.map((p) => p.offsetLeft + p.offsetWidth / 2);
    max = Math.max(0, track.scrollWidth - viewport.clientWidth);
    root.style.height = pinned ? `${window.innerHeight + max * SCROLL_FACTOR}px` : '';
  };

  const setMode = () => {
    pinned = mq.matches;
    root.classList.toggle('is-pinned', pinned);

    if (!pinned) {
      cancelAnimationFrame(raf);
      raf = 0;
      x = target = 0;
      track.style.transform = '';
      images.forEach((img) => img && (img.style.transform = ''));
    } else {
      viewport.scrollLeft = 0;
    }

    measure();
    if (pinned) {
      onScroll();
      x = target; // fara animatie la schimbarea de mod
      draw();
    } else {
      onNativeScroll();
    }
  };

  // Tastatura: cand focusul ajunge intr-un panou din afara ecranului, ducem scroll-ul acolo.
  root.addEventListener('focusin', (e) => {
    if (!pinned) return;
    const panel = (e.target as HTMLElement).closest<HTMLElement>('.panel');
    if (!panel) return;

    // Browserul isi face propriul scroll-into-view dupa focusin (si deruleaza chiar si
    // containerul cu overflow ascuns), asa ca il corectam in cadrul urmator.
    requestAnimationFrame(() => {
      viewport.scrollLeft = 0;
      const wanted = clamp(panel.offsetLeft + panel.offsetWidth / 2 - viewport.clientWidth / 2, 0, max);
      const total = root.offsetHeight - window.innerHeight;
      const top = root.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (max ? wanted / max : 0) * total, behavior: 'instant' });
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  viewport.addEventListener('scroll', onNativeScroll, { passive: true });
  window.addEventListener('resize', setMode);
  mq.addEventListener('change', setMode);
  new ResizeObserver(measure).observe(track);

  setMode();
}

export {};
