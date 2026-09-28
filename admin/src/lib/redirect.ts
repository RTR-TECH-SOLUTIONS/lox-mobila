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

/** Pagina de pe site pentru „Vezi pe site”: doar o cale simpla; orice altceva duce la prima pagina. */
export function safeView(view: string | null | undefined): string {
  return view && /^\/(?!\/)/.test(view) && !/[@\\\s]/.test(view) ? view : '/';
}

/** Adresele pe care a stat adminul inainte de loxmobila.ro. Linkurile salvate de client trebuie sa mearga mai departe. */
const OLD_HOSTS = new Set(['lox-admin.rtrsolutions.ro', 'www.lox-admin.rtrsolutions.ro']);

/**
 * Adresa noua pentru o cerere venita pe o adresa veche a adminului, sau null. Salvarile verifica originea
 * fata de ADMIN_ORIGIN, deci pe adresa veche paginile s-ar deschide, dar orice salvare ar fi respinsa.
 */
export function movedTo(host: string | null | undefined, pathWithSearch: string, adminOrigin: string): string | null {
  const name = (host ?? '').toLowerCase().replace(/:\d+$/, '');
  return OLD_HOSTS.has(name) ? `${adminOrigin}${pathWithSearch}` : null;
}
