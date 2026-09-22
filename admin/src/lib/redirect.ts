const BASE = 'http://admin.local';

/** Unde ducem dupa login: doar o cale din admin; orice altceva (alt site, //, /\) duce la proiecte. */
export function safeNext(next: string | null | undefined, fallback = '/proiecte'): string {
  if (!next || !next.startsWith('/')) return fallback;
  try {
    const url = new URL(next, BASE);
    return url.origin === BASE ? `${url.pathname}${url.search}` : fallback;
  } catch {
    return fallback;
  }
}
