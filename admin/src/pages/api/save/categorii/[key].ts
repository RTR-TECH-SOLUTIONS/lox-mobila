import type { APIRoute } from 'astro';
import { CATEGORY_KEYS, CATEGORY_LABELS, categoryFormSchema, parseContent } from '@site/content/schema';
import { check, readContent, saveContent } from '../../../../lib/content';
import { errorResponse, json } from '../../../../lib/http';
import { withWriteLock } from '../../../../lib/lock';
import { author, repo } from '../../../../lib/repo';

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const key = CATEGORY_KEYS.find((k) => k === params.key);
    if (!key) return json({ ok: false, error: 'Categorie necunoscută.' }, 404);
    const page = check(parseContent(categoryFormSchema, await request.json()));
    const sha = await withWriteLock(async () => {
      const list = await readContent(repo(), 'categories', { fresh: true });
      const next = list.map((c) => (c.key === key ? { key, ...page } : c));
      return saveContent(repo(), 'categories', next, {
        message: `Texte categorii: ${CATEGORY_LABELS[key]}`,
        author: author(locals.user!),
      });
    });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
