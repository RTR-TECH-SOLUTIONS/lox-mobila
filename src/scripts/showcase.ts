// Galeria orizontala fixata din sectiunea de proiecte.
// Pe orice latime scroll-ul vertical se traduce in deplasare orizontala, cu inertie.
// Pe ecran foarte scund (telefon culcat) sau cu miscare redusa ramane caruselul nativ cu scroll-snap.
// Sagetile si tastele ← → merg in ambele moduri.

const PER_SLIDE = 0.9; // cat scroll vertical costa un panou, in inaltimi de ecran
const SCROLL_FACTOR = 0.85; // cati px de scroll vertical pe px orizontal, daca iese mai putin
const EASE = 0.11;
const PARALLAX = 46; // cursa maxima a imaginii in rama, px

const root = document.querySelector<HTMLElement>('[data-showcase]');

if (root) {
  const viewport = root.querySelector<HTMLElement>('[data-sc-viewport]')!;
  const track = root.querySelector<HTMLElement>('[data-sc-track]')!;
  const panels = [...root.querySelectorAll<HTMLElement>('[data-sc-panel]')];
  const images = panels.map((p) => p.querySelector<HTMLElement>('[data-sc-img]'));
  const current = root.querySelector<HTMLElement>('[data-sc-current]')!;
  const prev = root.querySelector<HTMLButtonElement>('[data-sc-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-sc-next]');
  const total = panels.filter((p) => p.querySelector('[data-sc-img]')).length;

  const mq = window.matchMedia(
    '(min-height: 600px) and (prefers-reduced-motion: no-preference)',
  );

  // Pe telefon doar fereastra galeriei e lipita; titlul de deasupra urca intai (`lead` px de scroll).
  const phone = window.matchMedia('(max-width: 1023px)');

  let pinned = false;
  let lead = 0;
  let max = 0; // cursa orizontala totala
  let target = 0;
  let x = 0;
  let raf = 0;
  let stops: number[] = []; // pozitia x la care fiecare panou sta la muchia containerului
  let centers: number[] = [];
  let index = 0;

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const nearest = (pos: number) => {
    let best = 0;
    stops.forEach((s, i) => {
      if (Math.abs(s - pos) < Math.abs(stops[best]! - pos)) best = i;
    });
    return best;
  };

  const setIndicators = (pos: number) => {
    // la capatul cursei ultimul panou nu mai poate ajunge la muchie; il consideram activ
    index = pos >= max - 2 ? stops.length - 1 : nearest(pos);
    current.textContent = String(Math.min(index + 1, total)).padStart(2, '0');
    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index >= stops.length - 1;
  };

  const draw = () => {
    track.style.transform = `translate3d(${-x}px,0,0)`;

    const vw = viewport.clientWidth;
    images.forEach((img, i) => {
      if (!img) return;
      const offset = (centers[i]! - x - vw / 2) / vw; // -1..1 in jurul centrului
      img.style.transform = `translate3d(${clamp(offset, -1.2, 1.2) * -PARALLAX}px,0,0)`;
    });

    setIndicators(x);
  };

  const tick = () => {
    x += (target - x) * EASE;
    if (Math.abs(target - x) < 0.2) x = target;
    draw();
    raf = x === target ? 0 : requestAnimationFrame(tick);
  };

  // Cursa de scroll in care galeria e lipita si panourile se misca.
  const scrollRange = () => root.offsetHeight - window.innerHeight - lead;
  const rootTop = () => root.getBoundingClientRect().top + window.scrollY + lead;

  // Cand scroll-ul se opreste intre doua panouri, il ducem pe cel mai apropiat,
  // ca in fereastra sa nu ramana jumatate din doua proiecte.
  let settle = 0;
  const snap = () => {
    const range = scrollRange();
    const top = rootTop() - window.scrollY;
    if (!pinned || range <= 0 || top >= 0 || -top >= range) return;
    const to = stops[nearest(target)]!;
    if (Math.abs(to - target) < 2) return;
    window.scrollTo({ top: rootTop() + (max ? to / max : 0) * range, behavior: 'smooth' });
  };

  const onScroll = () => {
    if (!pinned) return;
    const range = scrollRange();
    const progress = range > 0 ? clamp((window.scrollY - rootTop()) / range, 0, 1) : 0;
    target = progress * max;
    if (!raf) raf = requestAnimationFrame(tick);
    clearTimeout(settle);
    settle = window.setTimeout(snap, 180);
  };

  const onNativeScroll = () => {
    if (!pinned) setIndicators(viewport.scrollLeft);
  };

  const measure = () => {
    const edge = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    if (pinned) {
      // Fixat: panourile au latimea containerului, deci pasul i = i × (latime + gap)
      // si cursa se opreste exact cand ultimul panou ajunge la muchie.
      stops = panels.map((p) => p.offsetLeft - edge);
      max = stops[stops.length - 1]!;
    } else {
      max = Math.max(0, track.scrollWidth - viewport.clientWidth);
      stops = panels.map((p) => clamp(p.offsetLeft - edge, 0, max));
    }
    centers = panels.map((p) => p.offsetLeft + p.offsetWidth / 2);
    const length = Math.min(max * SCROLL_FACTOR, (panels.length - 1) * window.innerHeight * PER_SLIDE);
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    lead = 0;
    if (pinned && phone.matches) {
      // Masuram pozitia fara lipire: cat urca titlul pana cand fereastra ajunge sub header.
      viewport.style.position = 'static';
      lead = viewport.getBoundingClientRect().top - root.getBoundingClientRect().top - headerH;
      viewport.style.position = '';
    }
    root.style.height = pinned ? `${window.innerHeight + lead + length}px` : '';
  };

  const goTo = (i: number) => {
    const to = stops[clamp(i, 0, stops.length - 1)]!;
    if (pinned) {
      window.scrollTo({ top: rootTop() + (max ? to / max : 0) * scrollRange(), behavior: 'smooth' });
    } else {
      viewport.scrollTo({ left: to, behavior: 'smooth' });
    }
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

  prev?.addEventListener('click', () => goTo(index - 1));
  next?.addEventListener('click', () => goTo(index + 1));

  // ← → cand galeria ocupa ecranul (sau focusul e in ea), in afara campurilor si a lightbox-ului.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (document.querySelector('dialog[open]')) return;
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable]')) return;

    const r = viewport.getBoundingClientRect();
    const vh = window.innerHeight;
    const inView = r.top < vh * 0.75 && r.bottom > vh * 0.25;
    if (!inView && !root.contains(el)) return;

    e.preventDefault();
    goTo(index + (e.key === 'ArrowRight' ? 1 : -1));
  });

  // Tastatura: cand focusul ajunge intr-un panou din afara ecranului, ducem scroll-ul acolo.
  root.addEventListener('focusin', (e) => {
    if (!pinned) return;
    const panel = (e.target as HTMLElement).closest<HTMLElement>('.panel');
    if (!panel) return;

    // Browserul isi face propriul scroll-into-view dupa focusin (si deruleaza chiar si
    // containerul cu overflow ascuns), asa ca il corectam in cadrul urmator.
    requestAnimationFrame(() => {
      viewport.scrollLeft = 0;
      const i = panels.indexOf(panel);
      window.scrollTo({ top: rootTop() + (max ? stops[i]! / max : 0) * scrollRange(), behavior: 'instant' });
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  viewport.addEventListener('scroll', onNativeScroll, { passive: true });
  // Pe telefon bara browserului apare si dispare la scroll si schimba inaltimea ferestrei;
  // re-masuram doar cand se schimba latimea, altfel galeria ar sari.
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    setMode();
  });
  mq.addEventListener('change', setMode);
  new ResizeObserver(measure).observe(track);

  setMode();
}

export {};
