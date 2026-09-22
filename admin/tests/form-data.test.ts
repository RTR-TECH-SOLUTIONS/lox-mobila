import { describe, it, expect } from 'vitest';
import { buildObject, toLines, toParagraphs } from '../src/lib/form-data';

describe('buildObject', () => {
  it('builds nested objects and arrays from dotted names', () => {
    expect(
      buildObject([
        ['hours', []],
        ['phoneDisplay', '0740 000 000'],
        ['hours.0.days', 'Luni'],
        ['hours.0.time', '8-17'],
        ['hours.1.days', 'Sâmbătă'],
        ['googleRating.count', 38],
        ['featured.bucatarie-in-l', true],
      ]),
    ).toEqual({
      hours: [{ days: 'Luni', time: '8-17' }, { days: 'Sâmbătă' }],
      phoneDisplay: '0740 000 000',
      googleRating: { count: 38 },
      featured: { 'bucatarie-in-l': true },
    });
  });

  it('keeps an empty list when a repeater has no rows', () => {
    expect(buildObject([['social', []]])).toEqual({ social: [] });
  });

  it('closes gaps left by removed rows', () => {
    expect(buildObject([['items.0.a', 1], ['items.2.a', 3]])).toEqual({ items: [{ a: 1 }, { a: 3 }] });
  });
});

describe('text helpers', () => {
  it('splits lines and paragraphs', () => {
    expect(toLines(' Blum Legrabox \n\n Quartz 20 mm\n')).toEqual(['Blum Legrabox', 'Quartz 20 mm']);
    expect(toParagraphs('Primul\nrând.\n\n  Al doilea.  \n\n\n')).toEqual(['Primul rând.', 'Al doilea.']);
  });
});
