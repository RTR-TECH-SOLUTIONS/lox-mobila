import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 2400;
const ACCEPTED = new Set(['jpeg', 'png', 'webp']);

export class ImageError extends Error {}

/**
 * Poza urcata devine JPEG de maximum 2400 px pe latura lunga, rotita dupa EXIF si fara metadate.
 * Pozele facute la client au in EXIF locatia casei; sharp nu le pastreaza.
 */
export async function prepareImage(input: Buffer): Promise<Buffer> {
  if (input.length > MAX_UPLOAD_BYTES) throw new ImageError('Poza are peste 25 MB.');
  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new ImageError('Fișierul nu e o poză validă.');
  }
  if (!format || !ACCEPTED.has(format)) throw new ImageError('Sunt acceptate doar poze JPEG, PNG sau WebP.');
  return sharp(input)
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

/** Miniatura pentru listele din admin. */
export function thumbnail(input: Buffer, width = 480): Promise<Buffer> {
  return sharp(input).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality: 76 }).toBuffer();
}

/** Nume nou la fiecare upload, ca o poza inlocuita sa nu ramana in cache-ul browserului. */
export function newPhotoId(): string {
  return randomBytes(4).toString('hex');
}
