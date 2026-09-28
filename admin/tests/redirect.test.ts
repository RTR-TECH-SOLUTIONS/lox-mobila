import { describe, it, expect } from 'vitest';
import { movedTo, safeNext, safeView } from '../src/lib/redirect';

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

describe('movedTo', () => {
  const origin = 'https://admin.loxmobila.ro';

  it('sends the old admin addresses to the new one, keeping the path', () => {
    expect(movedTo('lox-admin.rtrsolutions.ro', '/proiecte?publicat=1', origin)).toBe(
      'https://admin.loxmobila.ro/proiecte?publicat=1',
    );
    expect(movedTo('www.lox-admin.rtrsolutions.ro', '/', origin)).toBe('https://admin.loxmobila.ro/');
    expect(movedTo('LOX-ADMIN.rtrsolutions.ro:443', '/login', origin)).toBe('https://admin.loxmobila.ro/login');
  });

  it('leaves every other host alone, including the healthcheck inside the container', () => {
    for (const host of ['admin.loxmobila.ro', 'localhost:4321', '127.0.0.1:4321', 'x.178.104.230.135.sslip.io', '', null]) {
      expect(movedTo(host, '/health', origin)).toBeNull();
    }
  });
});
