import { describe, it, expect } from 'vitest';
import { seo, categorySeo, type PageSeo } from '../src/data/seo';

const pages: [string, PageSeo][] = [...Object.entries(seo), ...Object.entries(categorySeo)];
const words = (s: string) => s.toLowerCase().split(/[\s:?,]+/).filter(Boolean);

describe('seo', () => {
  it.each(pages)('%s: titlul are keywordul și încape în rezultatele Google', (_, p) => {
    expect(p.title.toLowerCase()).toContain(p.keyword.toLowerCase());
    expect(p.title.length).toBeLessThanOrEqual(65);
  });

  it.each(pages)('%s: descrierea are toate cuvintele keywordului și lungimea potrivită', (_, p) => {
    const d = words(p.description);
    for (const w of words(p.keyword)) expect(d).toContain(w);
    expect(p.description.length).toBeGreaterThanOrEqual(110);
    expect(p.description.length).toBeLessThanOrEqual(165);
  });

  it('descrierea etapelor are duratele din pagină, nu goluri', () => {
    expect(seo.etape.description).toMatch(/schiță în \S+ zile, proiect 3D în \S+ zile, execuție în .+ săptămâni, montaj în \S+ zile\.$/);
  });

  it('fiecare pagină are un titlu unic', () => {
    const titles = pages.map(([, p]) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
