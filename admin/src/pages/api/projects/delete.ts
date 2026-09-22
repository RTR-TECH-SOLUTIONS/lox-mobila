import type { APIRoute } from 'astro';
import { parseContent, slugRequestSchema } from '@site/content/schema';
import { check, readContent, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { withWriteLock } from '../../../lib/lock';
import { deleteProject } from '../../../lib/projects';
import { author, repo } from '../../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { slug } = check(parseContent(slugRequestSchema, await request.json()));
    const sha = await withWriteLock(async () => {
      const r = deleteProject(await readContent(repo(), 'projects', { fresh: true }), slug);
      return saveContent(repo(), 'projects', r.list, { message: r.message, author: author(locals.user!), deletes: r.deletes });
    });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
