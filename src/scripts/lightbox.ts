type Img = { src: string; alt: string };

const dialog = document.querySelector<HTMLDialogElement>('#lightbox');

if (dialog) {
  const img = dialog.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const counter = dialog.querySelector<HTMLElement>('[data-lb-counter]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-lb-next]')!;

  let items: Img[] = [];
  let i = 0;
  let opener: HTMLElement | null = null;

  const render = () => {
    const item = items[i];
    if (!item) return;
    img.src = item.src;
    img.alt = item.alt;
    counter.textContent = `${i + 1} / ${items.length}`;
    const single = items.length < 2;
    prev.hidden = single;
    next.hidden = single;
  };

  const step = (d: number) => {
    i = (i + d + items.length) % items.length;
    render();
  };

  document.querySelectorAll<HTMLElement>('[data-lightbox-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      items = JSON.parse(btn.dataset.images!);
      i = 0;
      opener = btn;
      render();
      dialog.showModal();
    });
  });

  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
}

export {};
