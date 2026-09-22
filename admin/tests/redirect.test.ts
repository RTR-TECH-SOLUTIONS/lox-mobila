import { describe, it, expect } from 'vitest';
import { safeNext } from '../src/lib/redirect';

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
