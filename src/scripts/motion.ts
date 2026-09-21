// Parallax vertical discret pe [data-parallax]. Nu ruleaza cu prefers-reduced-motion.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  const items = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map((el) => ({
    el,
    strength: Number(el.dataset.parallax) || 40,
    scale: Number(el.dataset.parallaxScale) || 1,
  }));

  if (items.length) {
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const { el, strength, scale } of items) {
        const r = (el.parentElement ?? el).getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const progress = (r.top + r.height / 2 - vh / 2) / vh; // 0 cand e centrat
        el.style.transform = `translate3d(0,${(progress * strength).toFixed(1)}px,0) scale(${scale})`;
      }
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }
}

export {};
