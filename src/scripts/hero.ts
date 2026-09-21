// Aprinde LED-urile din hero pe rand. Textul e vizibil de la inceput; .is-lit marcheaza finalul.
// Porneste doar dupa ce toate straturile sunt decodate, altfel un strat intarziat
// ar sari peste aprindere.

const hero = document.querySelector<HTMLElement>('[data-hero]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TEXT_AT = 3900;
const FAILSAFE = 6000;

if (hero && !reduce) {
  const root = document.documentElement;
  const lights = [...hero.querySelectorAll<HTMLImageElement>('[data-at]')];
  const imgs = [...hero.querySelectorAll<HTMLImageElement>('img')];
  const timers: number[] = [];

  const finish = () => {
    timers.forEach(clearTimeout);
    lights.forEach((l) => l.classList.add('is-on'));
    root.classList.add('is-lit');
  };

  root.classList.add('is-lighting');

  Promise.all(imgs.map((i) => i.decode().catch(() => undefined))).then(() => {
    for (const l of lights) {
      timers.push(window.setTimeout(() => l.classList.add('is-on'), Number(l.dataset.at)));
    }
    timers.push(window.setTimeout(() => root.classList.add('is-lit'), TEXT_AT));
  });

  // Daca decodarea se blocheaza, pagina nu ramane in intuneric.
  window.setTimeout(() => {
    if (!root.classList.contains('is-lit')) finish();
  }, FAILSAFE);
}

export {};
