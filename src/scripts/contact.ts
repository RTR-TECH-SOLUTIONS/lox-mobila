import { buildWhatsAppUrl } from '../lib/whatsapp';

document.querySelectorAll<HTMLFormElement>('[data-quote-form]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const url = buildWhatsAppUrl(form.dataset.wa!, {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      projectType: String(data.get('projectType') ?? ''),
      message: String(data.get('message') ?? ''),
    });

    window.open(url, '_blank', 'noopener');
  });
});
