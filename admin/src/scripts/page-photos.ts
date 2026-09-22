import { downscale } from './downscale';
import { initSaveForm, markDirty } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-photos-form]');

if (form) {
  const chosen = new Map<string, Blob>();

  form.querySelectorAll<HTMLInputElement>('[data-slot-input]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      const slot = input.dataset.slotInput!;
      const blob = await downscale(file).catch(() => file);
      chosen.set(slot, blob);
      const tile = input.closest<HTMLElement>('[data-slot]')!;
      const img = tile.querySelector('img')!;
      if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
      img.src = URL.createObjectURL(blob);
      tile.classList.add('is-changed');
      markDirty();
    });
  });

  initSaveForm(form, {
    body: async () => {
      const body = new FormData();
      for (const [slot, blob] of chosen) body.append(slot, blob, `${slot}.jpg`);
      return { body, json: false };
    },
    onSaved: (r) => {
      location.href = `/poze?publicat=${r.sha}&vezi=${encodeURIComponent('/')}`;
    },
  });
}
