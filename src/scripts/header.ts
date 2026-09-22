const header = document.querySelector<HTMLElement>('[data-header]');

// Bara capătă fundal după primii pixeli; la scroll în jos se ascunde, la scroll în sus revine.
if (header) {
  let last = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    const menuOpen = document.querySelector('#mobile-nav[open]');
    header.classList.toggle('is-hidden', !menuOpen && y > 400 && y > last + 4);
    if (y < last - 4) header.classList.remove('is-hidden');
    last = y;
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export {};
