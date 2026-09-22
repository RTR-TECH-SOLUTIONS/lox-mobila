import { describe, it, expect } from 'vitest';
import { safeNext, safeView } from '../src/lib/redirect';

describe('safeNext', () => {
  it('keeps paths inside the admin', () => {
    expect(safeNext('/contact')).toBe('/contact');
    expect(safeNext('/proiecte/bucatarie-in-l?publicat=1')).toBe('/proiecte/bucatarie-in-l?publicat=1');
  });

  it('sends everything else to the projects list', () => {
    for (const bad of ['//evil.com', '/\\evil.com', '/\\/evil.com', 'https://evil.com', 'evil.com', '', null, undefined]) {
      expect(safeNext(bad as string)).toBe('/proiecte');
    }
  });
});

describe('safeView', () => {
  it('keeps a path on the site', () => {
    expect(safeView('/')).toBe('/');
    expect(safeView('/proiect/bucatarie-in-l')).toBe('/proiect/bucatarie-in-l');
    expect(safeView('/mobilier?categorie=living#lista')).toBe('/mobilier?categorie=living#lista');
  });

  it('turns anything that could leave the site into the home page', () => {
    for (const bad of ['//evil.com', '/\\evil.com', '/@evil.com', '/x@evil.com', '/a b', '/a\tb', 'https://evil.com', 'evil.com', '', null, undefined]) {
      expect(safeView(bad as string)).toBe('/');
    }
  });
});
