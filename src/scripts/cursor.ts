// Eticheta care urmareste cursorul peste elementele cu [data-cursor].
// Doar pentru mouse; pe touch si cu miscare redusa nu se creeaza deloc.

const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fine && !reduce) {
  const el = document.createElement('div');
  el.className = 'cursor-label';
  el.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('span');
  el.append(dot);
  document.body.append(el);

  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  let active = false;

  const tick = () => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    el.style.transform = `translate3d(${x}px,${y}px,0)`;
    el.classList.toggle('is-active', active);
    raf = active || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
  };

  document.addEventListener(
    'pointermove',
    (e) => {
      tx = e.clientX;
      ty = e.clientY;

      const host = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
      const next = Boolean(host);
      if (next && !active) {
        // apare direct sub cursor, nu zboara din coltul ecranului
        x = tx;
        y = ty;
        dot.textContent = host!.dataset.cursor ?? '';
      }
      active = next;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );

  document.addEventListener('pointerdown', () => {
    active = false;
  });
}

export {};
