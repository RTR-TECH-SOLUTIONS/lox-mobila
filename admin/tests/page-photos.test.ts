import { describe, it, expect } from 'vitest';
import { buildPagePhotosSave } from '../src/lib/page-photos';
import { ValidationError } from '../src/lib/content';

const current = {
  categories: { bucatarii: 'bucatarie.jpg', dressing: 'dressing.jpg', living: 'living.jpg', dormitor: 'dormitor.jpg', bai: 'baie.jpg', comercial: 'comercial.jpg' },
  atelier: 'atelier.jpg',
};
const deps = { prepare: async (b: Buffer) => b, newId: () => 'ab12cd34' };

describe('buildPagePhotosSave', () => {
  it('writes the new photo, deletes the old one and points the slot to it', async () => {
    const r = await buildPagePhotosSave({ current, uploads: new Map([['bai', Buffer.from('B')], ['atelier', Buffer.from('A')]]), ...deps });
    expect(r.value.categories.bai).toBe('bai-ab12cd34.jpg');
    expect(r.value.atelier).toBe('atelier-ab12cd34.jpg');
    expect(r.value.categories.bucatarii).toBe('bucatarie.jpg');
    expect(r.files.map((f) => f.path)).toEqual(['src/assets/images/services/bai-ab12cd34.jpg', 'src/assets/images/workshop/atelier-ab12cd34.jpg']);
    expect(r.deletes).toEqual(['src/assets/images/services/baie.jpg', 'src/assets/images/workshop/atelier.jpg']);
    expect(r.message).toBe('Poze pagini: Băi, Atelier');
  });

  it('refuses unknown slots and an empty save', async () => {
    await expect(buildPagePhotosSave({ current, uploads: new Map([['hero', Buffer.from('H')]]), ...deps })).rejects.toBeInstanceOf(ValidationError);
    await expect(buildPagePhotosSave({ current, uploads: new Map(), ...deps })).rejects.toBeInstanceOf(ValidationError);
  });
});
