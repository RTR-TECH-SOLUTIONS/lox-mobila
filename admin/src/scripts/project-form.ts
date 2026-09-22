import Sortable from 'sortablejs';
import { buildObject } from '../lib/form-data';
import { downscale } from './downscale';
import { initRepeaters, initSaveForm, markClean, markDirty, serialize, setMessage, type SaveResult } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-project-form]');

if (form) {
  const grid = form.querySelector<HTMLElement>('[data-photo-grid]')!;
  const input = form.querySelector<HTMLInputElement>('[data-photo-input]')!;
  const template = form.querySelector<HTMLTemplateElement>('template[data-photo-template]')!;
  const blobs = new Map<string, Blob>();
  let counter = 0;

  initRepeaters(form);
  Sortable.create(grid, { animation: 150, delayOnTouchOnly: true, delay: 120, filter: 'button', preventOnFilter: false, onEnd: markDirty });

  grid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    const photo = btn?.closest<HTMLElement>('.photo');
    if (!btn || !photo) return;
    if (btn.matches('[data-del]')) {
      const token = photo.dataset.token ?? '';
      if (token.startsWith('new:')) {
        blobs.delete(token.slice(4));
        URL.revokeObjectURL(photo.querySelector('img')!.src);
      }
      photo.remove();
    } else if (btn.matches('[data-left]') && photo.previousElementSibling) photo.previousElementSibling.before(photo);
    else if (btn.matches('[data-right]') && photo.nextElementSibling) photo.nextElementSibling.after(photo);
    else return;
    markDirty();
  });

  input.addEventListener('change', async () => {
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;
    setMessage(form, 'Se pregătesc pozele…');
    for (const file of files) {
      const key = `n${++counter}`;
      const blob = await downscale(file).catch(() => file);
      blobs.set(key, blob);
      const photo = (template.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
      photo.dataset.token = `new:${key}`;
      photo.querySelector('img')!.src = URL.createObjectURL(blob);
      grid.append(photo);
    }
    setMessage(form, '');
    markDirty();
  });

  const tokens = () => [...grid.querySelectorAll<HTMLElement>('.photo')].map((p) => p.dataset.token ?? '');

  initSaveForm(form, {
    body: async () => {
      const photos = tokens();
      const body = new FormData();
      body.append('data', JSON.stringify({ ...buildObject(serialize(form)), slug: form.dataset.slug || undefined, photos }));
      for (const token of photos) {
        if (!token.startsWith('new:')) continue;
        const key = token.slice(4);
        body.append(key, blobs.get(key)!, `${key}.jpg`);
      }
      return { body, json: false };
    },
    onSaved: (r: SaveResult) => {
      const slug = r.slug ?? form.dataset.slug!;
      location.href = `/proiecte/${slug}?publicat=${r.sha}&vezi=${encodeURIComponent(`/proiect/${slug}`)}`;
    },
  });

  // Stergerea, cu confirmare in fereastra proprie, nu in dialogul browserului.
  const dialog = document.querySelector<HTMLDialogElement>('dialog[data-delete-dialog]');
  form.querySelector('[data-delete-open]')?.addEventListener('click', () => dialog?.showModal());
  dialog?.querySelector('[data-delete-cancel]')?.addEventListener('click', () => dialog.close());
  dialog?.querySelector<HTMLButtonElement>('[data-delete-confirm]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    const res = await fetch('/api/projects/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: form.dataset.slug }),
    }).catch(() => null);
    const data = ((await res?.json().catch(() => null)) ?? {}) as SaveResult;
    if (data.ok && data.sha) {
      markClean();
      location.href = `/proiecte?publicat=${data.sha}&vezi=${encodeURIComponent('/mobilier')}`;
      return;
    }
    btn.disabled = false;
    dialog.close();
    setMessage(form, data.error ?? 'Nu s-a putut șterge proiectul. Încearcă din nou.', true);
  });
}
