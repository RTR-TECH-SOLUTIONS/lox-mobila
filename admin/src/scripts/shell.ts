// Meniul de pe telefon: sertar din stanga, se inchide cu Escape sau cu un click in afara lui.
const side = document.querySelector<HTMLElement>('[data-side]');
const toggle = document.querySelector<HTMLButtonElement>('[data-menu]');

if (side && toggle) {
  const set = (open: boolean) => {
    side.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => set(!side.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
  });
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (side.classList.contains('is-open') && !side.contains(target) && !toggle.contains(target)) set(false);
  });
}

export {};
