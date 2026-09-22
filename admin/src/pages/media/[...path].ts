import type { APIRoute } from 'astro';
import { thumbnail } from '../../lib/images';
import { repo } from '../../lib/repo';

const ALLOWED = /^(projects|services|workshop)\/[a-z0-9-]+(\/[a-z0-9-]+)?\.(jpg|jpeg|png|webp)$/;
const MAX_CACHED = 300;
const cache = new Map<string, Uint8Array<ArrayBuffer>>();

// Numele pozelor sunt unice (fiecare upload primeste un id nou), deci o miniatura nu se schimba niciodata.
export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? '';
  if (!ALLOWED.test(path)) return new Response('Nu există.', { status: 404 });

  let image = cache.get(path);
  if (!image) {
    try {
      image = new Uint8Array(await thumbnail(await repo().readBytes(`src/assets/images/${path}`)));
    } catch {
      return new Response('Nu există.', { status: 404 });
    }
    if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
    cache.set(path, image);
  }
  return new Response(image, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable' } });
};
