import Sortable from 'sortablejs';
import { buildObject } from '../lib/form-data';
import { initSaveForm, markDirty, serialize } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-order-form]');
const list = form?.querySelector<HTMLElement>('[data-sortable]');

if (form && list) {
  Sortable.create(list, { handle: '[data-drag]', animation: 150, delayOnTouchOnly: true, delay: 120, onEnd: markDirty });

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
      const data = buildObject(serialize(form));
      const order = [...list.querySelectorAll<HTMLElement>('[data-slug]')].map((li) => li.dataset.slug!);
      return { body: JSON.stringify({ order, featured: data.featured ?? {} }), json: true };
    },
  });
}
