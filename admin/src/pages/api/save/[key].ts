import type { APIRoute } from 'astro';
import { contactSchema, parseContent, reviewsFormSchema, statsSchema, themeSchema } from '@site/content/schema';
import { check, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { author, repo } from '../../../lib/repo';

// Ecranele care salveaza un fisier intreg: contact, cifre, recenzii, culori.
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const body: unknown = await request.json();
    const opts = (message: string) => ({ message, author: author(locals.user!) });
    let sha: string;
    switch (params.key) {
      case 'contact':
        sha = await saveContent(repo(), 'contact', check(parseContent(contactSchema, body)), opts('Contact și program'));
        break;
      case 'cifre':
        sha = await saveContent(repo(), 'stats', check(parseContent(statsSchema, body)), opts('Cifre'));
        break;
      case 'recenzii':
        sha = await saveContent(repo(), 'reviews', check(parseContent(reviewsFormSchema, body)).items, opts('Recenzii'));
        break;
      case 'culori':
        sha = await saveContent(repo(), 'theme', check(parseContent(themeSchema, body)), opts('Culori'));
        break;
      default:
        return json({ ok: false, error: 'Ecran necunoscut.' }, 404);
    }
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
