import type { APIRoute } from 'astro';

// Verificarea de sanatate din Coolify si din Docker.
export const GET: APIRoute = () => new Response('ok', { headers: { 'content-type': 'text/plain' } });
