import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { categories, contact, load, pagePhotos, reviews, stats } from '../src/lib/content';

// Aici se verifica doar forma, nu numere precise: deploy-ul ruleaza testele dupa fiecare salvare
// din admin, deci un test pe „3 recenzii” ar opri publicarea cand clientul adauga a patra.
describe('content loaded from src/content', () => {
  it('has the shape the pages rely on', () => {
    expect(Array.isArray(reviews)).toBe(true);
    expect(categories.map((c) => c.key).sort()).toEqual(['bucatarii', 'dormitor', 'dressing', 'living']);
    expect(contact.whatsappNumber).toMatch(/^40\d{9}$/);
    expect(stats.stats).toHaveLength(3);
    expect(Object.keys(pagePhotos.categories)).toHaveLength(6);
  });

  it('stops the build with the file path and field when a file is invalid', () => {
    expect(() => load('src/content/x.json', z.object({ a: z.string().min(1, 'gol') }), { a: '' })).toThrow(
      'src/content/x.json nu e valid:\n  a: gol',
    );
  });
});
