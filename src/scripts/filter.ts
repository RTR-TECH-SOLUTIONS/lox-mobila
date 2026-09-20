import { matchesFilter } from '../lib/filter';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll<HTMLElement>('[data-project-grid]').forEach((grid) => {
  const buttons = grid.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const cards = grid.querySelectorAll<HTMLElement>('[data-project]');
  const status = grid.querySelector<HTMLElement>('[data-filter-status]');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const active = btn.dataset.filter!;

      const apply = () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

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

      // Cardurile au view-transition-name, deci browserul le muta animat la noua pozitie.
      if ('startViewTransition' in document && !reduceMotion) {
        document.startViewTransition(apply);
      } else {
        apply();
      }
    });
  });
});
