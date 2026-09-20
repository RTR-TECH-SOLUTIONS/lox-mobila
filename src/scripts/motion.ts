// Parallax vertical pe [data-parallax] si numaratoare pe [data-countup].
// Nimic din toate astea nu ruleaza cu prefers-reduced-motion.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  // --- Parallax -----------------------------------------------------------
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

  // --- Numaratoare --------------------------------------------------------
  const counters = document.querySelectorAll<HTMLElement>('[data-countup]');

  if (counters.length && 'IntersectionObserver' in window) {
    const run = (el: HTMLElement) => {
      const match = el.textContent?.trim().match(/^(\d+)(.*)$/);
      if (!match) return;

      const end = Number(match[1]);
      const suffix = match[2] ?? '';
      const duration = 1400;
      const start = performance.now();

      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = `${Math.round(end * eased)}${suffix}`;
        if (t < 1) requestAnimationFrame(frame);
      };

      requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            run(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.6 },
    );

    counters.forEach((el) => io.observe(el));
  }
}

export {};
