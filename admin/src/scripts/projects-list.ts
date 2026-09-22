import Sortable from 'sortablejs';
import { initSaveForm, markDirty } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-order-form]');
const list = form?.querySelector<HTMLElement>('[data-sortable]');

if (form && list) {
  const animation = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;
  Sortable.create(list, { handle: '[data-drag]', animation, delayOnTouchOnly: true, delay: 120, onEnd: markDirty });

  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    const item = btn?.closest('li');
    if (!btn || !item) return;
    if (btn.matches('[data-up]') && item.previousElementSibling) item.previousElementSibling.before(item);
    else if (btn.matches('[data-down]') && item.nextElementSibling) item.nextElementSibling.after(item);
    else return;
    btn.focus();
    markDirty();
  });

  initSaveForm(form, {
    body: async () => {
      // Direct din bife: un slug numai din cifre ar face din buildObject o lista, nu un obiect.
      const featured = Object.fromEntries(
        [...form.querySelectorAll<HTMLInputElement>('input[name^="featured."]')].map((c) => [c.name.slice('featured.'.length), c.checked]),
      );
      const order = [...list.querySelectorAll<HTMLElement>('[data-slug]')].map((li) => li.dataset.slug!);
      return { body: JSON.stringify({ order, featured }), json: true };
    },
  });
}
