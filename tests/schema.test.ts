import { describe, it, expect } from 'vitest';
import {
  CATEGORY_KEYS,
  categoriesSchema,
  contactSchema,
  formatIssues,
  parseContent,
  phoneHref,
  projectsSchema,
  statsSchema,
  themeSchema,
  toWhatsapp,
} from '../src/content/schema';

const project = {
  slug: 'bucatarie-in-l',
  title: 'Bucătărie în L',
  category: 'bucatarii',
  weeks: 5,
  featured: true,
  specs: [{ label: 'Fronturi', value: 'MDF vopsit mat' }],
  photos: ['bucatarie-in-l/01.jpg'],
};

const contact = {
  phoneDisplay: '0740 000 000',
  whatsappNumber: '0740 000 000',
  email: 'contact@loxmobila.ro',
  address: 'Șos. Păcurari nr. 00, Iași',
  mapsUrl: 'https://maps.google.com/?q=Iasi',
  hours: [{ days: 'Luni - Vineri', time: '08:00 - 17:00' }],
  social: [{ label: 'Facebook', href: '#' }],
  googleReviewsUrl: '#',
};

describe('projectsSchema', () => {
  it('accepts a valid project and drops an empty description', () => {
    const [p] = projectsSchema.parse([{ ...project, description: '   ' }]);
    expect(p.description).toBeUndefined();
    expect(p.title).toBe('Bucătărie în L');
  });

  it('rejects two projects with the same slug', () => {
    expect(projectsSchema.safeParse([project, project]).success).toBe(false);
  });

  it('rejects a photo that sits outside the project folder', () => {
    expect(projectsSchema.safeParse([{ ...project, photos: ['alt-proiect/01.jpg'] }]).success).toBe(false);
  });

  it('rejects a project without photos, with a Romanian message on `photos`', () => {
    const r = projectsSchema.safeParse([{ ...project, photos: [] }]);
    expect(r.success).toBe(false);
    if (!r.success) expect(formatIssues(r.error)).toContainEqual({ path: '0.photos', message: 'Proiectul are nevoie de cel puțin o poză.' });
  });

  it('turns cedilla letters into comma-below ones', () => {
    const [p] = projectsSchema.parse([{ ...project, title: 'Uşă cu ţâţâni', description: 'Şină' }]);
    expect(p.title).toBe('Ușă cu țâțâni');
    expect(p.description).toBe('Șină');
  });

  it('rejects an unknown category and a non-integer duration', () => {
    expect(projectsSchema.safeParse([{ ...project, category: 'baie' }]).success).toBe(false);
    expect(projectsSchema.safeParse([{ ...project, weeks: 2.5 }]).success).toBe(false);
  });
});

describe('phone helpers', () => {
  it('normalizes WhatsApp numbers to the international form', () => {
    expect(toWhatsapp('0740 000 000')).toBe('40740000000');
    expect(toWhatsapp('+40 740 000 000')).toBe('40740000000');
    expect(toWhatsapp('40740000000')).toBe('40740000000');
  });

  it('builds the tel: link from the displayed number', () => {
    expect(phoneHref('0740 000 000')).toBe('tel:+40740000000');
  });
});

describe('contactSchema', () => {
  it('stores WhatsApp in international form', () => {
    expect(contactSchema.parse(contact).whatsappNumber).toBe('40740000000');
  });

  it('rejects a short phone, a bad email and a link without https', () => {
    expect(contactSchema.safeParse({ ...contact, phoneDisplay: '0740' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...contact, email: 'contact' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...contact, mapsUrl: 'maps.google.com' }).success).toBe(false);
  });
});

describe('categoriesSchema', () => {
  const page = (key: string) => ({ key, title: 'Titlu', lead: 'Introducere', body: [] });

  it('needs every category exactly once', () => {
    expect(categoriesSchema.safeParse(CATEGORY_KEYS.map(page)).success).toBe(true);
    expect(categoriesSchema.safeParse(CATEGORY_KEYS.slice(1).map(page)).success).toBe(false);
    expect(categoriesSchema.safeParse([...CATEGORY_KEYS.map(page), page('living')]).success).toBe(false);
  });
});

describe('statsSchema', () => {
  const stats = { stats: [1, 2, 3].map((n) => ({ value: String(n), label: 'eticheta' })), googleRating: { score: '4,9', count: 38 } };

  it('needs exactly 3 stats and a score like 4,9', () => {
    expect(statsSchema.safeParse(stats).success).toBe(true);
    expect(statsSchema.safeParse({ ...stats, stats: stats.stats.slice(1) }).success).toBe(false);
    expect(statsSchema.safeParse({ ...stats, googleRating: { score: '49', count: 38 } }).success).toBe(false);
  });
});

describe('themeSchema', () => {
  it('uppercases hex colors and rejects color names', () => {
    expect(themeSchema.parse({ background: '#0c0c0c', text: '#f2efea', accent: '#b7966b' }).background).toBe('#0C0C0C');
    expect(themeSchema.safeParse({ background: 'black', text: '#F2EFEA', accent: '#B7966B' }).success).toBe(false);
  });
});

describe('parseContent', () => {
  it('returns clean data or field issues without throwing', () => {
    expect(parseContent(themeSchema, { background: '#000000', text: '#ffffff', accent: '#b7966b' })).toEqual({
      ok: true,
      data: { background: '#000000', text: '#FFFFFF', accent: '#B7966B' },
    });
    const bad = parseContent(themeSchema, { background: 'negru', text: '#FFFFFF', accent: '#B7966B' });
    expect(bad).toEqual({ ok: false, issues: [{ path: 'background', message: 'Culoarea se scrie ca #RRGGBB.' }] });
  });
});
