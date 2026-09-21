const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];

// Clasa care ascunde se pune doar daca JS ruleaza: fara JS totul ramane vizibil.
// Elementul apare cand a intrat ~12% in ecran, nu la jumatate, ca la scroll normal
// sa nu existe niciodata blocuri goale in viewport.
if (!reduce && 'IntersectionObserver' in window && els.length) {
  document.documentElement.classList.add('has-reveal');

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // si ce e deja deasupra ecranului (reload la mijlocul paginii) apare direct
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0 },
  );

  els.forEach((el) => io.observe(el));
}

export {};
