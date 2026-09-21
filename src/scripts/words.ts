// Textul din [data-words] se aprinde cuvant cu cuvant, pe masura ce paragraful urca prin ecran:
// incepe cand muchia de sus trece de 85% din inaltime si e complet aprins cand mijlocul lui ajunge pe la 55%.
// Cuvintele sunt deja impartite in <span class="w"> la build (components/ui/LitText.astro).

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const blocks = [...document.querySelectorAll<HTMLElement>('[data-words]')].map((el) => ({
  el,
  words: [...el.querySelectorAll<HTMLElement>('.w')],
  lit: -1,
}));

if (!reduce && blocks.length) {
  document.documentElement.classList.add('has-words');

  let raf = 0;

  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    for (const b of blocks) {
      const r = b.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const start = vh * 0.85;
      const end = vh * 0.55 - r.height * 0.5;
      const progress = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
      const lit = Math.round(progress * b.words.length);
      if (lit === b.lit) continue;
      b.words.forEach((w, i) => w.classList.toggle('on', i < lit));
      b.lit = lit;
    }
  };

  const request = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}

export {};
