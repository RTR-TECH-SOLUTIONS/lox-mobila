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
import { pagePhotos } from '../src/lib/content';

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
  it('slugs are unique', () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
  });

  it('every category is known', () => {
    const known = Object.keys(CATEGORY_LABELS);
    for (const p of projects) expect(known).toContain(p.category);
  });

  it('every project has a cover in its own folder', () => {
    for (const p of projects) {
      expect(p.photos[0]).toMatch(new RegExp(`^${p.slug}/.+\\.(jpe?g|webp|png)$`));
    }
  });
});

describe('content shape', () => {
  it('6 services, 6 steps numbered 01-06, 4 materials', () => {
    expect(services).toHaveLength(6);
    expect(processSteps.map((s) => s.n)).toEqual(['01', '02', '03', '04', '05', '06']);
    expect(materials).toHaveLength(4);
  });

  it('uses comma-below diacritics, never cedilla', () => {
    const blob = JSON.stringify({ site, services, projects, processSteps, materials, reviews });
    expect(blob).not.toMatch(/[ŞşŢţ]/);
  });

  it('contains no banned generic copy', () => {
    const blob = JSON.stringify({ services, processSteps }).toLowerCase();
    for (const banned of ['calitate superioară', 'soluții personalizate', 'echipa noastră de profesioniști']) {
      expect(blob).not.toContain(banned);
    }
  });
});

describe.skipIf(!existsSync(join(IMG, 'projects')))('image files exist', () => {
  it('every referenced project image is on disk', () => {
    for (const p of projects) {
      for (const f of p.photos) {
        expect(existsSync(join(IMG, 'projects', f)), f).toBe(true);
      }
    }
  });

  it('every service image is on disk', () => {
    for (const s of services) {
      expect(existsSync(join(IMG, 'services', s.image)), s.image).toBe(true);
    }
  });

  it('the workshop photo is on disk', () => {
    expect(existsSync(join(IMG, 'workshop', pagePhotos.atelier)), pagePhotos.atelier).toBe(true);
  });
});
