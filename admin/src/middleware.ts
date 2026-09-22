import { defineMiddleware } from 'astro:middleware';
import { env } from './lib/env';
import { readSession, SESSION_COOKIE } from './lib/auth';

const PUBLIC = new Set(['/login', '/health']);

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { adminOrigin, sessionSecret, users } = env();
  const { pathname } = ctx.url;

  // Cererile care schimba ceva trebuie sa vina din admin (protectie CSRF, pe langa SameSite=Strict).
  if (ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') {
    if (ctx.request.headers.get('origin') !== adminOrigin) return new Response('Cerere respinsă.', { status: 403 });
  }

  if (!PUBLIC.has(pathname)) {
    const user = readSession(ctx.cookies.get(SESSION_COOKIE)?.value, sessionSecret, users);
    if (!user) {
      if (pathname.startsWith('/api/') || pathname.startsWith('/media/')) {
        return new Response(JSON.stringify({ ok: false, error: 'Sesiunea a expirat. Intră din nou în cont.' }), {
          status: 401,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        });
      }
      return ctx.redirect(`/login?next=${encodeURIComponent(pathname)}`);
    }
    ctx.locals.user = { email: user.email, name: user.name };
  }

  const res = await next();
  const headers = new Headers(res.headers);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  // HSTS doar pe https; local (http://localhost) browserul l-ar ignora oricum.
  if (adminOrigin.startsWith('https://')) headers.set('Strict-Transport-Security', 'max-age=31536000');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});
