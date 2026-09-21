import { matchesFilter } from '../lib/filter';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FADE = 200;

document.querySelectorAll<HTMLElement>('[data-project-grid]').forEach((grid) => {
  const buttons = grid.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const cards = grid.querySelectorAll<HTMLElement>('[data-project]');
  const status = grid.querySelector<HTMLElement>('[data-filter-status]');
  const list = grid.querySelector<HTMLElement>('[data-filter-grid]');
  let timer = 0;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const active = btn.dataset.filter!;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

      const apply = () => {
        let shown = 0;
        cards.forEach((card) => {
          const ok = matchesFilter(card.dataset.category!, active);
          card.hidden = !ok;
          // un card filtrat nu mai asteapta reveal-ul de scroll
          if (ok) card.classList.add('is-in');
          if (ok) shown += 1;
        });

        if (status) status.textContent = `${shown} proiecte afișate`;
      };

      // Cardurile ies si intra cu un fade; reasezarea grilei se face cat e stinsa.
      if (!list || reduceMotion) return apply();
      clearTimeout(timer);
      list.classList.add('is-fading');
      timer = window.setTimeout(() => {
        apply();
        requestAnimationFrame(() => list.classList.remove('is-fading'));
      }, FADE);
    });
  });
});
