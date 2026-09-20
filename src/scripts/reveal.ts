const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];

// Clasa care ascunde se pune doar daca JS ruleaza: fara JS totul ramane vizibil.
if (!reduce && 'IntersectionObserver' in window && els.length) {
  document.documentElement.classList.add('has-reveal');

  // Elementele "clip" pornesc taiate complet prin clip-path, deci au suprafata vizibila zero
  // si IntersectionObserver nu le-ar declara niciodata intersectate. Pe ele le verificam
  // dupa pozitia cutiei, care nu tine cont de clip-path.
  const clipped = els.filter((el) => el.dataset.reveal === 'clip');
  const regular = els.filter((el) => el.dataset.reveal !== 'clip');

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
  );

  regular.forEach((el) => io.observe(el));

  let pending = clipped;
  let raf = 0;

  const check = () => {
    raf = 0;
    const limit = window.innerHeight * 0.88;
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      const visible = r.top < limit && r.bottom > 0;
      if (visible) el.classList.add('is-in');
      return !visible;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    }
  };

  const request = () => {
    if (!raf) raf = requestAnimationFrame(check);
  };

  if (pending.length) {
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    check();
  }
}

export {};
