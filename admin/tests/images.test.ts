import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import { ImageError, MAX_UPLOAD_BYTES, newPhotoId, prepareImage, thumbnail } from '../src/lib/images';

const photo = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#8a6a40' } }).jpeg();

describe('prepareImage', () => {
  it('rotates by EXIF, caps the long side at 2400 px and strips metadata', async () => {
    const input = await photo(3000, 2000).withMetadata({ orientation: 6 }).toBuffer();
    expect((await sharp(input).metadata()).orientation).toBe(6);
    const meta = await sharp(await prepareImage(input)).metadata();
    expect(meta.format).toBe('jpeg');
    expect([meta.width, meta.height]).toEqual([1600, 2400]);
    expect(meta.orientation).toBeUndefined();
    expect(meta.exif).toBeUndefined();
  });

  it('keeps small photos at their size', async () => {
    const meta = await sharp(await prepareImage(await photo(800, 600).toBuffer())).metadata();
    expect([meta.width, meta.height]).toEqual([800, 600]);
  });

  it('rejects files that are not photos, GIFs and files over 25 MB', async () => {
    await expect(prepareImage(Buffer.from('nu e poza'))).rejects.toThrow('Fișierul nu e o poză validă.');
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).gif().toBuffer();
    await expect(prepareImage(gif)).rejects.toBeInstanceOf(ImageError);
    await expect(prepareImage(Buffer.alloc(MAX_UPLOAD_BYTES + 1))).rejects.toThrow('Poza are peste 25 MB.');
  });

  it('turns a photo that breaks halfway into a clear message and logs the cause', async () => {
    const full = await sharp({ create: { width: 1200, height: 900, channels: 3, background: '#000', noise: { type: 'gaussian', mean: 128, sigma: 40 } } })
      .jpeg()
      .toBuffer();
    const truncated = full.subarray(0, Math.floor(full.length / 2));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const err = await prepareImage(truncated).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ImageError);
      expect((err as Error).message).toBe('Poza nu a putut fi prelucrată. Încearcă altă poză.');
      expect(log).toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});

describe('thumbnail and ids', () => {
  it('makes a 480 px wide JPEG', async () => {
    const meta = await sharp(await thumbnail(await photo(2400, 1600).toBuffer())).metadata();
    expect(meta.width).toBe(480);
  });

  it('makes 8-character hex ids', () => {
    expect(newPhotoId()).toMatch(/^[0-9a-f]{8}$/);
  });
});
