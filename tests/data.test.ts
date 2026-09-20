import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { site } from '../src/data/site';
import { services } from '../src/data/services';
import { projects } from '../src/data/projects';
import { processSteps } from '../src/data/process';
import { materials } from '../src/data/materials';
import { reviews } from '../src/data/reviews';
import { CATEGORY_LABELS } from '../src/data/types';

const IMG = join(process.cwd(), 'src/assets/images');

describe('site', () => {
  it('has a digits-only international WhatsApp number', () => {
    expect(site.whatsappNumber).toMatch(/^40\d{9}$/);
  });

  it('phoneHref is a tel: link', () => {
    expect(site.phoneHref).toMatch(/^tel:\+40\d{9}$/);
  });

  it('has exactly 3 stats', () => {
    expect(site.stats).toHaveLength(3);
  });
});

describe('projects', () => {
  it('has 12 projects, 6 featured', () => {
    expect(projects).toHaveLength(12);
    expect(projects.filter((p) => p.featured)).toHaveLength(6);
  });

  it('slugs are unique', () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
  });

  it('every category is known and every category is used', () => {
    const known = Object.keys(CATEGORY_LABELS);
    for (const p of projects) expect(known).toContain(p.category);
    for (const c of known) expect(projects.some((p) => p.category === c)).toBe(true);
  });

  it('every project has at least 4 specs and a cover', () => {
    for (const p of projects) {
      expect(p.specs.length).toBeGreaterThanOrEqual(4);
      expect(p.cover).toMatch(/\.(jpe?g|webp|png)$/);
    }
  });
});

describe('content shape', () => {
  it('6 services, 6 steps numbered 01-06, 4 materials, 3 reviews', () => {
    expect(services).toHaveLength(6);
    expect(processSteps.map((s) => s.n)).toEqual(['01', '02', '03', '04', '05', '06']);
    expect(materials).toHaveLength(4);
    expect(reviews).toHaveLength(3);
  });

  it('uses comma-below diacritics, never cedilla', () => {
    const blob = JSON.stringify({ site, services, projects, processSteps, materials, reviews });
    expect(blob).not.toMatch(/[ŞşŢţ]/);
  });

  it('contains no banned generic copy', () => {
    const blob = JSON.stringify({ services, processSteps, reviews }).toLowerCase();
    for (const banned of ['calitate superioară', 'soluții personalizate', 'echipa noastră de profesioniști']) {
      expect(blob).not.toContain(banned);
    }
  });
});

describe.skipIf(!existsSync(join(IMG, 'projects')))('image files exist', () => {
  it('every referenced project image is on disk', () => {
    for (const p of projects) {
      for (const f of [p.cover, ...p.gallery]) {
        expect(existsSync(join(IMG, 'projects', f)), f).toBe(true);
      }
    }
  });

  it('every service image is on disk', () => {
    for (const s of services) {
      expect(existsSync(join(IMG, 'services', s.image)), s.image).toBe(true);
    }
  });
});
