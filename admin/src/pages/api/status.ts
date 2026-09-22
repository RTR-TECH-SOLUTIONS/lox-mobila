import type { APIRoute } from 'astro';
import { json } from '../../lib/http';
import { repo } from '../../lib/repo';

export const GET: APIRoute = async ({ url }) => {
  const sha = url.searchParams.get('sha') ?? '';
  if (!/^[0-9a-f]{40}$/.test(sha)) return json({ ok: false }, 400);
  try {
    return json({ ok: true, state: await repo().runState(sha) });
  } catch {
    // GitHub nu raspunde acum; bara mai intreaba peste cateva secunde.
    return json({ ok: true, state: 'pending' });
  }
};
