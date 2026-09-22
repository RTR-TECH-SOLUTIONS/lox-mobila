import type { APIRoute } from 'astro';
import { readContent, saveContent } from '../../lib/content';
import { errorResponse, json } from '../../lib/http';
import { ImageError, MAX_UPLOAD_BYTES, newPhotoId, prepareImage } from '../../lib/images';
import { buildPagePhotosSave } from '../../lib/page-photos';
import { author, repo } from '../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const form = await request.formData();
    const uploads = new Map<string, Buffer>();
    for (const [key, value] of form) {
      if (typeof value === 'string') continue;
      if (value.size > MAX_UPLOAD_BYTES) throw new ImageError(`Poza ${value.name} are peste 25 MB.`);
      uploads.set(key, Buffer.from(await value.arrayBuffer()));
    }
    const save = await buildPagePhotosSave({
      current: await readContent(repo(), 'pagePhotos'),
      uploads,
      prepare: prepareImage,
      newId: newPhotoId,
    });
    const sha = await saveContent(repo(), 'pagePhotos', save.value, {
      message: save.message,
      author: author(locals.user!),
      files: save.files,
      deletes: save.deletes,
    });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
