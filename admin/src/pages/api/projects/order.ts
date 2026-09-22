import type { APIRoute } from 'astro';
import { parseContent, projectOrderSchema } from '@site/content/schema';
import { check, readContent, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { withWriteLock } from '../../../lib/lock';
import { reorderProjects } from '../../../lib/projects';
import { author, repo } from '../../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { order, featured } = check(parseContent(projectOrderSchema, await request.json()));
    const sha = await withWriteLock(async () => {
      const next = reorderProjects(await readContent(repo(), 'projects', { fresh: true }), order, featured);
      return saveContent(repo(), 'projects', next, { message: 'Ordinea proiectelor', author: author(locals.user!) });
    });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
