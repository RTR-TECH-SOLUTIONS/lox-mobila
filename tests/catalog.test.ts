import { describe, it, expect } from 'vitest';
import { homeProjects } from '../src/lib/catalog';
import type { Project } from '../src/data/types';

const p = (slug: string, featured: boolean, category = 'bucatarii'): Project => ({
  slug,
  title: slug,
  category: category as Project['category'],
  weeks: 3,
  featured,
  specs: [{ label: 'Fronturi', value: 'MDF' }],
  photos: [`${slug}/01.jpg`],
});

describe('homeProjects', () => {
  it('puts projects marked for the home page first, then keeps the admin order', () => {
    const all = [p('a', false), p('b', true), p('c', false), p('d', true), p('x', true, 'living')];
    expect(homeProjects(all, 'bucatarii').map((x) => x.slug)).toEqual(['b', 'd', 'a']);
  });

  it('fills the row with other projects when few are marked', () => {
    expect(homeProjects([p('a', false), p('b', false)], 'bucatarii', 3).map((x) => x.slug)).toEqual(['a', 'b']);
  });
});
