import { IMAGE_DIRS, PAGE_PHOTO_KEYS, type PagePhotoKey, type PagePhotos } from '@site/content/schema';
import { ValidationError } from './content';
import type { FileChange } from './github';

export type PagePhotoSlot = PagePhotoKey | 'atelier';

export const PAGE_PHOTO_SLOTS: PagePhotoSlot[] = [...PAGE_PHOTO_KEYS, 'atelier'];

export const PAGE_PHOTO_LABELS: Record<PagePhotoSlot, string> = {
  bucatarii: 'Bucătării',
  dressing: 'Dressinguri',
  living: 'Living',
  dormitor: 'Dormitor',
  bai: 'Băi',
  comercial: 'Spații comerciale',
  atelier: 'Atelier',
};

const isSlot = (s: string): s is PagePhotoSlot => (PAGE_PHOTO_SLOTS as string[]).includes(s);

/** Folderul din repo: placile de categorii stau in services/, poza atelierului in workshop/. */
export const slotDir = (slot: PagePhotoSlot) => (slot === 'atelier' ? IMAGE_DIRS.workshop : IMAGE_DIRS.services);

/** Acelasi folder, relativ la src/assets/images, pentru ruta /media. */
export const slotFolder = (slot: PagePhotoSlot) => (slot === 'atelier' ? 'workshop' : 'services');

export const currentFile = (photos: PagePhotos, slot: PagePhotoSlot) =>
  slot === 'atelier' ? photos.atelier : photos.categories[slot];

export async function buildPagePhotosSave(input: {
  current: PagePhotos;
  uploads: Map<string, Buffer>;
  prepare: (b: Buffer) => Promise<Buffer>;
  newId: () => string;
}): Promise<{ value: PagePhotos; files: FileChange[]; deletes: string[]; message: string }> {
  const value: PagePhotos = { categories: { ...input.current.categories }, atelier: input.current.atelier };
  const files: FileChange[] = [];
  const deletes: string[] = [];
  const changed: PagePhotoSlot[] = [];

  for (const [slot, buffer] of input.uploads) {
    if (!isSlot(slot)) throw new ValidationError([{ path: '', message: 'Poză necunoscută. Reîncarcă pagina.' }]);
    const name = `${slot}-${input.newId()}.jpg`;
    files.push({ path: `${slotDir(slot)}/${name}`, content: await input.prepare(buffer) });
    deletes.push(`${slotDir(slot)}/${currentFile(input.current, slot)}`);
    if (slot === 'atelier') value.atelier = name;
    else value.categories[slot] = name;
    changed.push(slot);
  }

  if (!changed.length) throw new ValidationError([{ path: '', message: 'Nu ai schimbat nicio poză.' }]);
  return { value, files, deletes, message: `Poze pagini: ${changed.map((s) => PAGE_PHOTO_LABELS[s]).join(', ')}` };
}
