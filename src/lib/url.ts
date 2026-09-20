/**
 * Prefixeaza caile interne cu `base`-ul site-ului.
 *
 * Pe GitHub Pages site-ul sta intr-un subfolder (`/lox-mobila/`), deci orice href
 * absolut scris ca `/proiecte` ar duce in afara site-ului. Datele raman scrise cu
 * cai logice, iar prefixarea se face la randare.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE}${path}` || '/';
}
