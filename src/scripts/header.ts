const header = document.querySelector<HTMLElement>('[data-header]');

// Bara capătă fundal după primii pixeli. La scroll în jos se ascunde; revine doar după un
// scroll în sus hotărât (nu la fiecare pixel), iar „arcul” de la capetele paginii pe iPhone
// e ignorat, altfel bara intră și iese singură.
if (header) {
  const SHOW_AFTER = 48;
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const clampY = () => Math.min(Math.max(window.scrollY, 0), maxY());

  let last = clampY();
  let up = 0;

  const onScroll = () => {
    const y = clampY();
    const delta = y - last;
    last = y;

    header.classList.toggle('is-scrolled', y > 24);
    if (document.querySelector('#mobile-nav[open]')) return;

    if (y < 400) {
      header.classList.remove('is-hidden');
    } else if (delta > 0) {
      up = 0;
      header.classList.add('is-hidden');
    } else if (delta < 0) {
      up -= delta;
      if (up > SHOW_AFTER) header.classList.remove('is-hidden');
    }
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export {};
