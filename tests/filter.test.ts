import { describe, it, expect } from 'vitest';
import { matchesFilter, ALL } from '../src/lib/filter';

describe('matchesFilter', () => {
  it('shows everything for ALL', () => {
    expect(matchesFilter('dressing', ALL)).toBe(true);
  });

  it('matches same category', () => {
    expect(matchesFilter('dressing', 'dressing')).toBe(true);
  });

  it('hides other categories', () => {
    expect(matchesFilter('living', 'dressing')).toBe(false);
  });
});
