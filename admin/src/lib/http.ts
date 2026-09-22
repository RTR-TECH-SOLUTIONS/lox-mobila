import { ValidationError } from './content';
import { GitHubError } from './github';
import { ImageError } from './images';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

/** Erorile cunoscute devin mesaje pentru client; restul se scriu in log. */
export function errorResponse(e: unknown): Response {
  if (e instanceof ValidationError) return json({ ok: false, error: 'Verifică câmpurile marcate.', issues: e.issues }, 422);
  if (e instanceof ImageError) return json({ ok: false, error: e.message, issues: [{ path: 'photos', message: e.message }] }, 422);
  if (e instanceof SyntaxError) return json({ ok: false, error: 'Datele au ajuns greșit. Reîncarcă pagina.' }, 400);
  console.error(e);
  if (e instanceof GitHubError) {
    return json({ ok: false, error: 'Nu am putut salva pe GitHub. Încearcă din nou peste un minut.' }, 502);
  }
  return json({ ok: false, error: 'A apărut o eroare neașteptată. Încearcă din nou.' }, 500);
}
