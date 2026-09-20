const dialog = document.querySelector<HTMLDialogElement>('#mobile-nav');
const opener = document.querySelector<HTMLButtonElement>('[aria-controls="mobile-nav"]');

if (dialog && opener) {
  const setOpen = (open: boolean) => {
    opener.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };

  opener.addEventListener('click', () => {
    dialog.showModal();
    setOpen(true);
  });

  dialog.addEventListener('close', () => {
    setOpen(false);
    opener.focus();
  });

  dialog.querySelectorAll('a, [data-close]').forEach((el) => {
    el.addEventListener('click', () => dialog.close());
  });
}

export {};
