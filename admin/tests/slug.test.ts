import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from '../src/lib/slug';
import { formatPhone, photosLabel } from '../src/lib/format';

describe('slugify', () => {
  it('turns Romanian titles into clean addresses', () => {
    expect(slugify('Bucătărie în L')).toBe('bucatarie-in-l');
    expect(slugify('Dressing  –  perete întreg, Țuțora')).toBe('dressing-perete-intreg-tutora');
    expect(slugify('   ')).toBe('proiect');
  });

  it('adds a number when the address is taken', () => {
    expect(uniqueSlug('Bucătărie în L', ['bucatarie-in-l', 'bucatarie-in-l-2'])).toBe('bucatarie-in-l-3');
    expect(uniqueSlug('Dulap', [])).toBe('dulap');
  });
});

describe('format', () => {
  it('shows international numbers the way the client types them', () => {
    expect(formatPhone('40740000000')).toBe('0740 000 000');
  });

  it('writes Romanian plurals for photos', () => {
    expect([1, 2, 19, 20, 24].map(photosLabel)).toEqual(['1 poză', '2 poze', '19 poze', '20 de poze', '24 de poze']);
  });
});
