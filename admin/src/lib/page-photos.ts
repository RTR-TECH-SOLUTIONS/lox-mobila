import { IMAGE_DIRS, PAGE_PHOTO_KEYS, type PagePhotoKey, type PagePhotos } from '@site/content/schema';
import { ValidationError } from './content';
import type { FileChange } from './github';

/** Pozele care nu tin de o categorie: stau singure in fisier, nu sub `categories`. */
export const SINGLE_SLOTS = ['atelier', 'debitare', 'feronerie'] as const;
export type SingleSlot = (typeof SINGLE_SLOTS)[number];
export type PagePhotoSlot = PagePhotoKey | SingleSlot;

export const PAGE_PHOTO_SLOTS: PagePhotoSlot[] = [...PAGE_PHOTO_KEYS, ...SINGLE_SLOTS];

export const PAGE_PHOTO_LABELS: Record<PagePhotoSlot, string> = {
  bucatarii: 'Bucătării',
  dressing: 'Dressinguri',
  living: 'Living',
  dormitor: 'Dormitor',
  bai: 'Băi',
  comercial: 'Spații comerciale',
  atelier: 'Atelier',
  debitare: 'Debitare și cantuire',
  feronerie: 'Distribuție feronerie',
};

const isSlot = (s: string): s is PagePhotoSlot => (PAGE_PHOTO_SLOTS as string[]).includes(s);

const isSingle = (slot: PagePhotoSlot): slot is SingleSlot => (SINGLE_SLOTS as readonly string[]).includes(slot);

/** Folderul din repo: placile de categorii stau in services/, pozele de atelier in workshop/. */
export const slotDir = (slot: PagePhotoSlot) => (isSingle(slot) ? IMAGE_DIRS.workshop : IMAGE_DIRS.services);

/** Acelasi folder, relativ la src/assets/images, pentru ruta /media. */
export const slotFolder = (slot: PagePhotoSlot) => (isSingle(slot) ? 'workshop' : 'services');

export const currentFile = (photos: PagePhotos, slot: PagePhotoSlot) =>
  isSingle(slot) ? photos[slot] : photos.categories[slot];

export async function buildPagePhotosSave(input: {
  current: PagePhotos;
  uploads: Map<string, Buffer>;
  prepare: (b: Buffer) => Promise<Buffer>;
  newId: () => string;
}): Promise<{ value: PagePhotos; files: FileChange[]; deletes: string[]; message: string }> {
  const value: PagePhotos = { ...input.current, categories: { ...input.current.categories } };
  const files: FileChange[] = [];
  const deletes: string[] = [];
  const changed: PagePhotoSlot[] = [];

  for (const [slot, buffer] of input.uploads) {
    if (!isSlot(slot)) throw new ValidationError([{ path: '', message: 'Poză necunoscută. Reîncarcă pagina.' }]);
    const name = `${slot}-${input.newId()}.jpg`;
    files.push({ path: `${slotDir(slot)}/${name}`, content: await input.prepare(buffer) });
    deletes.push(`${slotDir(slot)}/${currentFile(input.current, slot)}`);
    if (isSingle(slot)) value[slot] = name;
    else value.categories[slot] = name;
    changed.push(slot);
  }

  if (!changed.length) throw new ValidationError([{ path: '', message: 'Nu ai schimbat nicio poză.' }]);
  return { value, files, deletes, message: `Poze pagini: ${changed.map((s) => PAGE_PHOTO_LABELS[s]).join(', ')}` };
}
