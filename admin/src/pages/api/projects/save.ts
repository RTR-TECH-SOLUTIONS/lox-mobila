import type { APIRoute } from 'astro';
import { readContent, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { ImageError, MAX_UPLOAD_BYTES, newPhotoId, prepareImage } from '../../../lib/images';
import { buildProjectSave, type ProjectDraft } from '../../../lib/projects';
import { author, repo } from '../../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const form = await request.formData();
    const draft = JSON.parse(String(form.get('data') ?? '{}')) as ProjectDraft;
    const uploads = new Map<string, Buffer>();
    for (const [key, value] of form) {
      if (key === 'data' || typeof value === 'string') continue;
      if (value.size > MAX_UPLOAD_BYTES) throw new ImageError(`Poza ${value.name} are peste 25 MB.`);
      uploads.set(key, Buffer.from(await value.arrayBuffer()));
    }
    const save = await buildProjectSave({
      list: await readContent(repo(), 'projects'),
      draft,
      uploads,
      prepare: prepareImage,
      newId: newPhotoId,
    });
    const sha = await saveContent(repo(), 'projects', save.list, {
      message: save.message,
      author: author(locals.user!),
      files: save.files,
      deletes: save.deletes,
    });
    return json({ ok: true, sha, slug: save.slug });
  } catch (e) {
    return errorResponse(e);
  }
};
