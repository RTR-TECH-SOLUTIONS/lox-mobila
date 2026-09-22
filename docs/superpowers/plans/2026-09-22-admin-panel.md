# Panou de admin LOX Mobila: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clientul LOX își administrează singur proiectele, pozele, textele, datele de contact și culorile site-ului, dintr-un admin în română care publică prin commit pe GitHub.

**Architecture:** Conținutul editabil trece din `src/data/*.ts` în fișiere JSON din `src/content/`, validate de o schemă zod comună. Culorile site-ului se calculează din 3 culori (`theme.json`) și intră în pagină ca variabile CSS. Adminul e o aplicație Astro SSR separată (`admin/`), pe VPS în Coolify, care citește și scrie aceste fișiere prin API-ul GitHub; fiecare salvare e un singur commit, iar workflow-ul existent publică site-ul static.

**Tech Stack:** Astro 7.3 (site static + admin SSR cu `@astrojs/node` 11), Tailwind 4.3 (doar site), zod 4.6, sharp 0.35, SortableJS 1.15, Vitest 5, Playwright 1.62 (verificări vizuale), Docker + Coolify.

**Spec:** `docs/superpowers/specs/2026-09-22-admin-panel-design.md`

## Global Constraints

- Node 24, npm. Fără pnpm sau bun.
- Textele din admin și de pe site sunt în română, cu diacritice corecte: ș și ț cu virgulă, niciodată ş sau ţ. Identificatorii din cod sunt în engleză, comentariile scurte în română, în stilul fișierelor existente.
- În textele adminului nu se folosește em-dash. Fără emoji nicăieri.
- Adminul arată ca o unealtă de lucru reală: fundal neutru deschis, butoane negre cu radius 8 px, alama LOX doar în logo și la elementul activ din meniu. Fără gradient, fără iconițe decorative, fără etichete uppercase cu spațiere, fără carduri identice rotunjite puse în grilă doar ca decor.
- Tema originală a site-ului (`#0C0C0C`, `#F2EFEA`, `#B7966B`) trebuie să arate ca acum; nuanțele calculate au toleranță de 5 unități pe canal.
- Heroul cu LED-uri, meniul, pașii procesului și tabelul de materiale rămân în cod.
- Fiecare task de site se încheie cu `npm test`, `npx astro check` și `npm run build` verzi. Fiecare task de admin se încheie cu `cd admin && npm test && npx astro check && npm run build` verzi.
- Verificarea vizuală e obligatorie: site-ul la 1920, 1440, 1024, 768 și 390 px, adminul la 1280, 768 și 390 px. Fără suprapuneri, fără scroll orizontal, fără elemente ascunse.
- `prefers-reduced-motion` se respectă și în admin.
- Se lucrează pe ramura locală `admin-panel`. Pașii „Commit” sunt commit-uri locale; **nu se face push și nu se creează nimic pe GitHub sau în Coolify fără acordul explicit al lui Mario** (Task 20 are pașii care cer acordul).
- Mesajele de commit se încheie cu liniile de mai jos (în pașii de commit: `git commit -m "<titlu>" -m "<liniile>"`):
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01So7ELp54DnpkVFnwNiBxhc
  ```

## Harta fișierelor

**Site (existent, modificat)**

| Fișier | Rol |
|---|---|
| `src/content/schema.ts` (nou) | Schema zod a conținutului editabil, căile fișierelor, ajutoare pentru telefon. Folosită de site și de admin. |
| `src/content/*.json` (noi) | Conținutul: `projects`, `reviews`, `categories`, `contact`, `stats`, `page-photos`, `theme`. |
| `src/lib/content.ts` (nou) | Citește și validează JSON-urile la build. |
| `src/lib/theme.ts` (nou) | Calculul variabilelor de culoare, contrast, avertismente. Fără dependențe; rulează și în browser. |
| `src/data/*.ts` | Rămân interfața pentru componente, dar iau datele din `src/lib/content.ts`. |
| `src/styles/tokens.css`, `src/styles/global.css`, componentele | Culorile trec pe variabile; secțiunile pe fotografie primesc clasa `on-photo`. |
| `src/components/ui/Logo.astro`, `src/assets/brand/*-dark.png` | Logo cu litere închise pe fundal deschis. |
| `src/scripts/theme-preview.ts` (nou) | Aplică culorile trimise de admin când site-ul e în iframe-ul ecranului Aspect. |
| `scripts/shots.mjs`, `scripts/shot-diff.py`, `scripts/logo-variants.py` (noi) | Capturi de verificare, comparare de capturi, generarea logoului închis. |

**Admin (nou, `admin/`)**

| Fișier | Rol |
|---|---|
| `admin/src/lib/env.ts` | Configurarea din variabile de mediu. |
| `admin/src/lib/auth.ts` | Parole scrypt, sesiune semnată HMAC, limitarea login-ului. |
| `admin/src/lib/github.ts` | Citire, commit prin Git Data API, starea publicării. |
| `admin/src/lib/local-repo.ts` | Același contract ca `github.ts`, dar pe un clone local (teste cap-coadă fără GitHub). |
| `admin/src/lib/repo.ts` | Alege depozitul (GitHub sau local) și autorul commit-ului. |
| `admin/src/lib/content.ts` | Citire cu cache și salvare validată a fișierelor de conținut. |
| `admin/src/lib/images.ts`, `slug.ts`, `format.ts` | Prelucrarea pozelor, adrese de pagină, formatări mici. |
| `admin/src/lib/projects.ts`, `page-photos.ts` | Logica pură pentru salvarea proiectelor și a pozelor de pagină. |
| `admin/src/lib/form-data.ts`, `http.ts` | Formular -> obiect; răspunsuri JSON și erori. |
| `admin/src/middleware.ts` | Origine, sesiune, antete de siguranță. |
| `admin/src/pages/**` | Ecranele și rutele API. |
| `admin/src/components/**` | `Field`, `Repeater`, `RowTools`, `SaveBar`, `SpecRow`, `ProjectForm`. |
| `admin/src/scripts/**` | TypeScript pentru formulare, stare, poze, ordonare, culori. |
| `admin/Dockerfile`, `.dockerignore` (rădăcină) | Imaginea pentru Coolify. |
| `admin/e2e/flow.mjs` | Verificarea cap-coadă în modul local. |

---

## Partea A: site-ul pregătit pentru admin

### Task 1: Schema comună a conținutului

**Files:**
- Create: `src/content/schema.ts`
- Create: `tests/schema.test.ts`
- Modify: `package.json` (dependența `zod`)
- Modify: `src/data/types.ts:1` și `src/data/types.ts:69-74` (categoriile vin din schemă)

**Interfaces:**
- Produces: `CATEGORY_KEYS`, `CATEGORY_LABELS`, `ProjectCategory`, `PAGE_PHOTO_KEYS`, `PagePhotoKey`, `CONTENT_FILES`, `ContentKey`, `IMAGE_DIRS`, `toWhatsapp(value: string): string`, `phoneHref(display: string): string`, schemele `projectSchema`, `projectsSchema`, `reviewSchema`, `reviewsSchema`, `categoryPageSchema`, `categoriesSchema`, `contactSchema`, `statsSchema`, `pagePhotosSchema`, `themeSchema`, `CONTENT_SCHEMAS`, tipurile `Project`, `Review`, `CategoryPageContent`, `Contact`, `Stats`, `PagePhotos`, `Theme`, `Content`, și `formatIssues(error): { path: string; message: string }[]`.

- [ ] **Step 1: Creează ramura de lucru**

```bash
git switch -c admin-panel
```

- [ ] **Step 2: Adaugă zod ca dependență directă**

```bash
npm install zod@^4.6.5
```

Expected: `package.json` are `"zod": "^4.6.5"` în `dependencies`.

- [ ] **Step 3: Scrie testul care pică**

`tests/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  CATEGORY_KEYS,
  categoriesSchema,
  contactSchema,
  formatIssues,
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
```

- [ ] **Step 4: Rulează testul și confirmă că pică**

Run: `npx vitest run tests/schema.test.ts`
Expected: FAIL, `Failed to resolve import "../src/content/schema"`.

- [ ] **Step 5: Scrie schema**

`src/content/schema.ts`:

```ts
import { z } from 'zod';

/**
 * Schema continutului editabil din admin. O folosesc si site-ul (la build), si adminul (inainte de
 * commit), ca un fisier acceptat de admin sa treaca sigur si de build. Nu importa nimic din restul
 * site-ului: fisierul intra in imaginea Docker a adminului.
 */

export const CATEGORY_KEYS = ['bucatarii', 'dressing', 'dormitor', 'living'] as const;
export type ProjectCategory = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  bucatarii: 'Bucătării',
  dressing: 'Dressing',
  dormitor: 'Dormitor',
  living: 'Living',
};

/** Placile de categorii de pe prima pagina, in ordinea afisarii. */
export const PAGE_PHOTO_KEYS = ['bucatarii', 'dressing', 'living', 'dormitor', 'bai', 'comercial'] as const;
export type PagePhotoKey = (typeof PAGE_PHOTO_KEYS)[number];

/** Caile din repo, aceleasi pentru site si admin. */
export const CONTENT_FILES = {
  projects: 'src/content/projects.json',
  reviews: 'src/content/reviews.json',
  categories: 'src/content/categories.json',
  contact: 'src/content/contact.json',
  stats: 'src/content/stats.json',
  pagePhotos: 'src/content/page-photos.json',
  theme: 'src/content/theme.json',
} as const;
export type ContentKey = keyof typeof CONTENT_FILES;

export const IMAGE_DIRS = {
  projects: 'src/assets/images/projects',
  services: 'src/assets/images/services',
  workshop: 'src/assets/images/workshop',
} as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROJECT_PHOTO = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]{2,16}\.(?:jpg|jpeg|png|webp)$/;
const PAGE_PHOTO = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|jpeg|png|webp)$/;

/** Tastaturile vechi scriu ş și ţ cu sedilă; le trecem pe cele corecte, cu virgulă. */
export const fixDiacritics = (s: string): string =>
  s.replace(/ş/g, 'ș').replace(/Ş/g, 'Ș').replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț');

const required = (max: number) =>
  z
    .string({ error: 'Câmpul e obligatoriu.' })
    .trim()
    .min(1, 'Câmpul e obligatoriu.')
    .max(max, `Cel mult ${max} de caractere.`)
    .transform(fixDiacritics);

const link = z
  .string({ error: 'Câmpul e obligatoriu.' })
  .trim()
  .refine((v) => v === '#' || /^https?:\/\/\S+$/.test(v), 'Linkul trebuie să înceapă cu https://');

/** „0740 000 000", „+40 740 000 000" sau „40740000000" devin „40740000000". */
export function toWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('40')) return digits;
  if (digits.startsWith('0')) return `4${digits}`;
  return digits;
}

/** Linkul tel: din numarul afisat: „0740 000 000" devine „tel:+40740000000". */
export function phoneHref(display: string): string {
  return `tel:+${toWhatsapp(display)}`;
}

const PHONE_MESSAGE = 'Numărul trebuie să aibă 10 cifre, de forma 0740 000 000.';

export const projectSchema = z.object({
  slug: z.string().regex(SLUG, 'Adresa paginii poate avea doar litere mici, cifre și cratime.'),
  title: required(80),
  category: z.enum(CATEGORY_KEYS, { error: 'Alege o categorie.' }),
  weeks: z
    .number({ error: 'Scrie durata ca număr de săptămâni.' })
    .int('Durata e un număr întreg de săptămâni.')
    .min(1, 'Minimum o săptămână.')
    .max(52, 'Maximum 52 de săptămâni.'),
  featured: z.boolean(),
  description: z
    .string()
    .trim()
    .max(1200, 'Cel mult 1200 de caractere.')
    .optional()
    .transform((v) => (v ? fixDiacritics(v) : undefined)),
  specs: z
    .array(z.object({ label: required(40), value: required(120) }))
    .min(1, 'Adaugă cel puțin o specificație.')
    .max(12, 'Cel mult 12 specificații.'),
  photos: z
    .array(z.string().regex(PROJECT_PHOTO, 'Cale de poză invalidă.'))
    .min(1, 'Proiectul are nevoie de cel puțin o poză.')
    .max(24, 'Cel mult 24 de poze pe proiect.'),
});

export const projectsSchema = z.array(projectSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((p, i) => {
    if (seen.has(p.slug)) {
      ctx.addIssue({ code: 'custom', path: [i, 'slug'], message: `Adresa „${p.slug}” e folosită de două proiecte.` });
    }
    seen.add(p.slug);
    p.photos.forEach((f, j) => {
      if (!f.startsWith(`${p.slug}/`)) {
        ctx.addIssue({ code: 'custom', path: [i, 'photos', j], message: `Poza ${f} nu e în folderul proiectului.` });
      }
    });
  });
});

export const reviewSchema = z.object({ author: required(60), project: required(80), text: required(600) });
export const reviewsSchema = z.array(reviewSchema).max(20, 'Cel mult 20 de recenzii.');

export const categoryPageSchema = z.object({
  key: z.enum(CATEGORY_KEYS),
  title: required(80),
  lead: required(200),
  body: z
    .array(
      z.object({
        heading: required(120),
        paragraphs: z.array(required(1500)),
        list: z
          .array(required(160))
          .optional()
          .transform((v) => (v && v.length ? v : undefined)),
      }),
    )
    .max(8, 'Cel mult 8 blocuri de text.'),
});

export const categoriesSchema = z.array(categoryPageSchema).superRefine((list, ctx) => {
  for (const key of CATEGORY_KEYS) {
    if (list.filter((c) => c.key === key).length !== 1) {
      ctx.addIssue({ code: 'custom', path: [], message: `Categoria ${CATEGORY_LABELS[key]} trebuie să apară o singură dată.` });
    }
  }
});

export const contactSchema = z.object({
  phoneDisplay: z
    .string({ error: 'Câmpul e obligatoriu.' })
    .trim()
    .refine((v) => /^40\d{9}$/.test(toWhatsapp(v)), PHONE_MESSAGE),
  whatsappNumber: z
    .string({ error: 'Câmpul e obligatoriu.' })
    .transform(toWhatsapp)
    .pipe(z.string().regex(/^40\d{9}$/, PHONE_MESSAGE)),
  email: z.email({ error: 'Adresa de email nu e validă.' }),
  address: required(120),
  mapsUrl: link,
  hours: z
    .array(z.object({ days: required(40), time: required(40) }))
    .min(1, 'Adaugă cel puțin un rând de program.')
    .max(7, 'Cel mult 7 rânduri de program.'),
  social: z.array(z.object({ label: required(30), href: link })).max(6, 'Cel mult 6 rețele.'),
  googleReviewsUrl: link,
});

export const statsSchema = z.object({
  stats: z.array(z.object({ value: required(12), label: required(60) })).length(3, 'Sunt exact 3 cifre.'),
  googleRating: z.object({
    score: z.string().trim().regex(/^[1-5](?:[.,]\d)?$/, 'Nota se scrie ca 4,9.'),
    count: z
      .number({ error: 'Scrie numărul de recenzii.' })
      .int('Numărul de recenzii e întreg.')
      .min(0, 'Numărul de recenzii nu poate fi negativ.'),
  }),
});

const pagePhoto = z.string().regex(PAGE_PHOTO, 'Nume de poză invalid.');

export const pagePhotosSchema = z.object({
  categories: z.object({
    bucatarii: pagePhoto,
    dressing: pagePhoto,
    living: pagePhoto,
    dormitor: pagePhoto,
    bai: pagePhoto,
    comercial: pagePhoto,
  }),
  atelier: pagePhoto,
});

const hex = z
  .string({ error: 'Alege o culoare.' })
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Culoarea se scrie ca #RRGGBB.')
  .transform((v) => v.toUpperCase());

export const themeSchema = z.object({ background: hex, text: hex, accent: hex });

export const CONTENT_SCHEMAS = {
  projects: projectsSchema,
  reviews: reviewsSchema,
  categories: categoriesSchema,
  contact: contactSchema,
  stats: statsSchema,
  pagePhotos: pagePhotosSchema,
  theme: themeSchema,
} as const;

export type Project = z.output<typeof projectSchema>;
export type Review = z.output<typeof reviewSchema>;
export type CategoryPageContent = z.output<typeof categoryPageSchema>;
export type Contact = z.output<typeof contactSchema>;
export type Stats = z.output<typeof statsSchema>;
export type PagePhotos = z.output<typeof pagePhotosSchema>;
export type Theme = z.output<typeof themeSchema>;
export type Content = { [K in ContentKey]: z.output<(typeof CONTENT_SCHEMAS)[K]> };

/** Erorile in forma „cale.camp: mesaj", pentru build si pentru formularele adminului. */
export function formatIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }));
}
```

- [ ] **Step 6: Rulează testul și confirmă că trece**

Run: `npx vitest run tests/schema.test.ts`
Expected: PASS, 13 teste.

- [ ] **Step 7: Categoriile vin din schemă**

În `src/data/types.ts`, înlocuiește prima linie:

```ts
export type ProjectCategory = 'bucatarii' | 'dressing' | 'dormitor' | 'living';
```

cu:

```ts
import type { ProjectCategory } from '../content/schema';

export type { ProjectCategory };
export { CATEGORY_LABELS } from '../content/schema';
```

și șterge blocul de la final:

```ts
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  bucatarii: 'Bucătării',
  dressing: 'Dressing',
  dormitor: 'Dormitor',
  living: 'Living',
};
```

- [ ] **Step 8: Verifică tot proiectul**

Run: `npm test && npx astro check && npm run build`
Expected: toate testele trec (25 vechi + 13 noi), `0 errors`, 23 de pagini construite.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/content/schema.ts tests/schema.test.ts src/data/types.ts
git commit -m "feat(content): schema comuna pentru continutul editabil din admin"
```

---

### Task 2: Conținutul simplu în JSON

Recenziile, textele categoriilor, contactul, cifrele și pozele de pagină trec în JSON. Proiectele urmează în Task 3.

**Files:**
- Create: `scripts/export-content.ts` (rulat o dată, apoi șters)
- Create: `src/content/reviews.json`, `categories.json`, `contact.json`, `stats.json`, `page-photos.json`
- Create: `src/lib/content.ts`
- Create: `tests/content.test.ts`
- Modify: `src/data/site.ts`, `src/data/reviews.ts`, `src/data/categories.ts`, `src/data/services.ts`, `src/components/home/Experience.astro:61`

**Interfaces:**
- Consumes: schemele și `CONTENT_FILES`, `phoneHref` din Task 1.
- Produces: `src/lib/content.ts` exportă `reviews: Review[]`, `categories: CategoryPageContent[]`, `contact: Contact`, `stats: Stats`, `pagePhotos: PagePhotos` și funcția `load<S extends z.ZodType>(file: string, schema: S, data: unknown): z.output<S>`. `src/data/*` păstrează exact exporturile de acum (`site`, `reviews`, `categoryPages`, `services`).

- [ ] **Step 1: Salvează build-ul de acum pentru comparație**

```bash
npm run build && rm -rf /tmp/lox-dist-before && cp -R dist /tmp/lox-dist-before
```

- [ ] **Step 2: Scrie scriptul de export**

`scripts/export-content.ts`:

```ts
// Rulat o singura data: `npx -y tsx scripts/export-content.ts`. Scrie datele de acum in src/content/*.json.
import { writeFileSync } from 'node:fs';
import { site } from '../src/data/site';
import { reviews } from '../src/data/reviews';
import { categoryPages } from '../src/data/categories';
import { services } from '../src/data/services';

const write = (name: string, data: unknown) =>
  writeFileSync(`src/content/${name}.json`, `${JSON.stringify(data, null, 2)}\n`);

write('reviews', reviews);
write('categories', categoryPages.map(({ label: _label, ...page }) => page));
write('contact', {
  phoneDisplay: site.phoneDisplay,
  whatsappNumber: site.whatsappNumber,
  email: site.email,
  address: site.address,
  mapsUrl: site.mapsUrl,
  hours: site.hours,
  social: site.social,
  googleReviewsUrl: site.googleReviewsUrl,
});
write('stats', { stats: site.stats, googleRating: site.googleRating });
write('page-photos', {
  categories: Object.fromEntries(services.map((s) => [s.slug, s.image])),
  atelier: 'atelier.jpg',
});
```

- [ ] **Step 3: Rulează exportul și verifică fișierele**

```bash
npx -y tsx scripts/export-content.ts && ls src/content && head -12 src/content/contact.json
```

Expected: `categories.json contact.json page-photos.json reviews.json schema.ts stats.json`, iar `contact.json` începe cu `"phoneDisplay": "0740 000 000"`.

- [ ] **Step 4: Scrie testul care pică**

`tests/content.test.ts`:

```ts
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
```

- [ ] **Step 5: Rulează testul și confirmă că pică**

Run: `npx vitest run tests/content.test.ts`
Expected: FAIL, `Failed to resolve import "../src/lib/content"`.

- [ ] **Step 6: Scrie încărcătorul**

`src/lib/content.ts`:

```ts
import type { z } from 'zod';
import {
  CONTENT_FILES,
  categoriesSchema,
  contactSchema,
  formatIssues,
  pagePhotosSchema,
  reviewsSchema,
  statsSchema,
} from '../content/schema';
import reviewsJson from '../content/reviews.json';
import categoriesJson from '../content/categories.json';
import contactJson from '../content/contact.json';
import statsJson from '../content/stats.json';
import pagePhotosJson from '../content/page-photos.json';

/** Valideaza un fisier de continut; o greseala opreste build-ul cu calea si campul exact. */
export function load<S extends z.ZodType>(file: string, schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const lines = formatIssues(result.error).map((i) => `  ${i.path || '(radacina)'}: ${i.message}`);
    throw new Error(`${file} nu e valid:\n${lines.join('\n')}`);
  }
  return result.data;
}

export const reviews = load(CONTENT_FILES.reviews, reviewsSchema, reviewsJson);
export const categories = load(CONTENT_FILES.categories, categoriesSchema, categoriesJson);
export const contact = load(CONTENT_FILES.contact, contactSchema, contactJson);
export const stats = load(CONTENT_FILES.stats, statsSchema, statsJson);
export const pagePhotos = load(CONTENT_FILES.pagePhotos, pagePhotosSchema, pagePhotosJson);
```

- [ ] **Step 7: Rulează testul și confirmă că trece**

Run: `npx vitest run tests/content.test.ts`
Expected: PASS, 2 teste.

- [ ] **Step 8: Modulele din `src/data` iau datele din JSON**

`src/data/site.ts`, înlocuiește tot fișierul cu:

```ts
import type { SiteData } from './types';
import { contact, stats } from '../lib/content';
import { phoneHref } from '../content/schema';

export const site: SiteData = {
  name: 'LOX Mobila',
  tagline: 'Idei. Design. Precizie.',
  city: 'Iași',
  county: 'județul Iași',
  domain: 'loxmobila.ro',

  // Contactul, programul, cifrele si nota Google se editeaza din admin:
  // src/content/contact.json si src/content/stats.json.
  ...contact,
  phoneHref: phoneHref(contact.phoneDisplay),
  ...stats,

  nav: [
    { label: 'Acasă', href: '/' },
    {
      label: 'Mobilier',
      href: '/mobilier',
      children: [
        { label: 'Bucătării', href: '/mobilier/bucatarii' },
        { label: 'Dressing', href: '/mobilier/dressing' },
        { label: 'Dormitor', href: '/mobilier/dormitor' },
        { label: 'Living', href: '/mobilier/living' },
      ],
    },
    { label: 'Servicii', href: '/servicii' },
    { label: 'Materiale', href: '/materiale' },
    { label: 'Despre noi', href: '/cine-suntem' },
    { label: 'Contact', href: '/contact' },
  ],
};
```

`src/data/reviews.ts`, înlocuiește tot fișierul cu:

```ts
import type { Review } from './types';
import { reviews as fromAdmin } from '../lib/content';

// Recenziile se editeaza din admin: src/content/reviews.json.
export const reviews: Review[] = fromAdmin;
```

`src/data/categories.ts`: păstrează interfața `CategoryPage` (liniile 1-11) și înlocuiește tot array-ul `categoryPages` cu:

```ts
import { CATEGORY_LABELS } from './types';
import { categories } from '../lib/content';

// Textele paginilor de categorie se editeaza din admin: src/content/categories.json.
export const categoryPages: CategoryPage[] = categories.map((c) => ({ ...c, label: CATEGORY_LABELS[c.key] }));
```

Importurile noi merg sus, sub `import type { ProjectCategory } from './types';`.

`src/data/services.ts`: adaugă sus `import { pagePhotos } from '../lib/content';` și înlocuiește cele 6 valori `image`:

| slug | înainte | după |
|---|---|---|
| bucatarii | `'bucatarie.jpg'` | `pagePhotos.categories.bucatarii` |
| dressing | `'dressing.jpg'` | `pagePhotos.categories.dressing` |
| living | `'living.jpg'` | `pagePhotos.categories.living` |
| dormitor | `'dormitor.jpg'` | `pagePhotos.categories.dormitor` |
| bai | `'baie.jpg'` | `pagePhotos.categories.bai` |
| comercial | `'comercial.jpg'` | `pagePhotos.categories.comercial` |

Adaugă deasupra array-ului comentariul `// Pozele placilor se schimba din admin: src/content/page-photos.json.`

`src/components/home/Experience.astro`: adaugă în frontmatter `import { pagePhotos } from '../../lib/content';` și înlocuiește `resolveImage('workshop', 'atelier.jpg')` cu `resolveImage('workshop', pagePhotos.atelier)`.

- [ ] **Step 9: Testele vechi nu mai fixează conținutul editabil**

Deploy-ul rulează `npm test` după fiecare salvare din admin, deci testele nu au voie să ceară numere pe care clientul le schimbă. În `tests/data.test.ts`:

- în `content shape`, testul `6 services, 6 steps numbered 01-06, 4 materials, 3 reviews` devine:

```ts
  it('6 services, 6 steps numbered 01-06, 4 materials', () => {
    expect(services).toHaveLength(6);
    expect(processSteps.map((s) => s.n)).toEqual(['01', '02', '03', '04', '05', '06']);
    expect(materials).toHaveLength(4);
  });
```

- în `contains no banned generic copy`, `JSON.stringify({ services, processSteps, reviews })` devine `JSON.stringify({ services, processSteps })` (recenziile le scrie clientul);
- în `image files exist`, adaugă:

```ts
  it('the workshop photo is on disk', () => {
    expect(existsSync(join(IMG, 'workshop', pagePhotos.atelier)), pagePhotos.atelier).toBe(true);
  });
```

cu `import { pagePhotos } from '../src/lib/content';` sus.

- [ ] **Step 10: Șterge scriptul de export**

```bash
rm scripts/export-content.ts
```

- [ ] **Step 11: Verifică și compară build-ul**

Run: `npm test && npx astro check && npm run build && diff -r /tmp/lox-dist-before dist && echo IDENTIC`
Expected: testele trec, `0 errors`, iar la final `IDENTIC` (conținutul e același, deci HTML-ul și pozele ies la fel).

- [ ] **Step 12: Commit**

```bash
git add src/content src/lib/content.ts tests/content.test.ts tests/data.test.ts src/data src/components/home/Experience.astro
git commit -m "feat(content): recenzii, categorii, contact, cifre si poze de pagina in JSON"
```

---

### Task 3: Proiectele în JSON și pozele pe foldere

**Files:**
- Create: `scripts/migrate-projects.ts` (rulat o dată, apoi șters)
- Create: `src/content/projects.json`
- Create: `scripts/shots.mjs`
- Create: `tests/catalog.test.ts`
- Modify: `package.json` (devDependency `playwright`), `.gitignore`
- Modify: `src/data/types.ts:36-45` (tipul `Project`), `src/data/projects.ts`, `src/lib/content.ts`, `src/lib/catalog.ts`
- Modify: `src/components/home/Projects.astro:14,38`, `src/components/Catalog.astro:89`, `src/pages/proiect/[slug].astro:19,97-107,144`, `tests/data.test.ts`
- Move: `src/assets/images/projects/*.jpg` în `src/assets/images/projects/<slug>/NN.jpg` (la fel în `placeholder/projects/`)

**Interfaces:**
- Consumes: `projectsSchema`, `Project` din Task 1; `load` din Task 2.
- Produces: `projects: Project[]` din `src/lib/content.ts`; `Project` are `photos: string[]` (calea `<slug>/<fisier>`, prima = coperta) și `description?: string`, fără `cover` și `gallery`; `homeProjects(all: Project[], category: string, n?: number): Project[]` în `src/lib/catalog.ts`; `scripts/shots.mjs <folder> [pagini] [latimi]`.

- [ ] **Step 1: Scrie migrarea**

`scripts/migrate-projects.ts`:

```ts
// Rulat o singura data: `npx -y tsx scripts/migrate-projects.ts`.
// Muta pozele fiecarui proiect in folderul lui (numele pierd cartierele) si scrie src/content/projects.json.
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { projects } from '../src/data/projects';

const ROOT = 'src/assets/images';

function move(dir: string, from: string, to: string): void {
  const src = join(ROOT, dir, from);
  if (!existsSync(src)) return;
  const dest = join(ROOT, dir, to);
  mkdirSync(dirname(dest), { recursive: true });
  renameSync(src, dest);
}

const out = projects.map(({ cover, gallery, ...p }) => {
  const photos = [cover, ...gallery].map((file, i) => {
    const to = `${p.slug}/${String(i + 1).padStart(2, '0')}.jpg`;
    move('projects', file, to);
    move('placeholder/projects', file, to);
    return to;
  });
  return { ...p, photos };
});

writeFileSync('src/content/projects.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(`${out.length} proiecte, ${out.reduce((n, p) => n + p.photos.length, 0)} poze mutate`);
```

- [ ] **Step 2: Rulează migrarea**

Run: `npx -y tsx scripts/migrate-projects.ts && ls src/assets/images/projects && rm scripts/migrate-projects.ts`
Expected: `12 proiecte, 15 poze mutate`, iar în `projects/` apar doar cele 12 foldere cu slug-uri (`bucatarie-in-l`, `dressing-walk-in` ...), fără fișiere `.jpg` rămase la rădăcină.

- [ ] **Step 3: Scrie testul care pică pentru tab-urile de pe prima pagină**

`tests/catalog.test.ts`:

```ts
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
```

- [ ] **Step 4: Rulează testul și confirmă că pică**

Run: `npx vitest run tests/catalog.test.ts`
Expected: FAIL, `homeProjects is not a function` (sau eroare de tip pe `photos`).

- [ ] **Step 5: Tipul `Project` vine din schemă**

În `src/data/types.ts`, șterge `interface ProjectSpec` și `interface Project` (liniile cu `slug`, `title`, `category`, `weeks`, `cover`, `gallery`, `specs`, `featured`) și pune în loc:

```ts
export type { Project } from '../content/schema';
```

(`ProjectSpec` nu mai e folosit nicăieri altundeva, deci dispare.)

`src/lib/content.ts`: adaugă `projectsSchema` în importul din `../content/schema`, adaugă `import projectsJson from '../content/projects.json';` și la final:

```ts
export const projects = load(CONTENT_FILES.projects, projectsSchema, projectsJson);
```

`src/data/projects.ts`, înlocuiește tot fișierul cu:

```ts
import type { Project } from './types';
import { projects as fromAdmin } from '../lib/content';

// Proiectele se editeaza din admin: src/content/projects.json,
// pozele stau in src/assets/images/projects/<slug>/.
export const projects: Project[] = fromAdmin;
```

`src/lib/catalog.ts`, adaugă la final:

```ts
/**
 * Proiectele din tab-ul unei categorii pe prima pagina: intai cele bifate „Pe prima pagina”,
 * apoi restul, in ordinea din admin.
 */
export function homeProjects(all: Project[], category: string, n = 3): Project[] {
  const inCategory = all.filter((p) => p.category === category);
  return [...inCategory.filter((p) => p.featured), ...inCategory.filter((p) => !p.featured)].slice(0, n);
}
```

- [ ] **Step 6: Rulează testul și confirmă că trece**

Run: `npx vitest run tests/catalog.test.ts`
Expected: PASS, 2 teste.

- [ ] **Step 7: Componentele folosesc `photos` și descrierea opțională**

`src/components/home/Projects.astro`:
- importă `homeProjects` din `'../../lib/catalog'`;
- înlocuiește `const picked = tabs.flatMap((t) => projects.filter((p) => p.category === t.key).slice(0, PER_TAB));` cu `const picked = tabs.flatMap((t) => homeProjects(projects, t.key, PER_TAB));`;
- înlocuiește `resolveImage('projects', p.cover)` cu `resolveImage('projects', p.photos[0])`.

`src/components/Catalog.astro:89`: `resolveImage('projects', p.cover)` devine `resolveImage('projects', p.photos[0])`.

`src/pages/proiect/[slug].astro`:
- linia 19: `const images = [p.cover, ...p.gallery];` devine `const images = p.photos;`;
- linia 144: `resolveImage('projects', o.cover)` devine `resolveImage('projects', o.photos[0])`;
- blocul `<div class="desc">` (liniile 97-107) devine:

```astro
      <div class="desc">
        <h2>Descriere</h2>
        {
          p.description ? (
            p.description.split(/\n\s*\n/).map((para) => <p>{para}</p>)
          ) : (
            <>
              <p>
                {`Totul a fost desenat pe cotele casei, după măsurători cu laserul. De la măsurători până la montaj au trecut ${p.weeks} săptămâni.`}
              </p>
              <p>
                Toate piesele au fost debitate pe CNC în atelierul nostru din Iași, direct din fișierul
                proiectului, și montate de probă înainte de livrare.
                {materials.length > 0 && ` Materiale folosite: ${materials.join(', ')}.`}
              </p>
            </>
          )
        }
        <ul>
          {p.specs.map((s) => <li><strong>{s.label}:</strong> {s.value}</li>)}
        </ul>
      </div>
```

`tests/data.test.ts` (aceeași regulă: fără numere pe care clientul le schimbă din admin):
- testul `has 12 projects, 6 featured` se șterge;
- testul `every category is known and every category is used` devine:

```ts
  it('every category is known', () => {
    const known = Object.keys(CATEGORY_LABELS);
    for (const p of projects) expect(known).toContain(p.category);
  });
```

- testul `every project has at least 4 specs and a cover` devine `every project has a cover in its own folder` și pierde condiția de 4 specificații (schema cere minimum una);
- în același test, înlocuiește `expect(p.cover).toMatch(/\.(jpe?g|webp|png)$/);` cu `expect(p.photos[0]).toMatch(new RegExp(`^${p.slug}/.+\\.(jpe?g|webp|png)$`));`;
- în `every referenced project image is on disk`, înlocuiește `for (const f of [p.cover, ...p.gallery])` cu `for (const f of p.photos)`.

- [ ] **Step 8: Scriptul de capturi**

```bash
npm install -D playwright@1.62.1 && npx playwright install chromium
printf '\n# capturi de verificare\n.shots/\n' >> .gitignore
```

`scripts/shots.mjs`:

```js
// Capturi de verificare: node scripts/shots.mjs <folder> [pagini separate cu virgula] [latimi]
// Cere site-ul pornit: npm run build && npx astro preview --port 4322
// Iese cu cod 1 daca o pagina are scroll orizontal, elemente ascunse, poze stricate sau erori in consola.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [out = '.shots/site', pagesArg, widthsArg] = process.argv.slice(2);
const BASE = process.env.BASE_URL ?? 'http://localhost:4322';
const pages = (
  pagesArg ?? '/,/mobilier,/mobilier/bucatarii,/proiect/bucatarie-in-l,/servicii,/materiale,/etape,/cine-suntem,/contact'
).split(',');
const widths = (widthsArg ?? '1920,1440,1024,768,390').split(',').map(Number);

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
let problems = 0;

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('requestfailed', (r) => errors.push(`cerere esuata: ${r.url()}`));

  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(40);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const info = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      hidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length,
      broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    }));
    const name = `${p === '/' ? 'home' : p.slice(1).replaceAll('/', '_')}-${w}`;
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    const bad = info.overflow > 0 || info.hidden > 0 || info.broken.length > 0;
    if (bad) problems++;
    console.log(bad ? 'PROBLEMA' : 'ok', name, JSON.stringify(info));
  }

  if (errors.length) {
    problems++;
    console.log('ERORI', w, errors.slice(0, 5));
  }
  await ctx.close();
}

await browser.close();
process.exit(problems ? 1 : 0);
```

- [ ] **Step 9: Verifică tot**

Run: `npm test && npx astro check && npm run build`
Expected: testele trec, `0 errors`, 23 de pagini.

Apoi, într-un terminal separat, `npx astro preview --port 4322`, și:

Run: `node scripts/shots.mjs .shots/task3 /,/mobilier,/proiect/bucatarie-in-l,/proiect/bucatarie-cu-insula 1440,390`
Expected: toate rândurile `ok`, cod de ieșire 0. Deschide `.shots/task3/home-1440.png` și `proiect_bucatarie-cu-insula-1440.png` cu Read: tab-ul Bucătării arată aceleași 3 proiecte ca înainte (Bucătărie în L, Bucătărie cu insulă, Bucătărie liniară), iar galeria proiectului cu insulă are 2 miniaturi.

- [ ] **Step 10: Commit**

```bash
git add -A src/assets/images/projects src/assets/images/placeholder src/content/projects.json src/data src/lib tests scripts/shots.mjs src/components src/pages package.json package-lock.json .gitignore
git commit -m "feat(content): proiectele in JSON, pozele in cate un folder pe proiect"
```

---

### Task 4: Calculul temei de culori

**Files:**
- Create: `src/lib/theme.ts`
- Create: `tests/theme.test.ts`

**Interfaces:**
- Produces: `ThemeColors { background: string; text: string; accent: string }`, `Scheme = 'dark' | 'light'`, `ThemeWarning { field: 'text' | 'accent'; message: string }`, `ORIGINAL_THEME`, `LIGHT_THEME`, `parseHex(hex): [number, number, number]`, `toHex(rgb): string`, `mix(a, b, t): string`, `luminance(hex): number`, `contrast(a, b): number`, `schemeOf(background): Scheme`, `accentHi(accent, scheme): string`, `onAccent(accent): string`, `deriveTheme(c): { scheme: Scheme; vars: Record<string, string> }`, `themeCss(c): string`, `themeWarnings(c): ThemeWarning[]`. Variabilele scrise de `deriveTheme`: `--color-ink`, `--color-ink-2`, `--color-ink-3`, `--color-line`, `--color-deep`, `--color-bone`, `--color-bone-2`, `--color-brass`, `--color-brass-hi`, `--color-on-accent`, `--photo-brass-hi`, `--shadow-rgb`, `--shadow-k`.

- [ ] **Step 1: Scrie testul care pică**

`tests/theme.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  LIGHT_THEME,
  ORIGINAL_THEME,
  contrast,
  deriveTheme,
  parseHex,
  schemeOf,
  themeCss,
  themeWarnings,
} from '../src/lib/theme';

const close = (a: string, b: string, tol = 5) => {
  const x = parseHex(a);
  const y = parseHex(b);
  return x.every((v, i) => Math.abs(v - y[i]) <= tol);
};

describe('deriveTheme', () => {
  it('reproduces the current palette from the three original colors', () => {
    const { scheme, vars } = deriveTheme(ORIGINAL_THEME);
    expect(scheme).toBe('dark');
    const current: Record<string, string> = {
      '--color-ink': '#0C0C0C',
      '--color-ink-2': '#141414',
      '--color-ink-3': '#1E1E1E',
      '--color-line': '#2A2A2A',
      '--color-deep': '#080808',
      '--color-bone': '#F2EFEA',
      '--color-bone-2': '#A8A39B',
      '--color-brass': '#B7966B',
      '--color-brass-hi': '#C9AA80',
      '--photo-brass-hi': '#C9AA80',
    };
    for (const [name, value] of Object.entries(current)) {
      expect(close(vars[name], value), `${name}: ${vars[name]} fata de ${value}`).toBe(true);
    }
    expect(vars['--color-on-accent']).toBe('#0C0C0C');
    expect(vars['--shadow-rgb']).toBe('0 0 0');
    expect(vars['--shadow-k']).toBe('1');
  });

  it('switches to the light scheme on a light background', () => {
    expect(schemeOf('#F5F2ED')).toBe('light');
    expect(schemeOf('#0C0C0C')).toBe('dark');
    const { vars } = deriveTheme(LIGHT_THEME);
    expect(vars['--shadow-k']).toBe('0.3');
    expect(vars['--color-on-accent']).toBe('#FFFFFF');
  });
});

describe('contrast and warnings', () => {
  it('measures WCAG contrast', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });

  it('the light preset passes AA for text and accent', () => {
    expect(themeWarnings(LIGHT_THEME)).toEqual([]);
    expect(contrast(LIGHT_THEME.text, LIGHT_THEME.background)).toBeGreaterThanOrEqual(7);
    expect(contrast(LIGHT_THEME.accent, LIGHT_THEME.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('warns about text and accent that are hard to see', () => {
    const w = themeWarnings({ background: '#FFFFFF', text: '#CCCCCC', accent: '#EEEEEE' });
    expect(w.map((x) => x.field)).toEqual(['text', 'accent']);
  });
});

describe('themeCss', () => {
  it('writes color-scheme and every variable on :root', () => {
    const css = themeCss(ORIGINAL_THEME);
    expect(css.startsWith(':root{color-scheme:dark;')).toBe(true);
    expect(css).toContain('--color-ink:#0C0C0C');
    expect(css).toContain('--shadow-rgb:0 0 0');
  });
});
```

- [ ] **Step 2: Rulează testul și confirmă că pică**

Run: `npx vitest run tests/theme.test.ts`
Expected: FAIL, `Failed to resolve import "../src/lib/theme"`.

- [ ] **Step 3: Scrie calculul**

`src/lib/theme.ts`:

```ts
/**
 * Culorile site-ului din cele 3 alese in admin: fundal, text, accent. Restul nuantelor se
 * calculeaza de aici, ca orice combinatie sa ramana coerenta. Fara dependinte: ruleaza la build,
 * in admin pe server si in browser, la previzualizare.
 */

export interface ThemeColors {
  background: string;
  text: string;
  accent: string;
}

export type Scheme = 'dark' | 'light';

export interface ThemeWarning {
  field: 'text' | 'accent';
  message: string;
}

export const ORIGINAL_THEME: ThemeColors = { background: '#0C0C0C', text: '#F2EFEA', accent: '#B7966B' };
export const LIGHT_THEME: ThemeColors = { background: '#F5F2ED', text: '#151412', accent: '#86643A' };

type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Culoare invalida: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex(rgb: Rgb): string {
  const part = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0');
  return `#${rgb.map(part).join('')}`.toUpperCase();
}

/** `a` amestecat cu `t` din `b`: t = 0 da `a`, t = 1 da `b`. */
export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrastul WCAG intre doua culori, de la 1 la 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function schemeOf(background: string): Scheme {
  return contrast(background, '#FFFFFF') > contrast(background, '#000000') ? 'dark' : 'light';
}

function toHsl([r, g, b]: Rgb): Rgb {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function fromHsl([h, s, l]: Rgb): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** Accentul pentru hover: mai deschis si putin mai saturat pe fundal inchis, mai inchis pe fundal deschis. */
export function accentHi(accent: string, scheme: Scheme): string {
  const [h, s, l] = toHsl(parseHex(accent));
  return toHex(
    fromHsl(scheme === 'dark' ? [h, Math.min(1, s * 1.16), Math.min(1, l + 0.076)] : [h, s, Math.max(0, l - 0.08)]),
  );
}

/** Textul de pe butoanele pline: negru sau alb, care se citeste mai bine pe accent. */
export function onAccent(accent: string): string {
  return contrast(accent, '#0C0C0C') >= contrast(accent, '#FFFFFF') ? '#0C0C0C' : '#FFFFFF';
}

export function deriveTheme(c: ThemeColors): { scheme: Scheme; vars: Record<string, string> } {
  const scheme = schemeOf(c.background);
  const dark = scheme === 'dark';
  return {
    scheme,
    vars: {
      '--color-ink': c.background.toUpperCase(),
      '--color-ink-2': mix(c.background, c.text, 0.035),
      '--color-ink-3': mix(c.background, c.text, 0.08),
      '--color-line': mix(c.background, c.text, 0.13),
      '--color-deep': dark ? mix(c.background, '#000000', 0.35) : mix(c.background, c.text, 0.05),
      '--color-bone': c.text.toUpperCase(),
      '--color-bone-2': mix(c.text, c.background, 0.34),
      '--color-brass': c.accent.toUpperCase(),
      '--color-brass-hi': accentHi(c.accent, scheme),
      '--color-on-accent': onAccent(c.accent),
      '--photo-brass-hi': accentHi(c.accent, 'dark'),
      '--shadow-rgb': dark ? '0 0 0' : '38 30 20',
      '--shadow-k': dark ? '1' : '0.3',
    },
  };
}

export function themeCss(c: ThemeColors): string {
  const { scheme, vars } = deriveTheme(c);
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `:root{color-scheme:${scheme};${body}}`;
}

export function themeWarnings(c: ThemeColors): ThemeWarning[] {
  const out: ThemeWarning[] = [];
  if (contrast(c.text, c.background) < 4.5) out.push({ field: 'text', message: 'Textul se citește greu pe fundalul ăsta.' });
  if (contrast(c.accent, c.background) < 3) {
    out.push({ field: 'accent', message: 'Butoanele și linkurile se văd slab pe fundalul ăsta.' });
  }
  return out;
}
```

- [ ] **Step 4: Rulează testul și confirmă că trece**

Run: `npx vitest run tests/theme.test.ts`
Expected: PASS, 6 teste. Dacă testul de paletă pică pe o singură nuanță, mesajul arată valoarea calculată; ajustează doar proporția acelei nuanțe în `deriveTheme`, cu pas de 0,005, până intră în toleranță.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts tests/theme.test.ts
git commit -m "feat(theme): nuantele site-ului calculate din fundal, text si accent"
```

---

### Task 5: Site-ul pe variabile de temă

Paleta din `@theme` rămâne cu aceleași nume (`ink`, `bone`, `brass`), dar valorile vin din `theme.json`: `ink` = fundal, `bone` = text, `brass` = accent. Culorile scrise direct în componente trec pe aceste variabile. Secțiunile pe fotografie primesc clasa `on-photo`, care readuce paleta închisă în interiorul lor, ca textul de peste poze să rămână deschis în orice temă.

**Files:**
- Create: `src/content/theme.json`, `scripts/shot-diff.py`
- Modify: `src/lib/content.ts`, `src/layouts/Base.astro`, `src/styles/tokens.css`, `src/styles/global.css`
- Modify: `src/components/Header.astro`, `Hero.astro`, `CtaBand.astro`, `Footer.astro`, `ConsultForm.astro`, `Catalog.astro`, `Process.astro`, `ui/Button.astro`, `ui/PageBanner.astro`, `ui/Partners.astro`, `home/Categories.astro`, `home/ProcessAccordion.astro`, `home/Experience.astro`
- Modify: `src/pages/servicii.astro`, `src/pages/contact.astro`, `src/pages/proiect/[slug].astro`

**Interfaces:**
- Consumes: `themeSchema` (Task 1), `deriveTheme`, `themeCss` (Task 4), `load` (Task 2).
- Produces: `theme: Theme` din `src/lib/content.ts`; `<html data-scheme="dark|light">`; clasa globală `.on-photo`; utilitarul Tailwind `text-on-accent`; variabilele `--color-deep`, `--color-on-accent`, `--photo-brass-hi`, `--shadow-rgb`, `--shadow-k`.

- [ ] **Step 1: Capturi de referință înainte de schimbare**

În terminalul separat: `npm run build && npx astro preview --port 4322`. Apoi:

Run: `node scripts/shots.mjs .shots/before /,/mobilier/bucatarii,/proiect/bucatarie-in-l,/servicii,/contact,/etape 1440,390`
Expected: toate `ok`.

- [ ] **Step 2: Fișierul temei și citirea lui**

`src/content/theme.json`:

```json
{
  "background": "#0C0C0C",
  "text": "#F2EFEA",
  "accent": "#B7966B"
}
```

`src/lib/content.ts`: adaugă `themeSchema` la importul din schemă, `import themeJson from '../content/theme.json';` și la final:

```ts
export const theme = load(CONTENT_FILES.theme, themeSchema, themeJson);
```

- [ ] **Step 3: Tokenurile**

În `src/styles/tokens.css`, în blocul `@theme`, după `--color-brass-hi: #C9AA80;` adaugă:

```css
  /* Subsolul, cu o treapta sub fundal, si textul de pe butoanele pline de accent. */
  --color-deep: #080808;
  --color-on-accent: #0C0C0C;
```

Deasupra blocului `@theme` adaugă comentariul:

```css
/* Paleta e a temei din src/content/theme.json: ink = fundal, bone = text, brass = accent.
   Valorile de aici sunt tema originala; Base.astro le suprascrie cu cele calculate in src/lib/theme.ts. */
```

În `:root`, înlocuiește `--text-body: rgb(242 239 234 / 0.88);` cu:

```css
  --text-body: color-mix(in srgb, var(--color-bone) 88%, transparent);
```

și adaugă, tot în `:root`, după `--focus: var(--color-brass);`:

```css
  --photo-brass-hi: #C9AA80;
  /* Umbrele: negre pe tema inchisa, maro foarte slab pe cea deschisa (vezi deriveTheme). */
  --shadow-rgb: 0 0 0;
  --shadow-k: 1;
```

La finalul fișierului adaugă:

```css
/* Peste fotografii (hero, bannere, banda de final, placile de categorii) ramane paleta
   inchisa, ca textul sa se citeasca si pe tema deschisa. Headerul intra aici cat timp
   sta transparent peste hero. */
:is(.on-photo, [data-header][data-overlay='true']:not(.is-scrolled)) {
  --color-ink: #0C0C0C;
  --color-ink-2: #141414;
  --color-ink-3: #1E1E1E;
  --color-line: #2A2A2A;
  --color-bone: #F2EFEA;
  --color-bone-2: #A8A39B;
  --color-brass-hi: var(--photo-brass-hi);
  --shadow-rgb: 0 0 0;
  --shadow-k: 1;
  --surface: var(--color-ink);
  --text: var(--color-bone);
  --text-body: color-mix(in srgb, var(--color-bone) 88%, transparent);
  --text-2: var(--color-bone-2);
  --rule: var(--color-line);
  color: var(--text);
}
```

- [ ] **Step 4: Tema intră în pagină**

`src/layouts/Base.astro`, în frontmatter adaugă:

```ts
import { theme } from '../lib/content';
import { deriveTheme, themeCss } from '../lib/theme';

const { scheme } = deriveTheme(theme);
```

Înlocuiește `<html lang="ro">` cu `<html lang="ro" data-scheme={scheme}>`, `<meta name="theme-color" content="#0C0C0C" />` cu `<meta name="theme-color" content={theme.background} />`, și adaugă imediat după `<meta name="description" ... />`:

```astro
    <style is:inline set:html={themeCss(theme)}></style>
```

În `<style>`-ul din Base, la `.skip-link`, `color: var(--color-ink);` devine `color: var(--color-on-accent);`.

- [ ] **Step 5: Culorile scrise direct devin variabile**

Aplică exact înlocuirile de mai jos. `A` e opacitatea din valoarea veche (de exemplu 0.78 devine 78%).

| Fișier | Înainte | După |
|---|---|---|
| `src/styles/global.css` (`::selection`) | `color: var(--color-ink);` | `color: var(--color-on-accent);` |
| `src/styles/global.css` (`.more`) | `text-decoration-color: rgb(242 239 234 / 0.35);` | `text-decoration-color: color-mix(in srgb, var(--color-bone) 35%, transparent);` |
| `Header.astro` (fundal la scroll) | `background: rgb(12 12 12 / 0.78);` | `background: color-mix(in srgb, var(--color-ink) 78%, transparent);` |
| `Header.astro` | `border-bottom-color: rgb(255 255 255 / 0.06);` | `border-bottom-color: color-mix(in srgb, var(--color-bone) 6%, transparent);` |
| `Header.astro` (`.nav-link`) | `color: rgb(242 239 234 / 0.78);` | `color: color-mix(in srgb, var(--color-bone) 78%, transparent);` |
| `Header.astro` (`.nav-drop__menu`) | `box-shadow: 0 18px 40px rgb(0 0 0 / 0.5);` | `box-shadow: 0 18px 40px rgb(var(--shadow-rgb) / calc(0.5 * var(--shadow-k)));` |
| `Header.astro` (`.nav-drop__menu a`) | `color: rgb(242 239 234 / 0.8);` | `color: color-mix(in srgb, var(--color-bone) 80%, transparent);` |
| `Hero.astro` (`.hero__lead`, linia 142) | `color: rgb(242 239 234 / 0.85);` | `color: color-mix(in srgb, var(--color-bone) 85%, transparent);` |
| `CtaBand.astro` | `.cta p { margin-top: 8px; color: rgb(242 239 234 / 0.8); }` | `.cta p { margin-top: 8px; color: color-mix(in srgb, var(--color-bone) 80%, transparent); }` |
| `PageBanner.astro` (linia 105) | `color: rgb(242 239 234 / 0.82);` | `color: color-mix(in srgb, var(--color-bone) 82%, transparent);` |
| `PageBanner.astro` (linia 121) | `color: rgb(242 239 234 / 0.7);` | `color: color-mix(in srgb, var(--color-bone) 70%, transparent);` |
| `Categories.astro` (`.tile__kicker`) | `color: rgb(242 239 234 / 0.75);` | `color: color-mix(in srgb, var(--color-bone) 75%, transparent);` |
| `Partners.astro` | `border: 1px dashed rgb(242 239 234 / 0.18);` | `border: 1px dashed color-mix(in srgb, var(--color-bone) 18%, transparent);` |
| `Partners.astro` | `color: rgb(242 239 234 / 0.45);` | `color: color-mix(in srgb, var(--color-bone) 45%, transparent);` |
| `ProcessAccordion.astro` (`.step__n`) | `color: rgb(242 239 234 / 0.35);` | `color: color-mix(in srgb, var(--color-bone) 35%, transparent);` |
| `ProcessAccordion.astro` | `box-shadow: 0 20px 50px rgb(0 0 0 / 0.45);` | `box-shadow: 0 20px 50px rgb(var(--shadow-rgb) / calc(0.45 * var(--shadow-k)));` |
| `Experience.astro` | `box-shadow: 0 20px 50px rgb(0 0 0 / 0.45);` | `box-shadow: 0 20px 50px rgb(var(--shadow-rgb) / calc(0.45 * var(--shadow-k)));` |
| `ConsultForm.astro` | `box-shadow: 0 20px 50px rgb(0 0 0 / 0.4);` | `box-shadow: 0 20px 50px rgb(var(--shadow-rgb) / calc(0.4 * var(--shadow-k)));` |
| `ConsultForm.astro` (`.cf__btn`, linia 87) | `color: var(--color-ink);` | `color: var(--color-on-accent);` |
| `Catalog.astro` | `box-shadow: 0 16px 40px rgb(0 0 0 / 0.35);` | `box-shadow: 0 16px 40px rgb(var(--shadow-rgb) / calc(0.35 * var(--shadow-k)));` |
| `Catalog.astro` (linia 166) | `background: var(--color-brass); color: var(--color-ink);` | `background: var(--color-brass); color: var(--color-on-accent);` |
| `Process.astro` (`.plan__bar--shop`, linia 154) | `color: var(--color-ink);` | `color: var(--color-on-accent);` |
| `servicii.astro` | `box-shadow: 0 24px 50px rgb(0 0 0 / 0.45);` | `box-shadow: 0 24px 50px rgb(var(--shadow-rgb) / calc(0.45 * var(--shadow-k)));` |
| `contact.astro` | `box-shadow: 0 20px 50px rgb(0 0 0 / 0.4);` | `box-shadow: 0 20px 50px rgb(var(--shadow-rgb) / calc(0.4 * var(--shadow-k)));` |
| `contact.astro` (linia 160) | `.info__card--dark { background: var(--color-brass); color: var(--color-ink); }` | `.info__card--dark { background: var(--color-brass); color: var(--color-on-accent); }` |
| `contact.astro` (linia 161) | `.info__card--dark svg { color: var(--color-ink); }` | `.info__card--dark svg { color: var(--color-on-accent); }` |
| `contact.astro` (linia 225) | `.form__btn:hover { background: var(--color-brass-hi); }` | `.form__btn:hover { background: var(--color-brass-hi); color: var(--color-on-accent); }` |
| `Footer.astro` (linia 84) | `.footer { background: #080808; }` | `.footer { background: var(--color-deep); }` |
| `ui/Button.astro` (primary) | `bg-brass text-ink hover:bg-brass-hi` | `bg-brass text-on-accent hover:bg-brass-hi` |

Rămân neschimbate, pentru că sunt voaluri peste poze și trebuie să fie închise în orice temă: `#000` și `rgb(0 0 0 / ...)` din `Hero.astro` și `Categories.astro`, `rgb(12 12 12 / ...)` din `Hero.astro` și `.photo-shade`, sclipirea `rgb(255 255 255 / 0.45)` din `.btn-shine`, măștile `#000` din `Hero.astro` și `Partners.astro`.

- [ ] **Step 6: Secțiunile pe fotografie primesc `on-photo`**

| Fișier | Înainte | După |
|---|---|---|
| `Hero.astro` | `<section class="hero" aria-labelledby="hero-title" data-hero>` | `<section class="hero on-photo" aria-labelledby="hero-title" data-hero>` |
| `ui/PageBanner.astro` | `<section class:list={['pb', categories && 'pb--cats']}>` | `<section class:list={['pb', 'on-photo', categories && 'pb--cats']}>` |
| `CtaBand.astro` | `<section class="cta">` | `<section class="cta on-photo">` |
| `home/Categories.astro` | `<a href={link(s.slug)} class="tile">` | `<a href={link(s.slug)} class="tile on-photo">` |
| `proiect/[slug].astro` | `<div class="mat-band">` | `<div class="mat-band on-photo">` |

- [ ] **Step 7: Verificare de cod**

Run: `grep -rnE "rgb\(242 239 234|rgb\(255 255 255 / 0\.06|#080808|text-ink hover" src/components src/pages src/layouts src/styles/global.css`
Expected: nicio linie.

Run: `npm test && npx astro check && npm run build`
Expected: verde, 23 de pagini.

- [ ] **Step 8: Scriptul de comparare a capturilor**

`scripts/shot-diff.py`:

```python
"""Compara doua foldere de capturi: python3 scripts/shot-diff.py .shots/before .shots/after

Un pixel conteaza ca schimbat daca un canal difera cu peste 16 unitati. O captura trece daca
are sub 0,5% pixeli schimbati. Iese cu cod 1 daca vreo captura nu trece.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

LIMIT_LEVEL = 16
LIMIT_SHARE = 0.005

before, after = (Path(p) for p in sys.argv[1:3])
failed = 0
for a in sorted(before.glob('*.png')):
    b = after / a.name
    if not b.exists():
        print('LIPSESTE', a.name)
        failed += 1
        continue
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if ia.size != ib.size:
        print('DIMENSIUNE', a.name, ia.size, ib.size)
        failed += 1
        continue
    diff = ImageChops.difference(ia, ib).convert('L').point(lambda v: 255 if v > LIMIT_LEVEL else 0)
    share = sum(1 for v in diff.getdata() if v) / (ia.size[0] * ia.size[1])
    ok = share < LIMIT_SHARE
    failed += 0 if ok else 1
    print('ok' if ok else 'DIFERIT', a.name, f'{share:.4%}')
sys.exit(1 if failed else 0)
```

- [ ] **Step 9: Tema originală arată ca înainte**

Repornește preview-ul (`npx astro preview --port 4322` pe build-ul nou), apoi:

Run: `node scripts/shots.mjs .shots/after /,/mobilier/bucatarii,/proiect/bucatarie-in-l,/servicii,/contact,/etape 1440,390 && python3 scripts/shot-diff.py .shots/before .shots/after`
Expected: toate `ok` în ambele scripturi. Dacă o captură iese `DIFERIT`, deschide perechea cu Read, găsește zona diferită și corectează înlocuirea din Step 5 care o atinge.

- [ ] **Step 10: Commit**

```bash
git add src/content/theme.json src/lib/content.ts src/layouts/Base.astro src/styles src/components src/pages scripts/shot-diff.py
git commit -m "feat(theme): culorile site-ului vin din theme.json; pozele pastreaza paleta inchisa"
```

---

### Task 6: Logo pentru fundal deschis și verificarea temei deschise

**Files:**
- Create: `scripts/logo-variants.py`, `src/assets/brand/lox-logo-dark.png`, `src/assets/brand/lox-logo-full-dark.png`
- Modify: `src/components/ui/Logo.astro`

**Interfaces:**
- Consumes: `data-scheme` pe `<html>` și `.on-photo` (Task 5), `LIGHT_THEME` (Task 4).
- Produces: `Logo.astro` randează ambele variante; CSS-ul alege varianta după temă și după context (poză sau fundal).

- [ ] **Step 1: Generează varianta închisă**

`scripts/logo-variants.py`:

```python
"""Logoul pentru fundal deschis: literele albe devin aproape negre, alama ramane.
Rulat o data: python3 scripts/logo-variants.py"""
from PIL import Image

INK = (21, 20, 18)

for name in ('lox-logo', 'lox-logo-full'):
    im = Image.open(f'src/assets/brand/{name}.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            # alb sau gri deschis, nesaturat: literele si tagline-ul; alama are saturatie mare
            if a and max(r, g, b) - min(r, g, b) < 40 and min(r, g, b) > 120:
                px[x, y] = (*INK, a)
    im.save(f'src/assets/brand/{name}-dark.png', optimize=True)
    print('scris', f'{name}-dark.png', im.size)
```

Run: `python3 scripts/logo-variants.py`
Expected: `scris lox-logo-dark.png (773, 257)` și `scris lox-logo-full-dark.png ...`.

Deschide `src/assets/brand/lox-logo-dark.png` cu Read: literele sunt închise, simbolul auriu a rămas auriu, marginile literelor nu au contur alb.

- [ ] **Step 2: Componenta Logo randează ambele variante**

`src/components/ui/Logo.astro`, înlocuiește tot fișierul cu:

```astro
---
import { Image } from 'astro:assets';
import logo from '../../assets/brand/lox-logo.png';
import logoFull from '../../assets/brand/lox-logo-full.png';
import logoDark from '../../assets/brand/lox-logo-dark.png';
import logoFullDark from '../../assets/brand/lox-logo-full-dark.png';

interface Props {
  /** `full` include si tagline-ul "Idei. Design. Precizie." */
  variant?: 'header' | 'full';
  /** Inaltimea randata, in px. Latimea se calculeaza din raport. */
  height?: number;
  class?: string;
}

const { variant = 'header', height = 38, class: cls = '' } = Astro.props;

// Literele albe merg pe fundal inchis si peste poze; cele inchise pe tema deschisa.
const [onDark, onLight] = variant === 'full' ? [logoFull, logoFullDark] : [logo, logoDark];
const width = Math.round((onDark.width / onDark.height) * height);
---

<span class:list={['logo', cls]} style={`height: ${height}px`}>
  <Image
    src={onDark}
    alt="LOX Mobila"
    width={width}
    height={height}
    densities={[1, 2]}
    loading="eager"
    class="logo__img logo__img--on-dark"
    style={`height: ${height}px`}
  />
  <Image
    src={onLight}
    alt="LOX Mobila"
    width={width}
    height={height}
    densities={[1, 2]}
    loading="eager"
    class="logo__img logo__img--on-light"
    style={`height: ${height}px`}
  />
</span>

<style>
  .logo { display: block; }
  .logo__img { display: block; width: auto; }
  .logo__img--on-light { display: none; }

  :global(html[data-scheme='light']) .logo__img--on-dark { display: none; }
  :global(html[data-scheme='light']) .logo__img--on-light { display: block; }

  /* Peste poze (headerul transparent peste hero) ramane logoul cu litere albe. */
  :global(html[data-scheme='light'] :is(.on-photo, [data-header][data-overlay='true']:not(.is-scrolled))) .logo__img--on-dark {
    display: block;
  }
  :global(html[data-scheme='light'] :is(.on-photo, [data-header][data-overlay='true']:not(.is-scrolled))) .logo__img--on-light {
    display: none;
  }
</style>
```

- [ ] **Step 3: Tema originală arată ca înainte**

Run: `npm test && npx astro check && npm run build`, repornește preview-ul, apoi `node scripts/shots.mjs .shots/after6 /,/contact 1440,390 && python3 scripts/shot-diff.py .shots/before .shots/after6`
Expected: toate `ok` (compară doar capturile care există în ambele foldere; `LIPSESTE` pentru paginile necapturate acum se ignoră, restul trebuie să fie `ok`).

- [ ] **Step 4: Tema deschisă, temporar**

Scrie în `src/content/theme.json` valorile din `LIGHT_THEME`:

```json
{
  "background": "#F5F2ED",
  "text": "#151412",
  "accent": "#86643A"
}
```

Run: `npm run build`, repornește preview-ul, apoi `node scripts/shots.mjs .shots/light`
Expected: toate `ok` la toate cele 5 lățimi.

- [ ] **Step 5: Verifică vizual tema deschisă**

Deschide cu Read capturile din `.shots/light` la 1440 și 390 pentru fiecare pagină și verifică lista:

1. Headerul peste hero: text alb, logo cu litere albe. Pe paginile fără hero și după scroll: fundal deschis translucid (desktop) sau opac (telefon), text închis, logo cu litere închise.
2. Heroul, bannerele de pagină, plăcile de categorii, banda „Mobila se face la comandă” din pagina de proiect și banda de final: text deschis pe poza întunecată, butonul outline alb.
3. Butoanele pline: alamă închisă cu text alb, lizibil.
4. Cardurile (servicii, contact, formularul de consultanță, lista de pași) se desprind de fundal; umbrele sunt discrete, nu pete gri.
5. Câmpurile formularelor au contur vizibil și text închis.
6. Subsolul e cu o treaptă mai închis decât pagina, cu text lizibil.
7. Meniul de pe telefon (deschide-l într-o captură separată cu Playwright dacă e nevoie) are fundal deschis și text închis.
8. Selectorul de categorii și sortarea din catalog sunt lizibile.

Pentru fiecare problemă găsită: corectează folosind variabilele temei (`--color-*`, `--text*`, `--shadow-*`), nu culori noi scrise direct, reconstruiește și refă captura paginii respective.

- [ ] **Step 6: Readu tema originală**

Scrie la loc în `src/content/theme.json`:

```json
{
  "background": "#0C0C0C",
  "text": "#F2EFEA",
  "accent": "#B7966B"
}
```

Run: `npm test && npx astro check && npm run build`
Expected: verde.

- [ ] **Step 7: Commit**

```bash
git add scripts/logo-variants.py src/assets/brand src/components src/styles src/pages src/content/theme.json
git commit -m "feat(theme): logo cu litere inchise pe tema deschisa; tema deschisa verificata pe toate paginile"
```

---

### Task 7: Previzualizarea culorilor din admin

**Files:**
- Create: `src/scripts/theme-preview.ts`
- Modify: `src/layouts/Base.astro` (importul scriptului), `.github/workflows/deploy.yml` (variabila și căile ignorate)

**Interfaces:**
- Consumes: variabilele scrise de `deriveTheme` (Task 4).
- Produces: protocolul `postMessage` folosit de ecranul Aspect (Task 18): adminul trimite `{ type: 'lox-theme', scheme: 'dark' | 'light', vars: Record<string, string> }`; site-ul trimite `{ type: 'lox-theme-ready' }` la încărcare. Scriptul e activ doar în iframe, pe o pagină deschisă cu `?tema` (reținut în `sessionStorage` la navigare), și doar pentru mesaje de la `PUBLIC_ADMIN_ORIGIN`.

- [ ] **Step 1: Scriptul**

`src/scripts/theme-preview.ts`:

```ts
/**
 * Previzualizarea culorilor din admin: pagina deschisa in iframe-ul ecranului „Aspect” primeste
 * variabilele prin postMessage si le aplica pe loc. In afara iframe-ului adminului nu face nimic.
 */
const ADMIN_ORIGIN = import.meta.env.PUBLIC_ADMIN_ORIGIN as string | undefined;
const KEY = 'lox-tema-preview';

function wanted(): boolean {
  if (!ADMIN_ORIGIN || window.self === window.top) return false;
  const asked = new URLSearchParams(location.search).has('tema');
  try {
    if (asked) sessionStorage.setItem(KEY, '1');
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return asked;
  }
}

if (ADMIN_ORIGIN && wanted()) {
  window.addEventListener('message', (e) => {
    if (e.origin !== ADMIN_ORIGIN) return;
    const data = e.data as { type?: string; scheme?: string; vars?: Record<string, string> };
    if (data?.type !== 'lox-theme' || !data.vars) return;
    const root = document.documentElement;
    for (const [name, value] of Object.entries(data.vars)) {
      if (name.startsWith('--')) root.style.setProperty(name, value);
    }
    if (data.scheme === 'dark' || data.scheme === 'light') {
      root.dataset.scheme = data.scheme;
      root.style.colorScheme = data.scheme;
    }
  });
  window.parent.postMessage({ type: 'lox-theme-ready' }, ADMIN_ORIGIN);
}

export {};
```

În `src/layouts/Base.astro`, în blocul `<script>` de la final, adaugă `import '../scripts/theme-preview.ts';` după `import '../scripts/motion.ts';`.

- [ ] **Step 2: Workflow-ul de deploy**

În `.github/workflows/deploy.yml`:

- sub `on: push:` adaugă, după `branches: [main]`:

```yaml
    # Codul adminului si documentatia nu schimba site-ul.
    paths-ignore: ['admin/**', 'docs/**']
```

- la pasul `Build`, în `env`, adaugă:

```yaml
          PUBLIC_ADMIN_ORIGIN: https://lox-admin.rtrsolutions.ro
```

- [ ] **Step 3: Verificare cu o pagină-ramă locală**

```bash
PUBLIC_ADMIN_ORIGIN=http://localhost:4400 npm run build
```

În terminalul separat: `npx astro preview --port 4322`. Creează în scratchpad (nu în repo) `harness/index.html`:

```html
<!doctype html>
<meta charset="utf-8" />
<iframe id="f" src="http://localhost:4322/?tema" style="width:1280px;height:800px;border:0"></iframe>
<script>
  const vars = {
    '--color-ink': '#F5F2ED', '--color-ink-2': '#EEEBE6', '--color-ink-3': '#E3E0DA', '--color-line': '#D7D4CF',
    '--color-deep': '#EBE8E3', '--color-bone': '#151412', '--color-bone-2': '#5F5E5A', '--color-brass': '#86643A',
    '--color-brass-hi': '#6B4F2E', '--color-on-accent': '#FFFFFF', '--photo-brass-hi': '#A07A4B',
    '--shadow-rgb': '38 30 20', '--shadow-k': '0.3',
  };
  addEventListener('message', (e) => {
    if (e.data?.type === 'lox-theme-ready') document.getElementById('f').contentWindow.postMessage({ type: 'lox-theme', scheme: 'light', vars }, 'http://localhost:4322');
  });
</script>
```

Servește-l cu `python3 -m http.server 4400` din folderul `harness`, apoi cu Playwright deschide `http://localhost:4400/`, așteaptă 1,5 s și fă o captură.

Expected: pagina din iframe are fundal deschis și text închis. Deschide `http://localhost:4322/` direct (fără iframe): rămâne închisă.

- [ ] **Step 4: Build normal și commit**

Run: `npm test && npx astro check && npm run build`
Expected: verde.

```bash
git add src/scripts/theme-preview.ts src/layouts/Base.astro .github/workflows/deploy.yml
git commit -m "feat(theme): site-ul primeste culorile de previzualizare din admin"
```

---

## Partea B: adminul

Toate comenzile din partea B se rulează din `admin/`, dacă nu scrie altfel. Adminul importă din site doar `src/content/schema.ts` și `src/lib/theme.ts`, prin aliasul `@site`. Nu importă `zod` direct: toate schemele, inclusiv cele pentru formulare, stau în `schema.ts`, ca să existe o singură copie de zod.

### Task 8: Scheletul adminului

**Files:**
- Create: `admin/package.json`, `admin/astro.config.mjs`, `admin/tsconfig.json`, `admin/vitest.config.ts`, `admin/.env.example`, `admin/public/robots.txt`
- Create: `admin/src/env.d.ts`, `admin/src/lib/env.ts`, `admin/tests/env.test.ts`
- Create: `admin/src/styles/admin.css`, `admin/src/layouts/Admin.astro`, `admin/src/scripts/shell.ts`, `admin/src/assets/lox-logo-dark.png` (copie)
- Create: `admin/src/pages/index.ts`, `admin/src/pages/health.ts`, `admin/src/pages/404.astro`, `admin/src/pages/500.astro`, `admin/src/pages/proiecte/index.astro` (temporar, înlocuit în Task 15)
- Modify (rădăcină): `tsconfig.json` (exclude `admin`), `.gitignore`
- Create (rădăcină): `vitest.config.ts`

**Interfaces:**
- Produces: `readEnv(source): AdminEnv`, `env(): AdminEnv`, `AdminUser { email; name; hash }`, `AdminEnv { githubToken; repo: { owner; name }; branch; localRepoDir?; sessionSecret; users; siteUrl; adminOrigin }`; layout-ul `Admin.astro` cu props `title`, `section?`, `wide?`; `body[data-site-url]`; elementul `[data-status]` pentru bara de publicare; clasele CSS descrise în `admin.css` (`btn`, `btn--ghost`, `btn--danger`, `btn--danger-solid`, `btn--small`, `panel`, `panel__title`, `page-head`, `fields`, `fields--2`, `field`, `field__label`, `field__hint`, `field__error`, `has-error`, `check`, `repeater`, `row`, `row__fields`, `row__tools`, `savebar`, `savebar__msg`, `status`, `list`, `item`, `photos__grid`, `photo`, `tiles`, `tile`, `confirm`, `aspect`, `swatch`, `warning`, `preview`, `login`, `sr-only`, `linklike`).

- [ ] **Step 1: Izolează adminul de verificările site-ului**

`vitest.config.ts` (rădăcină):

```ts
import { defineConfig } from 'vitest/config';

// Testele site-ului; adminul are propriile teste, in admin/.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

În `tsconfig.json` (rădăcină), `"exclude": ["dist"]` devine `"exclude": ["dist", "admin"]`.

La `.gitignore` (rădăcină) adaugă:

```
# variabilele locale ale adminului (parole, token)
.env
.env.*
!.env.example
```

Run (din rădăcină): `npm test && npx astro check`
Expected: verde, aceleași teste ca înainte.

- [ ] **Step 2: Pachetul adminului**

`admin/package.json`:

```json
{
  "name": "lox-admin",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "start": "node dist/server/entry.mjs",
    "check": "astro check",
    "test": "vitest run",
    "user": "node scripts/user.mjs"
  }
}
```

```bash
cd admin
npm install astro@^7.3.3 @astrojs/node@^11.1.6 @fontsource-variable/inter@^5.3.0 sharp@^0.35.4 sortablejs@^1.15.7 zod@^4.6.5
npm install -D @astrojs/check@^0.9.10 @types/node@^26.6.2 @types/sortablejs@^1.15.9 typescript@^6.0.3 vitest@^5.0.1
```

`zod` stă în dependențele adminului doar pentru imaginea Docker, unde `schema.ts` îl găsește prin `node_modules`-ul adminului (Task 20).

- [ ] **Step 3: Configurarea Astro, TypeScript și Vitest**

`admin/astro.config.mjs`:

```js
// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Adminul foloseste schema si calculul temei din site: `@site` = ../src.
const siteSrc = fileURLToPath(new URL('../src', import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone', bodySizeLimit: 200 * 1024 * 1024 }),
  // Originea cererilor o verifica middleware-ul fata de ADMIN_ORIGIN, ca sa mearga si in spatele proxy-ului din Coolify.
  security: { checkOrigin: false },
  server: { port: 4400 },
  vite: {
    resolve: { alias: { '@site': siteSrc } },
    // scripturile din browser importa src/lib/theme.ts, din afara folderului adminului
    server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  },
});
```

`admin/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@site/*": ["../src/*"] },
    "types": ["node"]
  }
}
```

`admin/vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@site': fileURLToPath(new URL('../src', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'] },
});
```

`admin/src/env.d.ts`:

```ts
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: { email: string; name: string };
  }
}
```

`admin/public/robots.txt`:

```
User-agent: *
Disallow: /
```

- [ ] **Step 4: Scrie testul care pică pentru configurare**

`admin/tests/env.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readEnv } from '../src/lib/env';

const base = {
  GITHUB_TOKEN: 'token',
  GITHUB_REPO: 'RTR-TECH-SOLUTIONS/lox-mobila',
  SESSION_SECRET: 'x'.repeat(32),
  ADMIN_USERS: '[{"email":"atelier@loxmobila.ro","name":"Atelier","hash":"scrypt$a$b"}]',
  PUBLIC_SITE_URL: 'https://rtr-tech-solutions.github.io/lox-mobila/',
  ADMIN_ORIGIN: 'https://lox-admin.rtrsolutions.ro/',
};

describe('readEnv', () => {
  it('reads the production configuration', () => {
    const e = readEnv(base);
    expect(e.repo).toEqual({ owner: 'RTR-TECH-SOLUTIONS', name: 'lox-mobila' });
    expect(e.branch).toBe('main');
    expect(e.siteUrl).toBe('https://rtr-tech-solutions.github.io/lox-mobila');
    expect(e.adminOrigin).toBe('https://lox-admin.rtrsolutions.ro');
    expect(e.users[0].name).toBe('Atelier');
  });

  it('names the missing variable', () => {
    expect(() => readEnv({ ...base, GITHUB_TOKEN: '' })).toThrow('GITHUB_TOKEN');
  });

  it('does not need a GitHub token in local mode', () => {
    const e = readEnv({ ...base, GITHUB_TOKEN: undefined, LOCAL_REPO_DIR: '/tmp/lox-local' });
    expect(e.localRepoDir).toBe('/tmp/lox-local');
  });

  it('rejects a short session secret and broken user JSON', () => {
    expect(() => readEnv({ ...base, SESSION_SECRET: 'scurt' })).toThrow('SESSION_SECRET');
    expect(() => readEnv({ ...base, ADMIN_USERS: '[' })).toThrow('ADMIN_USERS');
  });
});
```

Run: `npx vitest run tests/env.test.ts`
Expected: FAIL, `Failed to resolve import "../src/lib/env"`.

- [ ] **Step 5: Scrie configurarea**

`admin/src/lib/env.ts`:

```ts
import { existsSync } from 'node:fs';

export interface AdminUser {
  email: string;
  name: string;
  /** scrypt$<sare>$<hash>, generat cu `npm run user`. */
  hash: string;
}

export interface AdminEnv {
  githubToken: string;
  repo: { owner: string; name: string };
  branch: string;
  /** Mod de test: adminul scrie intr-un clone local, fara GitHub. */
  localRepoDir?: string;
  sessionSecret: string;
  users: AdminUser[];
  siteUrl: string;
  adminOrigin: string;
}

export function readEnv(source: Record<string, string | undefined>): AdminEnv {
  const need = (key: string): string => {
    const value = source[key]?.trim();
    if (!value) throw new Error(`Lipseste variabila de mediu ${key}`);
    return value;
  };

  const localRepoDir = source.LOCAL_REPO_DIR?.trim() || undefined;
  const [owner, name] = need('GITHUB_REPO').split('/');
  if (!owner || !name) throw new Error('GITHUB_REPO trebuie sa fie de forma owner/repo');

  const sessionSecret = need('SESSION_SECRET');
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET trebuie sa aiba cel putin 32 de caractere');

  let users: unknown;
  try {
    users = JSON.parse(need('ADMIN_USERS'));
  } catch {
    throw new Error('ADMIN_USERS nu e JSON valid');
  }
  if (!Array.isArray(users)) throw new Error('ADMIN_USERS trebuie sa fie o lista');

  return {
    githubToken: localRepoDir ? (source.GITHUB_TOKEN ?? '') : need('GITHUB_TOKEN'),
    repo: { owner, name },
    branch: source.GITHUB_BRANCH?.trim() || 'main',
    localRepoDir,
    sessionSecret,
    users: users as AdminUser[],
    siteUrl: need('PUBLIC_SITE_URL').replace(/\/$/, ''),
    adminOrigin: need('ADMIN_ORIGIN').replace(/\/$/, ''),
  };
}

let cached: AdminEnv | undefined;

/** Configurarea curenta. Local se citeste din admin/.env (sau din fisierul numit in ADMIN_ENV_FILE). */
export function env(): AdminEnv {
  if (!cached) {
    const file = process.env.ADMIN_ENV_FILE ?? '.env';
    if (existsSync(file)) process.loadEnvFile(file);
    cached = readEnv(process.env);
  }
  return cached;
}
```

Run: `npx vitest run tests/env.test.ts`
Expected: PASS, 4 teste.

- [ ] **Step 6: Variabilele locale**

`admin/.env.example`:

```
# Productie: toate se pun in Coolify. Local: copiaza in admin/.env.
GITHUB_TOKEN=
GITHUB_REPO=RTR-TECH-SOLUTIONS/lox-mobila
GITHUB_BRANCH=main
# Mod de test: calea unui clone local in care adminul face commit-uri, fara GitHub. Gol in productie.
LOCAL_REPO_DIR=
# Minimum 32 de caractere: openssl rand -hex 32
SESSION_SECRET=
# Lista de conturi; fiecare linie o genereaza `npm run user -- <email> "<Nume>" "<parola>"`
ADMIN_USERS=[]
PUBLIC_SITE_URL=https://rtr-tech-solutions.github.io/lox-mobila
ADMIN_ORIGIN=https://lox-admin.rtrsolutions.ro
```

Creează `admin/.env` (ignorat de git) pentru lucrul local:

```bash
cat > .env <<EOF
GITHUB_REPO=RTR-TECH-SOLUTIONS/lox-mobila
GITHUB_BRANCH=main
LOCAL_REPO_DIR=/tmp/lox-local
SESSION_SECRET=$(openssl rand -hex 32)
ADMIN_USERS=[]
PUBLIC_SITE_URL=http://localhost:4322
ADMIN_ORIGIN=http://localhost:4400
EOF
```

- [ ] **Step 7: Stilurile adminului**

`admin/src/styles/admin.css`:

```css
@import '@fontsource-variable/inter';

/* Adminul arata ca o unealta de lucru: neutru, dens, un singur accent (butoanele negre).
   Alama LOX apare doar in logo si la elementul activ din meniu. */
:root {
  --bg: #F6F5F2;
  --panel: #FFFFFF;
  --text: #1A1917;
  --text-2: #6B6863;
  --line: #E4E1DB;
  --line-2: #CFCAC1;
  --ink: #1A1917;
  --ink-hover: #3A3833;
  --brass: #B7966B;
  --ok: #1F6B45;
  --ok-bg: #E8F3EC;
  --warn: #7A5200;
  --warn-bg: #FBF1D9;
  --err: #A8261B;
  --err-bg: #FBEAE8;
  --radius: 8px;
  --side-w: 232px;
  --font: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color-scheme: light;
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 var(--font); -webkit-font-smoothing: antialiased; }
h1, h2, h3 { margin: 0; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; }
h1 { font-size: 1.375rem; }
h2 { font-size: 1.0625rem; }
p, figure, ul { margin: 0; }
ul { padding: 0; list-style: none; }
a { color: inherit; }
img { display: block; max-width: 100%; }
button, input, select, textarea { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.linklike { padding: 0; border: 0; background: none; color: var(--text-2); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; text-align: left; }
.linklike:hover { color: var(--text); }

/* ---------- Cadrul: meniu fix in stanga, sertar pe telefon ---------- */
.side { position: fixed; inset: 0 auto 0 0; z-index: 30; width: var(--side-w); display: flex; flex-direction: column; gap: 24px; padding: 20px 14px; background: var(--panel); border-right: 1px solid var(--line); overflow-y: auto; }
.side__brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; color: var(--text-2); font-size: 0.8125rem; text-decoration: none; }
.side__nav { display: grid; gap: 2px; }
.side__link { display: block; padding: 8px 10px; border-radius: 6px; color: var(--text-2); text-decoration: none; }
.side__link:hover { background: var(--bg); color: var(--text); }
.side__link[aria-current='page'] { background: var(--bg); color: var(--text); font-weight: 500; box-shadow: inset 2px 0 0 var(--brass); }
.side__foot { margin-top: auto; display: grid; gap: 8px; padding: 0 10px; color: var(--text-2); font-size: 0.8125rem; }
.side__foot a { color: var(--text-2); text-underline-offset: 3px; }
.main { margin-left: var(--side-w); min-width: 0; }
.topbar { display: none; }
.content { max-width: 960px; padding: 32px 40px 120px; }
.content--wide { max-width: 1400px; }

@media (max-width: 899px) {
  .side { transform: translateX(-100%); visibility: hidden; transition: transform 200ms ease-out, visibility 0s 200ms; }
  .side.is-open { transform: none; visibility: visible; box-shadow: 0 0 0 100vmax rgb(26 25 23 / 0.35); transition: transform 200ms ease-out; }
  .main { margin-left: 0; }
  .topbar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 16px; background: var(--panel); border-bottom: 1px solid var(--line); }
  .content { padding: 20px 16px 120px; }
}

/* ---------- Antet de pagina, panouri ---------- */
.page-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 24px; margin-bottom: 24px; }
.page-head p { margin-top: 4px; color: var(--text-2); max-width: 60ch; }
.panel { padding: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.panel + .panel { margin-top: 16px; }
.panel__title { margin-bottom: 16px; }
.panel__lead { margin: -8px 0 16px; color: var(--text-2); font-size: 0.875rem; }

/* ---------- Butoane ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 0 16px; border: 1px solid var(--ink); border-radius: var(--radius); background: var(--ink); color: #FFFFFF; font-weight: 500; text-decoration: none; white-space: nowrap; cursor: pointer; transition: background-color 150ms ease-out, border-color 150ms ease-out; }
.btn:hover { background: var(--ink-hover); border-color: var(--ink-hover); }
.btn:disabled { opacity: 0.5; cursor: default; }
.btn:has(input:focus-visible) { outline: 2px solid var(--brass); outline-offset: 2px; }
.btn--ghost { background: var(--panel); color: var(--text); border-color: var(--line-2); }
.btn--ghost:hover { background: var(--bg); border-color: var(--line-2); }
.btn--ghost[aria-pressed='true'] { background: var(--ink); color: #FFFFFF; border-color: var(--ink); }
.btn--danger { background: var(--panel); color: var(--err); border-color: #E7B7B1; }
.btn--danger:hover { background: var(--err-bg); border-color: var(--err); }
.btn--danger-solid { background: var(--err); border-color: var(--err); color: #FFFFFF; }
.btn--danger-solid:hover { background: #8C1F16; border-color: #8C1F16; }
.btn--small { min-height: 32px; padding: 0 10px; font-size: 0.8125rem; }

/* ---------- Campuri ---------- */
.fields { display: grid; gap: 16px; }
.fields--2 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.field { display: grid; align-content: start; gap: 6px; min-width: 0; }
.field__label { font-size: 0.875rem; font-weight: 500; }
.field__hint { color: var(--text-2); font-size: 0.8125rem; }
.field__error { color: var(--err); font-size: 0.8125rem; }
.field input:not([type='checkbox']):not([type='color']):not([type='file']),
.field select,
.field textarea { width: 100%; min-height: 40px; padding: 8px 12px; border: 1px solid var(--line-2); border-radius: var(--radius); background: var(--panel); }
.field textarea { min-height: 96px; line-height: 1.5; resize: vertical; }
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: var(--ink); box-shadow: 0 0 0 3px rgb(26 25 23 / 0.08); }
.field.has-error input, .field.has-error select, .field.has-error textarea { border-color: var(--err); }
.check { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.check input { width: 18px; height: 18px; margin: 0; accent-color: var(--ink); }

/* ---------- Randuri repetabile: program, specificatii, recenzii ---------- */
.repeater__rows { display: grid; gap: 12px; }
.repeater > [data-add] { margin-top: 12px; }
.repeater > .field__error { margin-top: 8px; }
.row { display: grid; gap: 12px; padding: 14px; background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius); }
.row__fields { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.row__fields > .field--wide { grid-column: 1 / -1; }
.row__tools { display: flex; justify-content: flex-end; gap: 6px; }

/* ---------- Bara de salvare, fixata jos ---------- */
.savebar { position: fixed; right: 0; bottom: 0; left: var(--side-w); z-index: 15; display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 40px; background: var(--panel); border-top: 1px solid var(--line); }
.savebar__msg { margin-right: auto; color: var(--text-2); font-size: 0.875rem; }
.savebar__msg:empty { display: none; }
.savebar__msg.is-error { color: var(--err); }
@media (max-width: 899px) {
  .savebar { left: 0; flex-wrap: wrap; padding: 10px 16px; }
  .savebar__msg { flex-basis: 100%; }
}

/* ---------- Bara de publicare ---------- */
.status { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 40px; font-size: 0.875rem; border-bottom: 1px solid var(--line); }
.status[data-state='pending'], .status[data-state='slow'] { background: var(--warn-bg); color: var(--warn); }
.status[data-state='success'] { background: var(--ok-bg); color: var(--ok); }
.status[data-state='failure'] { background: var(--err-bg); color: var(--err); }
.status a { color: inherit; font-weight: 500; }
.status__dot { width: 8px; height: 8px; flex: none; border-radius: 50%; background: currentColor; }
.status[data-state='pending'] .status__dot { animation: pulse 1.2s ease-in-out infinite; }
.status__close { margin-left: auto; color: inherit; }
@keyframes pulse { 50% { opacity: 0.3; } }
@media (max-width: 899px) { .status { padding: 10px 16px; } }

/* ---------- Lista de proiecte ---------- */
.list { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.item { display: grid; grid-template-columns: auto 64px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 10px 14px; border-top: 1px solid var(--line); background: var(--panel); }
.item:first-child { border-top: 0; border-radius: var(--radius) var(--radius) 0 0; }
.item:last-child { border-radius: 0 0 var(--radius) var(--radius); }
.item__drag { display: grid; place-items: center; width: 28px; height: 40px; padding: 0; border: 0; background: none; color: var(--text-2); cursor: grab; touch-action: none; }
.item__thumb { width: 64px; height: 48px; object-fit: cover; border-radius: 4px; background: var(--bg); }
.item__title { font-weight: 500; text-decoration: none; }
.item__title:hover { text-decoration: underline; text-underline-offset: 3px; }
.item__meta { color: var(--text-2); font-size: 0.8125rem; }
.item__side { display: flex; align-items: center; gap: 12px; }
.item__move { display: flex; gap: 6px; }
.sortable-ghost { opacity: 0.4; }
@media (max-width: 599px) {
  .item { grid-template-columns: auto 56px minmax(0, 1fr); }
  .item__side { grid-column: 2 / -1; justify-content: space-between; }
}

/* ---------- Pozele unui proiect ---------- */
.photos__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.photos__grid:empty { display: none; }
.photos__add { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 16px; }
.photo { position: relative; overflow: hidden; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.photo img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; cursor: grab; }
.photo__cover, .photo__new { position: absolute; top: 8px; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
.photo__cover { display: none; left: 8px; background: var(--ink); color: #FFFFFF; }
.photo:first-child .photo__cover { display: block; }
.photo__new { right: 8px; background: var(--panel); color: var(--text); }
.photo__tools { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px; }
.photo__tools .btn { flex: 1 1 auto; }

/* ---------- Poze pagini ---------- */
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.tile { overflow: hidden; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.tile img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: var(--bg); }
.tile__body { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; }
.tile__name { font-weight: 500; }
.tile.is-changed { border-color: var(--ink); box-shadow: 0 0 0 1px var(--ink); }

/* ---------- Fereastra de confirmare ---------- */
dialog.confirm { width: calc(100% - 32px); max-width: 420px; padding: 24px; border: 0; border-radius: var(--radius); box-shadow: 0 10px 40px rgb(26 25 23 / 0.2); }
dialog.confirm::backdrop { background: rgb(26 25 23 / 0.4); }
dialog.confirm p { margin-top: 8px; color: var(--text-2); }
.confirm__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

/* ---------- Aspect: culori si previzualizare ---------- */
.aspect { display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); align-items: start; gap: 24px; }
.swatch { display: grid; grid-template-columns: 48px minmax(0, 1fr); align-items: center; gap: 12px; }
.swatch input[type='color'] { width: 48px; height: 40px; padding: 2px; background: var(--panel); border: 1px solid var(--line-2); border-radius: var(--radius); cursor: pointer; }
.warnings { display: grid; gap: 8px; margin-top: 16px; }
.warnings:empty { display: none; }
.warning { padding: 10px 12px; background: var(--warn-bg); color: var(--warn); border-radius: var(--radius); font-size: 0.875rem; }
.presets { margin-top: 20px; }
.presets__row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.preview { position: sticky; top: 24px; }
.preview__bar { display: flex; gap: 6px; margin-bottom: 10px; }
.preview__frame { display: block; width: 100%; height: calc(100vh - 150px); min-height: 520px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.preview.is-phone .preview__frame { width: 390px; max-width: 100%; margin-inline: auto; }
@media (max-width: 1099px) {
  .aspect { grid-template-columns: minmax(0, 1fr); }
  .preview { position: static; }
  .preview__frame { height: 70vh; min-height: 420px; }
}

/* ---------- Login si pagini de eroare ---------- */
.login { display: grid; place-items: center; min-height: 100vh; padding: 24px 16px; }
.login__card { width: 100%; max-width: 380px; padding: 28px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.login__card > img { margin-bottom: 24px; }
.login__card h1 { margin-bottom: 20px; }
.login__card .btn { width: 100%; margin-top: 8px; }
.login__error { margin-bottom: 16px; padding: 10px 12px; background: var(--err-bg); color: var(--err); border-radius: var(--radius); font-size: 0.875rem; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 8: Layout-ul și meniul**

Copiază logoul cu litere închise: `cp ../src/assets/brand/lox-logo-dark.png src/assets/lox-logo-dark.png`.

`admin/src/layouts/Admin.astro`:

```astro
---
import '../styles/admin.css';
import logo from '../assets/lox-logo-dark.png';
import { env } from '../lib/env';

interface Props {
  title: string;
  /** Cheia ecranului, pentru elementul activ din meniu. */
  section?: string;
  /** Latime mare, pentru ecranul Aspect (formular si previzualizare alaturate). */
  wide?: boolean;
}

const { title, section, wide = false } = Astro.props;
const { siteUrl } = env();
const user = Astro.locals.user;
const logoWidth = (h: number) => Math.round((logo.width / logo.height) * h);

const nav = [
  { key: 'proiecte', href: '/proiecte', label: 'Proiecte' },
  { key: 'poze', href: '/poze', label: 'Poze pagini' },
  { key: 'recenzii', href: '/recenzii', label: 'Recenzii' },
  { key: 'categorii', href: '/categorii', label: 'Texte categorii' },
  { key: 'contact', href: '/contact', label: 'Contact și program' },
  { key: 'cifre', href: '/cifre', label: 'Cifre' },
  { key: 'aspect', href: '/aspect', label: 'Aspect' },
];
---

<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>{`${title} | Admin LOX`}</title>
  </head>
  <body data-site-url={siteUrl}>
    <aside class="side" id="meniu" data-side>
      <a href="/proiecte" class="side__brand">
        <img src={logo.src} width={logoWidth(26)} height="26" alt="LOX Mobila" />
        <span>Admin</span>
      </a>
      <nav class="side__nav" aria-label="Secțiuni">
        {
          nav.map((n) => (
            <a href={n.href} class="side__link" aria-current={section === n.key ? 'page' : undefined}>
              {n.label}
            </a>
          ))
        }
      </nav>
      <div class="side__foot">
        <a href={siteUrl} target="_blank" rel="noopener">Deschide site-ul</a>
        {user && <span>{user.name}</span>}
        <form method="post" action="/logout">
          <button type="submit" class="linklike">Ieși din cont</button>
        </form>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <img src={logo.src} width={logoWidth(22)} height="22" alt="LOX Mobila" />
        <button type="button" class="btn btn--ghost btn--small" aria-controls="meniu" aria-expanded="false" data-menu>
          Meniu
        </button>
      </header>
      <div class="status" data-status role="status" hidden></div>
      <main class:list={['content', wide && 'content--wide']}>
        <slot />
      </main>
    </div>

    <script>
      import '../scripts/shell.ts';
    </script>
  </body>
</html>
```

`admin/src/scripts/shell.ts`:

```ts
// Meniul de pe telefon: sertar din stanga, se inchide cu Escape sau cu un click in afara lui.
const side = document.querySelector<HTMLElement>('[data-side]');
const toggle = document.querySelector<HTMLButtonElement>('[data-menu]');

if (side && toggle) {
  const set = (open: boolean) => {
    side.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => set(!side.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
  });
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (side.classList.contains('is-open') && !side.contains(target) && !toggle.contains(target)) set(false);
  });
}

export {};
```

- [ ] **Step 9: Rutele de bază**

`admin/src/pages/index.ts`:

```ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/proiecte');
```

`admin/src/pages/health.ts`:

```ts
import type { APIRoute } from 'astro';

// Verificarea de sanatate din Coolify si din Docker.
export const GET: APIRoute = () => new Response('ok', { headers: { 'content-type': 'text/plain' } });
```

`admin/src/pages/404.astro`:

```astro
---
import '../styles/admin.css';
---

<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Pagina nu există | Admin LOX</title>
  </head>
  <body>
    <main class="login">
      <div class="login__card">
        <h1>Pagina nu există</h1>
        <p class="field__hint">Linkul e greșit sau pagina a fost mutată.</p>
        <a href="/proiecte" class="btn">Înapoi la proiecte</a>
      </div>
    </main>
  </body>
</html>
```

`admin/src/pages/500.astro`:

```astro
---
import '../styles/admin.css';

interface Props {
  error: unknown;
}

console.error(Astro.props.error);
---

<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Eroare | Admin LOX</title>
  </head>
  <body>
    <main class="login">
      <div class="login__card">
        <h1>Nu am putut încărca pagina</h1>
        <p class="field__hint">Datele nu au putut fi citite. Reîncarcă pagina peste un minut; dacă nu merge, scrie-ne.</p>
        <a href="" class="btn">Reîncarcă</a>
      </div>
    </main>
  </body>
</html>
```

`admin/src/pages/proiecte/index.astro` (temporar, până la Task 15):

```astro
---
import Admin from '../../layouts/Admin.astro';
---

<Admin title="Proiecte" section="proiecte">
  <div class="page-head">
    <div>
      <h1>Proiecte</h1>
      <p>Lista proiectelor apare aici după Task 15.</p>
    </div>
  </div>
</Admin>
```

- [ ] **Step 10: Verifică scheletul**

Run: `npm test && npx astro check && npm run build`
Expected: 4 teste trec, `0 errors`, build-ul se termină cu `dist/server/entry.mjs`.

Run: `npm run dev` (terminal separat), apoi `curl -s localhost:4400/health` și `curl -sI localhost:4400/ | head -3`
Expected: `ok`; `/` răspunde `302` spre `/proiecte`.

Cu Playwright, deschide `http://localhost:4400/proiecte` la 1280 și 390 și fă capturi în `.shots/admin/task8-*.png` (rădăcina repo-ului). Expected la 1280: meniu alb în stânga cu logoul și cele 7 secțiuni, „Proiecte” marcat cu linia de alamă. La 390: bara de sus cu logo și butonul „Meniu”; la apăsare, meniul intră din stânga și fundalul se întunecă.

- [ ] **Step 11: Commit**

```bash
cd ..
git add vitest.config.ts tsconfig.json .gitignore admin
git commit -m "feat(admin): scheletul adminului, configurarea si cadrul de pagina"
```

---

### Task 9: Parole, sesiuni și limitarea login-ului

**Files:**
- Create: `admin/src/lib/password.mjs`, `admin/src/lib/auth.ts`, `admin/scripts/user.mjs`, `admin/tests/auth.test.ts`

**Interfaces:**
- Consumes: `AdminUser` (Task 8).
- Produces: `hashPassword(password, salt?): string`, `verifyPassword(password, stored): boolean`, `SESSION_COOKIE = 'lox_admin'`, `SESSION_DAYS = 30`, `signSession(email, secret, now?): string`, `readSession(token, secret, users, now?): AdminUser | null`, `findUser(users, email, password): AdminUser | null`, `class LoginLimiter { blocked(key, now?); fail(key, now?); succeed(key) }`, `limiter` (instanța comună).

- [ ] **Step 1: Scrie testul care pică**

`admin/tests/auth.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { LoginLimiter, findUser, hashPassword, readSession, signSession, verifyPassword } from '../src/lib/auth';

const SECRET = 's'.repeat(40);
const users = [{ email: 'atelier@loxmobila.ro', name: 'Atelier', hash: hashPassword('parola-lunga-1') }];

describe('passwords', () => {
  it('verifies the right password and rejects a wrong one', () => {
    const stored = hashPassword('parola-lunga-1');
    expect(stored).toMatch(/^scrypt\$[\w-]+\$[\w-]+$/);
    expect(verifyPassword('parola-lunga-1', stored)).toBe(true);
    expect(verifyPassword('parola-lunga-2', stored)).toBe(false);
    expect(verifyPassword('orice', 'stricat')).toBe(false);
  });

  it('accepts hashes made by `npm run user`', () => {
    const line = execFileSync('node', ['scripts/user.mjs', 'a@b.ro', 'Ana', 'parola-de-test'], { encoding: 'utf8' });
    const { hash } = JSON.parse(line) as { hash: string };
    expect(verifyPassword('parola-de-test', hash)).toBe(true);
  });

  it('finds users by email regardless of case', () => {
    expect(findUser(users, ' Atelier@LoxMobila.ro ', 'parola-lunga-1')?.name).toBe('Atelier');
    expect(findUser(users, 'atelier@loxmobila.ro', 'gresit')).toBeNull();
    expect(findUser(users, 'nimeni@loxmobila.ro', 'parola-lunga-1')).toBeNull();
  });
});

describe('sessions', () => {
  const now = 1_700_000_000_000;

  it('reads back a signed session', () => {
    expect(readSession(signSession('atelier@loxmobila.ro', SECRET, now), SECRET, users, now)?.email).toBe('atelier@loxmobila.ro');
  });

  it('rejects a tampered, expired, foreign or missing token', () => {
    const token = signSession('atelier@loxmobila.ro', SECRET, now);
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ e: 'atelier@loxmobila.ro', x: now * 2 })).toString('base64url');
    expect(readSession(`${forged}.${sig}`, SECRET, users, now)).toBeNull();
    expect(readSession(`${payload}.${sig}`, SECRET, users, now + 31 * 864e5)).toBeNull();
    expect(readSession(token, 'alt-secret'.repeat(4), users, now)).toBeNull();
    expect(readSession(token, SECRET, [], now)).toBeNull();
    expect(readSession(undefined, SECRET, users, now)).toBeNull();
  });
});

describe('LoginLimiter', () => {
  it('blocks after 5 failures for 15 minutes, then lets the user try again', () => {
    const l = new LoginLimiter();
    const t = 1_000_000;
    for (let i = 0; i < 4; i++) l.fail('k', t);
    expect(l.blocked('k', t)).toBe(false);
    l.fail('k', t);
    expect(l.blocked('k', t + 60_000)).toBe(true);
    expect(l.blocked('k', t + 15 * 60_000 + 1)).toBe(false);
  });

  it('forgets failures after a successful login', () => {
    const l = new LoginLimiter();
    for (let i = 0; i < 5; i++) l.fail('k', 0);
    l.succeed('k');
    expect(l.blocked('k', 1)).toBe(false);
  });
});
```

Run: `npx vitest run tests/auth.test.ts`
Expected: FAIL, `Failed to resolve import "../src/lib/auth"`.

- [ ] **Step 2: Scrie autentificarea**

`admin/src/lib/password.mjs` (JavaScript simplu, ca să-l folosească și scriptul `npm run user` fără compilare):

```js
import { randomBytes, scryptSync } from 'node:crypto';

/**
 * Hash de parola in formatul „scrypt$<sare>$<hash>”, in base64url.
 * @param {string} password
 * @param {Buffer} [salt]
 * @returns {string}
 */
export function hashPassword(password, salt = randomBytes(16)) {
  return `scrypt$${salt.toString('base64url')}$${scryptSync(password, salt, 64).toString('base64url')}`;
}
```

`admin/src/lib/auth.ts`:

```ts
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AdminUser } from './env';
import { hashPassword } from './password.mjs';

export { hashPassword };

export function verifyPassword(password: string, stored: string): boolean {
  const [kind, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = scryptSync(password, Buffer.from(salt, 'base64url'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Verificam o parola si cand emailul nu exista, ca timpul de raspuns sa nu arate ce conturi exista.
const DUMMY_HASH = hashPassword('cont-inexistent', Buffer.alloc(16));

export function findUser(users: AdminUser[], email: string, password: string): AdminUser | null {
  const wanted = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === wanted);
  const ok = verifyPassword(password, user?.hash ?? DUMMY_HASH);
  return user && ok ? user : null;
}

export const SESSION_COOKIE = 'lox_admin';
export const SESSION_DAYS = 30;

const mac = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function signSession(email: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ e: email, x: now + SESSION_DAYS * 864e5 })).toString('base64url');
  return `${payload}.${mac(payload, secret)}`;
}

export function readSession(
  token: string | undefined,
  secret: string,
  users: AdminUser[],
  now = Date.now(),
): AdminUser | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const good = Buffer.from(mac(payload, secret));
  const given = Buffer.from(sig);
  if (good.length !== given.length || !timingSafeEqual(good, given)) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { e?: unknown; x?: unknown };
    if (typeof e !== 'string' || typeof x !== 'number' || x < now) return null;
    return users.find((u) => u.email === e) ?? null;
  } catch {
    return null;
  }
}

/** 5 incercari gresite pe aceeasi cheie (email si IP) blocheaza login-ul 15 minute. */
export class LoginLimiter {
  private fails = new Map<string, { n: number; until: number }>();

  constructor(
    private max = 5,
    private windowMs = 15 * 60_000,
  ) {}

  blocked(key: string, now = Date.now()): boolean {
    const f = this.fails.get(key);
    return !!f && f.n >= this.max && f.until > now;
  }

  fail(key: string, now = Date.now()): void {
    const f = this.fails.get(key);
    if (!f || f.until <= now) this.fails.set(key, { n: 1, until: now + this.windowMs });
    else this.fails.set(key, { n: f.n + 1, until: now + this.windowMs });
  }

  succeed(key: string): void {
    this.fails.delete(key);
  }
}

export const limiter = new LoginLimiter();
```

`admin/scripts/user.mjs`:

```js
// Genereaza linia unui cont pentru ADMIN_USERS: npm run user -- <email> "<Nume>" "<parola>"
import { hashPassword } from '../src/lib/password.mjs';

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password || password.length < 10) {
  console.error('Folosire: npm run user -- <email> "<Nume>" "<parola de minimum 10 caractere>"');
  process.exit(1);
}
console.log(JSON.stringify({ email, name, hash: hashPassword(password) }));
```

- [ ] **Step 3: Rulează testul și confirmă că trece**

Run: `npx vitest run tests/auth.test.ts`
Expected: PASS, 7 teste.

- [ ] **Step 4: Commit**

```bash
cd ..
git add admin/src/lib/password.mjs admin/src/lib/auth.ts admin/scripts/user.mjs admin/tests/auth.test.ts
git commit -m "feat(admin): parole scrypt, sesiune semnata si limitarea incercarilor"
```

---

### Task 10: Login, logout și middleware

**Files:**
- Create: `admin/src/middleware.ts`, `admin/src/pages/login.astro`, `admin/src/pages/logout.ts`
- Modify: `admin/.env` (contul local de test, fișier ignorat de git)

**Interfaces:**
- Consumes: `env()` (Task 8), `findUser`, `limiter`, `signSession`, `readSession`, `SESSION_COOKIE`, `SESSION_DAYS` (Task 9).
- Produces: `Astro.locals.user` pe toate paginile în afară de `/login` și `/health`; API-urile răspund `401` JSON `{ ok: false, error }` fără sesiune; orice cerere care nu e GET/HEAD cu altă origine decât `ADMIN_ORIGIN` primește `403`.

- [ ] **Step 1: Middleware-ul**

`admin/src/middleware.ts`:

```ts
import { defineMiddleware } from 'astro:middleware';
import { env } from './lib/env';
import { readSession, SESSION_COOKIE } from './lib/auth';

const PUBLIC = new Set(['/login', '/health']);

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { adminOrigin, sessionSecret, users } = env();
  const { pathname } = ctx.url;

  // Cererile care schimba ceva trebuie sa vina din admin (protectie CSRF, pe langa SameSite=Strict).
  if (ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') {
    if (ctx.request.headers.get('origin') !== adminOrigin) return new Response('Cerere respinsă.', { status: 403 });
  }

  if (!PUBLIC.has(pathname)) {
    const user = readSession(ctx.cookies.get(SESSION_COOKIE)?.value, sessionSecret, users);
    if (!user) {
      if (pathname.startsWith('/api/') || pathname.startsWith('/media/')) {
        return new Response(JSON.stringify({ ok: false, error: 'Sesiunea a expirat. Intră din nou în cont.' }), {
          status: 401,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        });
      }
      return ctx.redirect(`/login?next=${encodeURIComponent(pathname)}`);
    }
    ctx.locals.user = { email: user.email, name: user.name };
  }

  const res = await next();
  const headers = new Headers(res.headers);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});
```

- [ ] **Step 2: Pagina de login și ieșirea din cont**

`admin/src/pages/login.astro`:

```astro
---
import '../styles/admin.css';
import logo from '../assets/lox-logo-dark.png';
import { env } from '../lib/env';
import { findUser, limiter, SESSION_COOKIE, SESSION_DAYS, signSession } from '../lib/auth';

const next = Astro.url.searchParams.get('next') ?? '';
const target = next.startsWith('/') && !next.startsWith('//') ? next : '/proiecte';
let email = '';
let error = '';

if (Astro.request.method === 'POST') {
  const form = await Astro.request.formData();
  email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  // In spatele proxy-ului din Coolify, ultima adresa din X-Forwarded-For e cea vazuta de proxy.
  const ip = Astro.request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || Astro.clientAddress;
  const key = `${email.toLowerCase()}|${ip}`;

  if (limiter.blocked(key)) {
    error = 'Prea multe încercări greșite. Încearcă din nou peste 15 minute.';
  } else {
    const user = findUser(env().users, email, password);
    if (user) {
      limiter.succeed(key);
      Astro.cookies.set(SESSION_COOKIE, signSession(user.email, env().sessionSecret), {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'strict',
        path: '/',
        maxAge: SESSION_DAYS * 86400,
      });
      return Astro.redirect(target);
    }
    limiter.fail(key);
    error = 'Emailul sau parola nu sunt corecte.';
  }
}
---

<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Intră în cont | Admin LOX</title>
  </head>
  <body>
    <main class="login">
      <form class="login__card" method="post">
        <img src={logo.src} width={Math.round((logo.width / logo.height) * 30)} height="30" alt="LOX Mobila" />
        <h1>Intră în cont</h1>
        {error && <p class="login__error" role="alert">{error}</p>}
        <div class="fields">
          <label class="field">
            <span class="field__label">Email</span>
            <input type="email" name="email" value={email} autocomplete="username" required autofocus />
          </label>
          <label class="field">
            <span class="field__label">Parolă</span>
            <input type="password" name="password" autocomplete="current-password" required />
          </label>
          <button type="submit" class="btn">Intră</button>
        </div>
      </form>
    </main>
  </body>
</html>
```

`admin/src/pages/logout.ts`:

```ts
import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../lib/auth';

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/login');
};
```

- [ ] **Step 3: Contul local de test**

```bash
cd admin
LINE=$(npm run -s user -- test@loxmobila.ro "Cont test" "parola-de-test-1")
sed -i '' "s|^ADMIN_USERS=.*|ADMIN_USERS=[$LINE]|" .env
grep ADMIN_USERS .env
```

Expected: `ADMIN_USERS=[{"email":"test@loxmobila.ro","name":"Cont test","hash":"scrypt$..."}]`.

- [ ] **Step 4: Verifică fluxul**

Run: `npx astro check && npm run build`, apoi pornește `npm run dev` și:

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:4400/proiecte
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:4400/logout
curl -s -c /tmp/lox-cookie -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Origin: http://localhost:4400' \
  --data-urlencode 'email=test@loxmobila.ro' --data-urlencode 'password=parola-de-test-1' localhost:4400/login
curl -s -b /tmp/lox-cookie -o /dev/null -w '%{http_code}\n' localhost:4400/proiecte
curl -s -H 'Origin: http://localhost:4400' --data-urlencode 'email=test@loxmobila.ro' --data-urlencode 'password=gresit' localhost:4400/login | grep -o 'Emailul sau parola nu sunt corecte.'
```

Expected, în ordine: `302 http://localhost:4400/login?next=%2Fproiecte`; `403` (fără Origin); `302 http://localhost:4400/proiecte`; `200`; `Emailul sau parola nu sunt corecte.`

Cu Playwright, captură la `/login` pe 1280 și 390 în `.shots/admin/task10-login-*.png`. Expected: card alb centrat cu logoul, titlul, cele două câmpuri și butonul negru „Intră” pe toată lățimea cardului.

- [ ] **Step 5: Commit**

```bash
cd ..
git add admin/src/middleware.ts admin/src/pages/login.astro admin/src/pages/logout.ts
git commit -m "feat(admin): login cu email si parola, middleware de sesiune si origine"
```

---

### Task 11: Depozitul: GitHub și modul local

**Files:**
- Create: `admin/src/lib/github.ts`, `admin/src/lib/local-repo.ts`, `admin/src/lib/repo.ts`
- Create: `admin/tests/github.test.ts`, `admin/tests/local-repo.test.ts`

**Interfaces:**
- Consumes: `env()` (Task 8).
- Produces:
  - `FileChange { path: string; content: string | Uint8Array }` (text în UTF-8 sau bytes);
  - `CommitInput { message: string; author: { name: string; email: string }; files: FileChange[]; deletes: string[] }`;
  - `RunState = 'pending' | 'success' | 'failure'`;
  - `Repo { readText(path): Promise<string>; readBytes(path): Promise<Buffer>; commit(input): Promise<string>; runState(sha): Promise<RunState> }`;
  - `class GitHubError extends Error { status: number }`;
  - `createGitHub({ token, repo: { owner, name }, branch, fetch? }): Repo`;
  - `createLocalRepo(dir, now?): Repo`;
  - `repo(): Repo`, `author(user: { name; email }): { name; email }`.

- [ ] **Step 1: Scrie testele care pică**

`admin/tests/github.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createGitHub, GitHubError } from '../src/lib/github';

type Reply = { status?: number; json?: unknown; text?: string };
type Route = (body: any, n: number) => Reply;

function fakeFetch(routes: Record<string, Route>) {
  const calls: { key: string; url: string; body?: any; headers: Record<string, string> }[] = [];
  const counts = new Map<string, number>();
  const fn = (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input).replace('https://api.github.com/repos/o/r', '');
    const key = `${init.method ?? 'GET'} ${url.split('?')[0]}`;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ key, url, body, headers: init.headers as Record<string, string> });
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    const route = routes[key];
    if (!route) return new Response('lipsa', { status: 404 });
    const r = route(body, n);
    return new Response(r.text ?? JSON.stringify(r.json ?? {}), { status: r.status ?? 200 });
  }) as typeof fetch;
  return { fn, calls };
}

const repoOpts = { token: 'tok', repo: { owner: 'o', name: 'r' }, branch: 'main' };

const commitRoutes = (patch: Route): Record<string, Route> => ({
  'GET /git/ref/heads/main': (_b, n) => ({ json: { object: { sha: `base${n}` } } }),
  'GET /git/commits/base1': () => ({ json: { tree: { sha: 'tree1' } } }),
  'GET /git/commits/base2': () => ({ json: { tree: { sha: 'tree2' } } }),
  'POST /git/blobs': (_b, n) => ({ status: 201, json: { sha: `blob${n}` } }),
  'POST /git/trees': (_b, n) => ({ status: 201, json: { sha: `newtree${n}` } }),
  'POST /git/commits': (_b, n) => ({ status: 201, json: { sha: `commit${n}` } }),
  'PATCH /git/refs/heads/main': patch,
});

const input = {
  message: 'Contact și program',
  author: { name: 'Atelier', email: 'atelier@loxmobila.ro' },
  files: [
    { path: 'src/content/contact.json', content: '{"a":1}\n' },
    { path: 'src/assets/images/projects/p/ab12cd34.jpg', content: new Uint8Array([1, 2, 3]) },
  ],
  deletes: ['src/assets/images/projects/p/vechi.jpg'],
};

describe('createGitHub.commit', () => {
  it('makes one commit with text blobs, byte blobs and deletions', async () => {
    const { fn, calls } = fakeFetch(commitRoutes(() => ({ json: {} })));
    const sha = await createGitHub({ ...repoOpts, fetch: fn }).commit(input);
    expect(sha).toBe('commit1');

    const blobs = calls.filter((c) => c.key === 'POST /git/blobs').map((c) => c.body);
    expect(blobs).toEqual([
      { content: '{"a":1}\n', encoding: 'utf-8' },
      { content: Buffer.from([1, 2, 3]).toString('base64'), encoding: 'base64' },
    ]);
    const tree = calls.find((c) => c.key === 'POST /git/trees')!.body;
    expect(tree.base_tree).toBe('tree1');
    expect(tree.tree).toContainEqual({ path: 'src/assets/images/projects/p/vechi.jpg', mode: '100644', type: 'blob', sha: null });
    const commit = calls.find((c) => c.key === 'POST /git/commits')!.body;
    expect(commit.parents).toEqual(['base1']);
    expect(commit.author.name).toBe('Atelier');
    expect(calls.find((c) => c.key === 'PATCH /git/refs/heads/main')!.body).toEqual({ sha: 'commit1', force: false });
    expect(calls[0].headers.Authorization).toBe('Bearer tok');
  });

  it('rebuilds the commit on top of the new tip when the branch moved', async () => {
    const { fn, calls } = fakeFetch(commitRoutes((_b, n) => (n === 1 ? { status: 422, json: { message: 'not a fast forward' } } : { json: {} })));
    const sha = await createGitHub({ ...repoOpts, fetch: fn }).commit(input);
    expect(sha).toBe('commit2');
    expect(calls.filter((c) => c.key === 'POST /git/commits')[1].body.parents).toEqual(['base2']);
  });

  it('does not retry other errors', async () => {
    const routes = commitRoutes(() => ({ json: {} }));
    routes['POST /git/blobs'] = () => ({ status: 500, text: 'eroare' });
    const { fn, calls } = fakeFetch(routes);
    await expect(createGitHub({ ...repoOpts, fetch: fn }).commit(input)).rejects.toBeInstanceOf(GitHubError);
    expect(calls.filter((c) => c.key === 'GET /git/ref/heads/main')).toHaveLength(1);
  });
});

describe('createGitHub reads and status', () => {
  it('reads a raw file from the branch', async () => {
    const { fn, calls } = fakeFetch({ 'GET /contents/src/content/contact.json': () => ({ text: '{"ok":true}' }) });
    expect(await createGitHub({ ...repoOpts, fetch: fn }).readText('src/content/contact.json')).toBe('{"ok":true}');
    expect(calls[0].url).toBe('/contents/src/content/contact.json?ref=main');
    expect(calls[0].headers.Accept).toBe('application/vnd.github.raw+json');
  });

  it('maps workflow runs to a publish state', async () => {
    const states: unknown[][] = [[], [{ status: 'in_progress', conclusion: null }], [{ status: 'completed', conclusion: 'success' }], [{ status: 'completed', conclusion: 'failure' }]];
    const results = [];
    for (const runs of states) {
      const { fn } = fakeFetch({ 'GET /actions/runs': () => ({ json: { workflow_runs: runs } }) });
      results.push(await createGitHub({ ...repoOpts, fetch: fn }).runState('a'.repeat(40)));
    }
    expect(results).toEqual(['pending', 'pending', 'success', 'failure']);
  });
});
```

`admin/tests/local-repo.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalRepo } from '../src/lib/local-repo';

let dir: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lox-repo-'));
  git('init', '-q', '-b', 'main');
  mkdirSync(join(dir, 'src/content'), { recursive: true });
  writeFileSync(join(dir, 'src/content/a.json'), '{}\n');
  writeFileSync(join(dir, 'vechi.jpg'), 'x');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@t.ro', 'commit', '-qm', 'init');
});

describe('createLocalRepo', () => {
  it('writes text and bytes, deletes files and commits once with the author', async () => {
    const repo = createLocalRepo(dir);
    const sha = await repo.commit({
      message: 'Culori',
      author: { name: 'Atelier', email: 'atelier@loxmobila.ro' },
      files: [
        { path: 'src/content/a.json', content: '{"b":2}\n' },
        { path: 'src/assets/p/01.jpg', content: new Uint8Array([7, 8]) },
      ],
      deletes: ['vechi.jpg'],
    });
    expect(sha).toBe(git('rev-parse', 'HEAD'));
    expect(git('log', '-1', '--format=%s|%an|%ae')).toBe('Culori|Atelier|atelier@loxmobila.ro');
    expect(readFileSync(join(dir, 'src/content/a.json'), 'utf8')).toBe('{"b":2}\n');
    expect([...readFileSync(join(dir, 'src/assets/p/01.jpg'))]).toEqual([7, 8]);
    expect(existsSync(join(dir, 'vechi.jpg'))).toBe(false);
    expect(await repo.readText('src/content/a.json')).toBe('{"b":2}\n');
  });

  it('refuses paths outside the repository', async () => {
    const repo = createLocalRepo(dir);
    await expect(repo.readText('../x')).rejects.toThrow('afara');
    await expect(repo.commit({ message: 'x', author: { name: 'a', email: 'a@a.ro' }, files: [{ path: '../x', content: 'a' }], deletes: [] })).rejects.toThrow('afara');
  });

  it('reports success three seconds after the commit', async () => {
    let t = 0;
    const repo = createLocalRepo(dir, () => t);
    const sha = await repo.commit({ message: 'x', author: { name: 'a', email: 'a@a.ro' }, files: [{ path: 'b.txt', content: 'b' }], deletes: [] });
    expect(await repo.runState(sha)).toBe('pending');
    t = 3000;
    expect(await repo.runState(sha)).toBe('success');
  });
});
```

Run: `npx vitest run tests/github.test.ts tests/local-repo.test.ts`
Expected: FAIL, modulele lipsesc.

- [ ] **Step 2: Clientul GitHub**

`admin/src/lib/github.ts`:

```ts
export interface FileChange {
  path: string;
  /** Text (se scrie in UTF-8) sau bytes (poze). */
  content: string | Uint8Array;
}

export interface CommitInput {
  message: string;
  author: { name: string; email: string };
  files: FileChange[];
  deletes: string[];
}

export type RunState = 'pending' | 'success' | 'failure';

/** Ce stie adminul sa faca cu depozitul: GitHub in productie, un clone local in teste. */
export interface Repo {
  readText(path: string): Promise<string>;
  readBytes(path: string): Promise<Buffer>;
  commit(input: CommitInput): Promise<string>;
  runState(sha: string): Promise<RunState>;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface Options {
  token: string;
  repo: { owner: string; name: string };
  branch: string;
  fetch?: typeof fetch;
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export function createGitHub(opts: Options): Repo {
  const f = opts.fetch ?? fetch;
  const base = `https://api.github.com/repos/${opts.repo.owner}/${opts.repo.name}`;
  const headers = (accept = 'application/vnd.github+json'): Record<string, string> => ({
    Authorization: `Bearer ${opts.token}`,
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
  });

  async function request(path: string, init: RequestInit = {}, accept?: string): Promise<Response> {
    const res = await f(`${base}${path}`, {
      ...init,
      headers: { ...headers(accept), ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (!res.ok) throw new GitHubError(`GitHub ${init.method ?? 'GET'} ${path}: ${res.status}`, res.status);
    return res;
  }

  const api = async <T>(path: string, init?: RequestInit): Promise<T> => (await request(path, init)).json() as Promise<T>;
  const post = <T>(path: string, body: unknown, method = 'POST') => api<T>(path, { method, body: JSON.stringify(body) });
  const raw = (path: string) =>
    request(`/contents/${encodePath(path)}?ref=${encodeURIComponent(opts.branch)}`, {}, 'application/vnd.github.raw+json');

  async function commitOnce(input: CommitInput): Promise<string> {
    const ref = await api<{ object: { sha: string } }>(`/git/ref/heads/${opts.branch}`);
    const parent = ref.object.sha;
    const current = await api<{ tree: { sha: string } }>(`/git/commits/${parent}`);

    const tree: { path: string; mode: '100644'; type: 'blob'; sha: string | null }[] = [];
    for (const file of input.files) {
      const blob = await post<{ sha: string }>(
        '/git/blobs',
        typeof file.content === 'string'
          ? { content: file.content, encoding: 'utf-8' }
          : { content: Buffer.from(file.content).toString('base64'), encoding: 'base64' },
      );
      tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    for (const path of input.deletes) tree.push({ path, mode: '100644', type: 'blob', sha: null });

    const newTree = await post<{ sha: string }>('/git/trees', { base_tree: current.tree.sha, tree });
    const commit = await post<{ sha: string }>('/git/commits', {
      message: input.message,
      tree: newTree.sha,
      parents: [parent],
      author: { ...input.author, date: new Date().toISOString() },
    });
    await post(`/git/refs/heads/${opts.branch}`, { sha: commit.sha, force: false }, 'PATCH');
    return commit.sha;
  }

  return {
    async readText(path) {
      return (await raw(path)).text();
    },
    async readBytes(path) {
      return Buffer.from(await (await raw(path)).arrayBuffer());
    },
    /** Un singur commit pentru toata salvarea; daca ramura s-a miscat intre timp, il reface o data peste noul varf. */
    async commit(input) {
      try {
        return await commitOnce(input);
      } catch (e) {
        if (e instanceof GitHubError && e.status === 422) return commitOnce(input);
        throw e;
      }
    },
    async runState(sha) {
      const data = await api<{ workflow_runs: { status: string; conclusion: string | null }[] }>(
        `/actions/runs?head_sha=${sha}&per_page=5`,
      );
      const run = data.workflow_runs[0];
      if (!run || run.status !== 'completed') return 'pending';
      return run.conclusion === 'success' ? 'success' : 'failure';
    },
  };
}
```

- [ ] **Step 3: Modul local**

`admin/src/lib/local-repo.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import type { CommitInput, Repo, RunState } from './github';

/**
 * Mod de test: acelasi contract ca GitHub, dar pe un clone local, cu git. Nu atinge GitHub.
 * Publicarea se considera reusita la 3 secunde dupa commit.
 */
export function createLocalRepo(dir: string, now: () => number = Date.now): Repo {
  const root = resolve(dir);
  const inside = (path: string) => {
    const full = resolve(root, path);
    if (!full.startsWith(root + sep)) throw new Error(`Cale in afara repo-ului: ${path}`);
    return full;
  };
  const committedAt = new Map<string, number>();

  return {
    async readText(path) {
      return readFileSync(inside(path), 'utf8');
    },
    async readBytes(path) {
      return readFileSync(inside(path));
    },
    async commit(input: CommitInput) {
      const files = input.files.map((f) => ({ full: inside(f.path), content: f.content }));
      const deletes = input.deletes.map(inside);
      for (const f of files) {
        mkdirSync(dirname(f.full), { recursive: true });
        writeFileSync(f.full, f.content);
      }
      for (const full of deletes) rmSync(full, { force: true });
      execFileSync('git', ['add', '-A'], { cwd: root });
      execFileSync(
        'git',
        ['-c', `user.name=${input.author.name}`, '-c', `user.email=${input.author.email}`, 'commit', '-q', '-m', input.message],
        { cwd: root },
      );
      const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
      committedAt.set(sha, now());
      return sha;
    },
    async runState(sha): Promise<RunState> {
      const at = committedAt.get(sha);
      return at !== undefined && now() - at >= 3000 ? 'success' : 'pending';
    },
  };
}
```

`admin/src/lib/repo.ts`:

```ts
import { env } from './env';
import { createGitHub, type Repo } from './github';
import { createLocalRepo } from './local-repo';

let instance: Repo | undefined;

/** Depozitul folosit de admin: clone-ul local din LOCAL_REPO_DIR (teste) sau GitHub. */
export function repo(): Repo {
  if (!instance) {
    const e = env();
    instance = e.localRepoDir
      ? createLocalRepo(e.localRepoDir)
      : createGitHub({ token: e.githubToken, repo: e.repo, branch: e.branch });
  }
  return instance;
}

/** Autorul commit-ului e omul logat, ca istoricul sa arate cine a schimbat ce. */
export function author(user: { name: string; email: string }): { name: string; email: string } {
  return { name: user.name, email: user.email };
}
```

- [ ] **Step 4: Rulează testele și confirmă că trec**

Run: `npx vitest run tests/github.test.ts tests/local-repo.test.ts`
Expected: PASS, 8 teste.

- [ ] **Step 5: Clone-ul local pentru lucru**

Din rădăcina repo-ului, după ce toate commit-urile din partea A sunt făcute:

```bash
rm -rf /tmp/lox-local && git clone -q "$PWD" /tmp/lox-local && git -C /tmp/lox-local log -1 --format=%s
```

Expected: ultimul mesaj de commit de pe `admin-panel`. `admin/.env` are deja `LOCAL_REPO_DIR=/tmp/lox-local`.

- [ ] **Step 6: Commit**

```bash
git add admin/src/lib/github.ts admin/src/lib/local-repo.ts admin/src/lib/repo.ts admin/tests/github.test.ts admin/tests/local-repo.test.ts
git commit -m "feat(admin): commit prin API-ul GitHub si mod local pentru teste"
```

---

### Task 12: Conținut, poze și adrese de pagină

**Files:**
- Modify: `src/content/schema.ts` (tipul `Issue`, `parseContent` și schemele formularelor), `tests/schema.test.ts`
- Create: `admin/src/lib/content.ts`, `admin/src/lib/images.ts`, `admin/src/lib/slug.ts`, `admin/src/lib/format.ts`, `admin/src/lib/projects.ts`, `admin/src/lib/page-photos.ts`
- Create: `admin/tests/content.test.ts`, `admin/tests/images.test.ts`, `admin/tests/slug.test.ts`, `admin/tests/projects.test.ts`, `admin/tests/page-photos.test.ts`

**Interfaces:**
- Consumes: `Repo`, `FileChange` (Task 11); schema (Task 1).
- Produces:
  - în `schema.ts`: `Issue { path; message }`, `parseContent(schema, data): { ok: true; data } | { ok: false; issues: Issue[] }`, `reviewsFormSchema`, `categoryFormSchema`, `projectFieldsSchema`, `projectOrderSchema`, `slugRequestSchema`;
  - `content.ts`: `class ValidationError { issues: Issue[] }`, `check(result)`, `serialize(data): string`, `readContent(repo, key)`, `saveContent(repo, key, data, { message, author, files?, deletes? }): Promise<string>`, `clearContentCache()`;
  - `images.ts`: `MAX_UPLOAD_BYTES`, `class ImageError`, `prepareImage(buf): Promise<Buffer>`, `thumbnail(buf, width?): Promise<Buffer>`, `newPhotoId(): string`;
  - `slug.ts`: `slugify(title)`, `uniqueSlug(title, taken)`;
  - `format.ts`: `formatPhone(international)`, `photosLabel(n)`;
  - `projects.ts`: `ProjectDraft`, `buildProjectSave({ list, draft, uploads, prepare, newId })`, `deleteProject(list, slug)`, `reorderProjects(list, order, featured)`;
  - `page-photos.ts`: `PagePhotoSlot`, `PAGE_PHOTO_SLOTS`, `PAGE_PHOTO_LABELS`, `slotDir(slot)`, `slotFolder(slot)`, `currentFile(photos, slot)`, `buildPagePhotosSave({ current, uploads, prepare, newId })`.

- [ ] **Step 1: Completează schema pentru admin**

În `src/content/schema.ts`, înlocuiește funcția `formatIssues` cu:

```ts
export interface Issue {
  path: string;
  message: string;
}

/** Erorile in forma „cale.camp: mesaj”, pentru build si pentru formularele adminului. */
export function formatIssues(error: z.ZodError): Issue[] {
  return error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }));
}

/** Validare fara exceptii, pentru admin: datele curate sau lista de erori pe campuri. */
export function parseContent<S extends z.ZodType>(
  schema: S,
  data: unknown,
): { ok: true; data: z.output<S> } | { ok: false; issues: Issue[] } {
  const r = schema.safeParse(data);
  return r.success ? { ok: true, data: r.data } : { ok: false, issues: formatIssues(r.error) };
}

// Ce trimit ecranele adminului, cand forma difera de fisierul salvat. Stau aici ca adminul
// sa nu aiba nevoie de o a doua copie de zod.
export const reviewsFormSchema = z.object({ items: reviewsSchema });
export const categoryFormSchema = categoryPageSchema.omit({ key: true });
export const projectFieldsSchema = projectSchema.omit({ slug: true, photos: true });
export const projectOrderSchema = z.object({
  order: z.array(z.string()),
  featured: z.record(z.string(), z.boolean()),
});
export const slugRequestSchema = z.object({ slug: z.string().regex(SLUG) });
```

(Mută `formatIssues` sub declarațiile schemelor, ca schemele formularelor să vină după cele de bază.)

În `tests/schema.test.ts` adaugă:

```ts
import { parseContent } from '../src/content/schema';

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
```

Run (rădăcină): `npm test && npx astro check`
Expected: verde.

- [ ] **Step 2: Scrie testele care pică**

`admin/tests/content.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { clearContentCache, readContent, saveContent, ValidationError } from '../src/lib/content';
import type { CommitInput, Repo } from '../src/lib/github';

const theme = '{\n  "background": "#0C0C0C",\n  "text": "#F2EFEA",\n  "accent": "#B7966B"\n}\n';

function memoryRepo(files: Record<string, string>) {
  const commits: CommitInput[] = [];
  let reads = 0;
  const repo: Repo = {
    async readText(path) {
      reads++;
      if (!(path in files)) throw new Error(`lipsa ${path}`);
      return files[path];
    },
    async readBytes() {
      return Buffer.alloc(0);
    },
    async commit(input) {
      commits.push(input);
      return 'a'.repeat(40);
    },
    async runState() {
      return 'success';
    },
  };
  return { repo, commits, reads: () => reads };
}

beforeEach(clearContentCache);

describe('readContent', () => {
  it('parses the file once and serves the next read from cache', async () => {
    const m = memoryRepo({ 'src/content/theme.json': theme });
    expect((await readContent(m.repo, 'theme')).accent).toBe('#B7966B');
    await readContent(m.repo, 'theme');
    expect(m.reads()).toBe(1);
  });
});

describe('saveContent', () => {
  it('commits the normalized JSON together with extra files and deletions', async () => {
    const m = memoryRepo({});
    const sha = await saveContent(m.repo, 'theme', { background: '#ffffff', text: '#111111', accent: '#86643a' }, {
      message: 'Culori',
      author: { name: 'Atelier', email: 'atelier@loxmobila.ro' },
      files: [{ path: 'x.jpg', content: new Uint8Array([1]) }],
      deletes: ['y.jpg'],
    });
    expect(sha).toHaveLength(40);
    const [c] = m.commits;
    expect(c.message).toBe('Culori');
    expect(c.files[0]).toEqual({
      path: 'src/content/theme.json',
      content: '{\n  "background": "#FFFFFF",\n  "text": "#111111",\n  "accent": "#86643A"\n}\n',
    });
    expect(c.files[1].path).toBe('x.jpg');
    expect(c.deletes).toEqual(['y.jpg']);
    expect((await readContent(m.repo, 'theme')).background).toBe('#FFFFFF');
  });

  it('refuses invalid data with field issues and does not commit', async () => {
    const m = memoryRepo({});
    const err = await saveContent(m.repo, 'theme', { background: 'alb', text: '#111111', accent: '#86643A' }, {
      message: 'Culori',
      author: { name: 'a', email: 'a@a.ro' },
    }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).issues[0].path).toBe('background');
    expect(m.commits).toHaveLength(0);
  });
});
```

`admin/tests/images.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { ImageError, MAX_UPLOAD_BYTES, newPhotoId, prepareImage, thumbnail } from '../src/lib/images';

const photo = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#8a6a40' } }).jpeg();

describe('prepareImage', () => {
  it('rotates by EXIF, caps the long side at 2400 px and strips metadata', async () => {
    const input = await photo(3000, 2000).withMetadata({ orientation: 6 }).toBuffer();
    expect((await sharp(input).metadata()).orientation).toBe(6);
    const meta = await sharp(await prepareImage(input)).metadata();
    expect(meta.format).toBe('jpeg');
    expect([meta.width, meta.height]).toEqual([1600, 2400]);
    expect(meta.orientation).toBeUndefined();
    expect(meta.exif).toBeUndefined();
  });

  it('keeps small photos at their size', async () => {
    const meta = await sharp(await prepareImage(await photo(800, 600).toBuffer())).metadata();
    expect([meta.width, meta.height]).toEqual([800, 600]);
  });

  it('rejects files that are not photos, GIFs and files over 25 MB', async () => {
    await expect(prepareImage(Buffer.from('nu e poza'))).rejects.toThrow('Fișierul nu e o poză validă.');
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).gif().toBuffer();
    await expect(prepareImage(gif)).rejects.toBeInstanceOf(ImageError);
    await expect(prepareImage(Buffer.alloc(MAX_UPLOAD_BYTES + 1))).rejects.toThrow('Poza are peste 25 MB.');
  });
});

describe('thumbnail and ids', () => {
  it('makes a 480 px wide JPEG', async () => {
    const meta = await sharp(await thumbnail(await photo(2400, 1600).toBuffer())).metadata();
    expect(meta.width).toBe(480);
  });

  it('makes 8-character hex ids', () => {
    expect(newPhotoId()).toMatch(/^[0-9a-f]{8}$/);
  });
});
```

`admin/tests/slug.test.ts`:

```ts
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
```

`admin/tests/projects.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import type { Project } from '@site/content/schema';
import { buildProjectSave, deleteProject, reorderProjects } from '../src/lib/projects';
import { ValidationError } from '../src/lib/content';

const make = (slug: string, photos = [`${slug}/01.jpg`]): Project => ({
  slug,
  title: slug,
  category: 'bucatarii',
  weeks: 3,
  featured: false,
  specs: [{ label: 'Fronturi', value: 'MDF' }],
  photos,
});

const fields = { title: 'Bucătărie în L', category: 'bucatarii', weeks: 5, featured: true, description: '', specs: [{ label: 'Blat', value: 'Quartz' }] };

function deps() {
  let n = 0;
  return { prepare: vi.fn(async (b: Buffer) => Buffer.concat([b, Buffer.from('!')])), newId: () => `id${String(++n).padStart(6, '0')}` };
}

describe('buildProjectSave', () => {
  it('creates a new project first in the list, with processed photos in its folder', async () => {
    const d = deps();
    const list = [make('dulap')];
    const r = await buildProjectSave({ list, draft: { ...fields, photos: ['new:a', 'new:b'] }, uploads: new Map([['a', Buffer.from('A')], ['b', Buffer.from('B')]]), ...d });
    expect(r.slug).toBe('bucatarie-in-l');
    expect(r.message).toBe('Proiect nou: Bucătărie în L');
    expect(r.list.map((p) => p.slug)).toEqual(['bucatarie-in-l', 'dulap']);
    expect(r.list[0].photos).toEqual(['bucatarie-in-l/id000001.jpg', 'bucatarie-in-l/id000002.jpg']);
    expect(r.files.map((f) => f.path)).toEqual([
      'src/assets/images/projects/bucatarie-in-l/id000001.jpg',
      'src/assets/images/projects/bucatarie-in-l/id000002.jpg',
    ]);
    expect(Buffer.from(r.files[0].content as Uint8Array).toString()).toBe('A!');
    expect(r.list[0].description).toBeUndefined();
    expect(r.deletes).toEqual([]);
  });

  it('gives a new project a free address when the title is taken', async () => {
    const r = await buildProjectSave({ list: [make('bucatarie-in-l')], draft: { ...fields, photos: ['new:a'] }, uploads: new Map([['a', Buffer.from('A')]]), ...deps() });
    expect(r.slug).toBe('bucatarie-in-l-2');
  });

  it('edits in place: keeps the address, reorders, adds and deletes photos', async () => {
    const list = [make('dulap'), make('bucatarie-in-l', ['bucatarie-in-l/01.jpg', 'bucatarie-in-l/02.jpg'])];
    const r = await buildProjectSave({
      list,
      draft: { ...fields, slug: 'bucatarie-in-l', title: 'Titlu nou', photos: ['new:x', 'keep:bucatarie-in-l/02.jpg'] },
      uploads: new Map([['x', Buffer.from('X')]]),
      ...deps(),
    });
    expect(r.slug).toBe('bucatarie-in-l');
    expect(r.message).toBe('Proiect modificat: Titlu nou');
    expect(r.list.map((p) => p.slug)).toEqual(['dulap', 'bucatarie-in-l']);
    expect(r.list[1].photos).toEqual(['bucatarie-in-l/id000001.jpg', 'bucatarie-in-l/02.jpg']);
    expect(r.deletes).toEqual(['src/assets/images/projects/bucatarie-in-l/01.jpg']);
  });

  it('refuses a photo that belongs to another project', async () => {
    const list = [make('dulap'), make('bucatarie-in-l')];
    const err = await buildProjectSave({ list, draft: { ...fields, slug: 'bucatarie-in-l', photos: ['keep:dulap/01.jpg'] }, uploads: new Map(), ...deps() }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('checks the fields before touching any photo', async () => {
    const d = deps();
    const err = await buildProjectSave({ list: [], draft: { ...fields, title: '', photos: ['new:a'] }, uploads: new Map([['a', Buffer.from('A')]]), ...d }).catch((e) => e);
    expect((err as ValidationError).issues[0].path).toBe('title');
    expect(d.prepare).not.toHaveBeenCalled();
  });

  it('needs at least one photo', async () => {
    const err = await buildProjectSave({ list: [], draft: { ...fields, photos: [] }, uploads: new Map(), ...deps() }).catch((e) => e);
    expect((err as ValidationError).issues).toEqual([{ path: 'photos', message: 'Proiectul are nevoie de cel puțin o poză.' }]);
  });
});

describe('deleteProject and reorderProjects', () => {
  it('deletes a project with all its photos', () => {
    const r = deleteProject([make('a'), make('b', ['b/01.jpg', 'b/02.jpg'])], 'b');
    expect(r.list.map((p) => p.slug)).toEqual(['a']);
    expect(r.deletes).toEqual(['src/assets/images/projects/b/01.jpg', 'src/assets/images/projects/b/02.jpg']);
    expect(r.message).toBe('Proiect șters: b');
  });

  it('applies a new order and the home page ticks', () => {
    const r = reorderProjects([make('a'), make('b'), make('c')], ['c', 'a', 'b'], { a: true });
    expect(r.map((p) => `${p.slug}:${p.featured}`)).toEqual(['c:false', 'a:true', 'b:false']);
  });

  it('refuses an order that does not match the current list', () => {
    expect(() => reorderProjects([make('a'), make('b')], ['a'], {})).toThrow(ValidationError);
    expect(() => reorderProjects([make('a'), make('b')], ['a', 'a'], {})).toThrow(ValidationError);
  });
});
```

`admin/tests/page-photos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildPagePhotosSave } from '../src/lib/page-photos';
import { ValidationError } from '../src/lib/content';

const current = {
  categories: { bucatarii: 'bucatarie.jpg', dressing: 'dressing.jpg', living: 'living.jpg', dormitor: 'dormitor.jpg', bai: 'baie.jpg', comercial: 'comercial.jpg' },
  atelier: 'atelier.jpg',
};
const deps = { prepare: async (b: Buffer) => b, newId: () => 'ab12cd34' };

describe('buildPagePhotosSave', () => {
  it('writes the new photo, deletes the old one and points the slot to it', async () => {
    const r = await buildPagePhotosSave({ current, uploads: new Map([['bai', Buffer.from('B')], ['atelier', Buffer.from('A')]]), ...deps });
    expect(r.value.categories.bai).toBe('bai-ab12cd34.jpg');
    expect(r.value.atelier).toBe('atelier-ab12cd34.jpg');
    expect(r.value.categories.bucatarii).toBe('bucatarie.jpg');
    expect(r.files.map((f) => f.path)).toEqual(['src/assets/images/services/bai-ab12cd34.jpg', 'src/assets/images/workshop/atelier-ab12cd34.jpg']);
    expect(r.deletes).toEqual(['src/assets/images/services/baie.jpg', 'src/assets/images/workshop/atelier.jpg']);
    expect(r.message).toBe('Poze pagini: Băi, Atelier');
  });

  it('refuses unknown slots and an empty save', async () => {
    await expect(buildPagePhotosSave({ current, uploads: new Map([['hero', Buffer.from('H')]]), ...deps })).rejects.toBeInstanceOf(ValidationError);
    await expect(buildPagePhotosSave({ current, uploads: new Map(), ...deps })).rejects.toBeInstanceOf(ValidationError);
  });
});
```

Run: `npx vitest run`
Expected: FAIL la testele noi, modulele lipsesc.

- [ ] **Step 3: Conținutul**

`admin/src/lib/content.ts`:

```ts
import { CONTENT_FILES, CONTENT_SCHEMAS, parseContent, type Content, type ContentKey, type Issue } from '@site/content/schema';
import type { FileChange, Repo } from './github';

export class ValidationError extends Error {
  constructor(public issues: Issue[]) {
    super(issues.map((i) => `${i.path}: ${i.message}`).join('; '));
  }
}

/** Datele validate, sau ValidationError cu erorile pe campuri. */
export function check<T>(result: { ok: true; data: T } | { ok: false; issues: Issue[] }): T {
  if (!result.ok) throw new ValidationError(result.issues);
  return result.data;
}

export const serialize = (data: unknown): string => `${JSON.stringify(data, null, 2)}\n`;

// Citirile din GitHub se tin 30 de secunde; propriile salvari actualizeaza cache-ul imediat.
const TTL = 30_000;
const cache = new Map<ContentKey, { at: number; value: unknown }>();

export function clearContentCache(): void {
  cache.clear();
}

export async function readContent<K extends ContentKey>(repo: Repo, key: K): Promise<Content[K]> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as Content[K];
  const value = check(parseContent(CONTENT_SCHEMAS[key], JSON.parse(await repo.readText(CONTENT_FILES[key])))) as Content[K];
  cache.set(key, { at: Date.now(), value });
  return value;
}

export async function saveContent<K extends ContentKey>(
  repo: Repo,
  key: K,
  data: unknown,
  opts: { message: string; author: { name: string; email: string }; files?: FileChange[]; deletes?: string[] },
): Promise<string> {
  const value = check(parseContent(CONTENT_SCHEMAS[key], data)) as Content[K];
  const sha = await repo.commit({
    message: opts.message,
    author: opts.author,
    files: [{ path: CONTENT_FILES[key], content: serialize(value) }, ...(opts.files ?? [])],
    deletes: opts.deletes ?? [],
  });
  cache.set(key, { at: Date.now(), value });
  return sha;
}
```

- [ ] **Step 4: Pozele**

`admin/src/lib/images.ts`:

```ts
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 2400;
const ACCEPTED = new Set(['jpeg', 'png', 'webp']);

export class ImageError extends Error {}

/**
 * Poza urcata devine JPEG de maximum 2400 px pe latura lunga, rotita dupa EXIF si fara metadate.
 * Pozele facute la client au in EXIF locatia casei; sharp nu le pastreaza.
 */
export async function prepareImage(input: Buffer): Promise<Buffer> {
  if (input.length > MAX_UPLOAD_BYTES) throw new ImageError('Poza are peste 25 MB.');
  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new ImageError('Fișierul nu e o poză validă.');
  }
  if (!format || !ACCEPTED.has(format)) throw new ImageError('Sunt acceptate doar poze JPEG, PNG sau WebP.');
  return sharp(input)
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

/** Miniatura pentru listele din admin. */
export function thumbnail(input: Buffer, width = 480): Promise<Buffer> {
  return sharp(input).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality: 76 }).toBuffer();
}

/** Nume nou la fiecare upload, ca o poza inlocuita sa nu ramana in cache-ul browserului. */
export function newPhotoId(): string {
  return randomBytes(4).toString('hex');
}
```

- [ ] **Step 5: Adrese de pagină și formatări**

`admin/src/lib/slug.ts`:

```ts
const RO: Record<string, string> = { ă: 'a', â: 'a', î: 'i', ș: 's', ş: 's', ț: 't', ţ: 't' };

/** „Bucătărie în L” devine „bucatarie-in-l”. */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[ăâîșşțţ]/g, (c) => RO[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug || 'proiect';
}

export function uniqueSlug(title: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(title);
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
}
```

`admin/src/lib/format.ts`:

```ts
/** „40740000000” devine „0740 000 000”, cum il scrie clientul. */
export function formatPhone(international: string): string {
  const local = international.startsWith('40') ? `0${international.slice(2)}` : international;
  return local.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
}

/** 1 poză, 2 poze, 20 de poze. */
export function photosLabel(n: number): string {
  if (n === 1) return '1 poză';
  return n % 100 >= 20 || n % 100 === 0 ? `${n} de poze` : `${n} poze`;
}
```

- [ ] **Step 6: Logica proiectelor**

`admin/src/lib/projects.ts`:

```ts
import { IMAGE_DIRS, parseContent, projectFieldsSchema, projectSchema, type Project } from '@site/content/schema';
import { check, ValidationError } from './content';
import type { FileChange } from './github';
import { uniqueSlug } from './slug';

/** Ce trimite formularul de proiect. `photos` sunt jetoane: „keep:<cale>” sau „new:<cheie upload>”. */
export interface ProjectDraft {
  slug?: string;
  title?: unknown;
  category?: unknown;
  weeks?: unknown;
  featured?: unknown;
  description?: unknown;
  specs?: unknown;
  photos?: unknown;
}

const photoFile = (path: string) => `${IMAGE_DIRS.projects}/${path}`;

export async function buildProjectSave(input: {
  list: Project[];
  draft: ProjectDraft;
  uploads: Map<string, Buffer>;
  prepare: (b: Buffer) => Promise<Buffer>;
  newId: () => string;
}): Promise<{ list: Project[]; files: FileChange[]; deletes: string[]; slug: string; message: string }> {
  const { list, draft, uploads } = input;
  const existing = draft.slug ? list.find((p) => p.slug === draft.slug) : undefined;
  if (draft.slug && !existing) {
    throw new ValidationError([{ path: '', message: 'Proiectul nu mai există. Poate a fost șters între timp.' }]);
  }

  // Intai campurile, ca sa nu prelucram poze degeaba.
  const fields = check(
    parseContent(projectFieldsSchema, {
      title: draft.title,
      category: draft.category,
      weeks: draft.weeks,
      featured: draft.featured === true,
      description: draft.description,
      specs: draft.specs,
    }),
  );
  const tokens = Array.isArray(draft.photos) ? draft.photos.map(String) : [];
  if (tokens.length === 0) throw new ValidationError([{ path: 'photos', message: 'Proiectul are nevoie de cel puțin o poză.' }]);

  const slug = existing?.slug ?? uniqueSlug(fields.title, list.map((p) => p.slug));
  const files: FileChange[] = [];
  const photos: string[] = [];
  for (const token of tokens) {
    if (token.startsWith('keep:')) {
      const path = token.slice(5);
      if (!existing?.photos.includes(path)) {
        throw new ValidationError([{ path: 'photos', message: 'O poză nu mai există. Reîncarcă pagina.' }]);
      }
      photos.push(path);
    } else if (token.startsWith('new:')) {
      const upload = uploads.get(token.slice(4));
      if (!upload) throw new ValidationError([{ path: 'photos', message: 'O poză nu s-a urcat. Încearcă din nou.' }]);
      let path: string;
      do path = `${slug}/${input.newId()}.jpg`;
      while (photos.includes(path) || existing?.photos.includes(path));
      files.push({ path: photoFile(path), content: await input.prepare(upload) });
      photos.push(path);
    }
  }

  const project = check(parseContent(projectSchema, { ...fields, slug, photos }));
  const deletes = (existing?.photos ?? []).filter((p) => !photos.includes(p)).map(photoFile);
  const next = existing ? list.map((p) => (p.slug === slug ? project : p)) : [project, ...list];
  return {
    list: next,
    files,
    deletes,
    slug,
    message: existing ? `Proiect modificat: ${project.title}` : `Proiect nou: ${project.title}`,
  };
}

export function deleteProject(list: Project[], slug: string): { list: Project[]; deletes: string[]; message: string } {
  const project = list.find((p) => p.slug === slug);
  if (!project) throw new ValidationError([{ path: '', message: 'Proiectul nu mai există.' }]);
  return {
    list: list.filter((p) => p.slug !== slug),
    deletes: project.photos.map(photoFile),
    message: `Proiect șters: ${project.title}`,
  };
}

export function reorderProjects(list: Project[], order: string[], featured: Record<string, boolean>): Project[] {
  const bySlug = new Map(list.map((p) => [p.slug, p]));
  const same = order.length === list.length && new Set(order).size === order.length && order.every((s) => bySlug.has(s));
  if (!same) {
    throw new ValidationError([{ path: '', message: 'Lista de proiecte s-a schimbat între timp. Reîncarcă pagina.' }]);
  }
  return order.map((s) => {
    const p = bySlug.get(s)!;
    return { ...p, featured: featured[s] ?? p.featured };
  });
}
```

- [ ] **Step 7: Pozele de pagină**

`admin/src/lib/page-photos.ts`:

```ts
import { IMAGE_DIRS, PAGE_PHOTO_KEYS, type PagePhotoKey, type PagePhotos } from '@site/content/schema';
import { ValidationError } from './content';
import type { FileChange } from './github';

export type PagePhotoSlot = PagePhotoKey | 'atelier';

export const PAGE_PHOTO_SLOTS: PagePhotoSlot[] = [...PAGE_PHOTO_KEYS, 'atelier'];

export const PAGE_PHOTO_LABELS: Record<PagePhotoSlot, string> = {
  bucatarii: 'Bucătării',
  dressing: 'Dressinguri',
  living: 'Living',
  dormitor: 'Dormitor',
  bai: 'Băi',
  comercial: 'Spații comerciale',
  atelier: 'Atelier',
};

const isSlot = (s: string): s is PagePhotoSlot => (PAGE_PHOTO_SLOTS as string[]).includes(s);

/** Folderul din repo: placile de categorii stau in services/, poza atelierului in workshop/. */
export const slotDir = (slot: PagePhotoSlot) => (slot === 'atelier' ? IMAGE_DIRS.workshop : IMAGE_DIRS.services);

/** Acelasi folder, relativ la src/assets/images, pentru ruta /media. */
export const slotFolder = (slot: PagePhotoSlot) => (slot === 'atelier' ? 'workshop' : 'services');

export const currentFile = (photos: PagePhotos, slot: PagePhotoSlot) =>
  slot === 'atelier' ? photos.atelier : photos.categories[slot];

export async function buildPagePhotosSave(input: {
  current: PagePhotos;
  uploads: Map<string, Buffer>;
  prepare: (b: Buffer) => Promise<Buffer>;
  newId: () => string;
}): Promise<{ value: PagePhotos; files: FileChange[]; deletes: string[]; message: string }> {
  const value: PagePhotos = { categories: { ...input.current.categories }, atelier: input.current.atelier };
  const files: FileChange[] = [];
  const deletes: string[] = [];
  const changed: PagePhotoSlot[] = [];

  for (const [slot, buffer] of input.uploads) {
    if (!isSlot(slot)) throw new ValidationError([{ path: '', message: 'Poză necunoscută. Reîncarcă pagina.' }]);
    const name = `${slot}-${input.newId()}.jpg`;
    files.push({ path: `${slotDir(slot)}/${name}`, content: await input.prepare(buffer) });
    deletes.push(`${slotDir(slot)}/${currentFile(input.current, slot)}`);
    if (slot === 'atelier') value.atelier = name;
    else value.categories[slot] = name;
    changed.push(slot);
  }

  if (!changed.length) throw new ValidationError([{ path: '', message: 'Nu ai schimbat nicio poză.' }]);
  return { value, files, deletes, message: `Poze pagini: ${changed.map((s) => PAGE_PHOTO_LABELS[s]).join(', ')}` };
}
```

- [ ] **Step 8: Rulează testele și confirmă că trec**

Run: `npx vitest run && npx astro check`
Expected: toate testele adminului trec (4 env + 7 auth + 8 depozit + 3 conținut + 5 poze + 4 adrese și formatări + 9 proiecte + 2 poze pagini), `0 errors`.

- [ ] **Step 9: Commit**

```bash
cd ..
git add src/content/schema.ts tests/schema.test.ts admin/src/lib admin/tests
git commit -m "feat(admin): salvarea continutului, prelucrarea pozelor si logica proiectelor"
```

---

### Task 13: Formulare și bara de publicare

**Files:**
- Create: `admin/src/lib/form-data.ts`, `admin/src/lib/http.ts`, `admin/tests/form-data.test.ts`
- Create: `admin/src/components/Field.astro`, `Repeater.astro`, `RowTools.astro`, `SaveBar.astro`
- Create: `admin/src/scripts/form.ts`, `admin/src/scripts/status.ts`, `admin/src/scripts/downscale.ts`
- Create: `admin/src/pages/api/status.ts`, `admin/src/pages/media/[...path].ts`
- Modify: `admin/src/layouts/Admin.astro` (încarcă `status.ts`)

**Interfaces:**
- Consumes: `ValidationError` (Task 12), `ImageError`, `thumbnail` (Task 12), `GitHubError`, `repo()` (Task 11).
- Produces:
  - `form-data.ts`: `buildObject(entries: Iterable<[string, unknown]>): Record<string, unknown>`, `toLines(s)`, `toParagraphs(s)`;
  - `http.ts`: `json(data, status?)`, `errorResponse(e)`;
  - componente: `<Field label name? row? value? type? kind? options? hint? rows? max? min? wide? />`, `<Repeater name addLabel>` cu slot implicit (rândurile) și slotul `template` (un rând gol), `<RowTools />`, `<SaveBar label? />`;
  - `form.ts`: `markDirty()`, `markClean()`, `reindex(root)`, `initRepeaters(root)`, `serialize(form): [string, unknown][]`, `showIssues(form, issues)`, `setMessage(form, text, error?)`, `initSaveForm(form, { body?, onSaved? })`, `SaveResult { ok; sha?; slug?; error?; issues? }`; formularele cu `data-save-form` se inițializează singure;
  - `status.ts`: `startStatus(sha, view?)`; reia urmărirea din `sessionStorage` sau din `?publicat=<sha>&vezi=<cale>`;
  - `downscale(file: File, max?): Promise<Blob>`;
  - `GET /api/status?sha=<40 hex>` -> `{ ok: true, state }`;
  - `GET /media/<projects|services|workshop>/<cale>` -> miniatură JPEG de 480 px.

Convenții pentru câmpuri, folosite de toate ecranele:
- câmpurile fixe au `name` complet, de exemplu `phoneDisplay` sau `googleRating.count`;
- câmpurile din rânduri repetabile au doar `data-name` (de exemplu `days`); scriptul pune `name="hours.0.days"` după ordinea din pagină;
- `data-kind="number"` trimite număr, `lines` trimite câte un element pe linie, `paragraphs` trimite paragrafe despărțite de un rând gol; bifele trimit `true`/`false`;
- o eroare cu calea `x.y` apare sub câmpul cu `name="x.y"` sau în elementul cu `data-error-for="x.y"`; restul apar în bara de salvare.

- [ ] **Step 1: Scrie testul care pică**

`admin/tests/form-data.test.ts`:

```ts
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
```

Run: `npx vitest run tests/form-data.test.ts`
Expected: FAIL, modulul lipsește.

- [ ] **Step 2: Formular -> obiect**

`admin/src/lib/form-data.ts`:

```ts
type Node = Record<string | number, unknown>;

/** Perechile nume/valoare dintr-un formular devin obiect: „hours.0.days” -> { hours: [{ days }] }. */
export function buildObject(entries: Iterable<[string, unknown]>): Record<string, unknown> {
  const root: Node = {};
  for (const [name, value] of entries) setPath(root, name.split('.'), value);
  return compact(root) as Record<string, unknown>;
}

function setPath(node: Node, keys: string[], value: unknown): void {
  let cur: Node = node;
  keys.forEach((k, i) => {
    const key = /^\d+$/.test(k) ? Number(k) : k;
    if (i === keys.length - 1) {
      cur[key] = value;
      return;
    }
    cur[key] ??= /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[key] as Node;
  });
}

// Randurile sterse lasa goluri in liste; le inchidem.
function compact(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((v) => v !== undefined).map(compact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, compact(v)]));
  }
  return value;
}

export const toLines = (s: string): string[] =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const toParagraphs = (s: string): string[] =>
  s
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
```

Run: `npx vitest run tests/form-data.test.ts`
Expected: PASS, 4 teste.

- [ ] **Step 3: Răspunsurile API**

`admin/src/lib/http.ts`:

```ts
import { ValidationError } from './content';
import { GitHubError } from './github';
import { ImageError } from './images';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

/** Erorile cunoscute devin mesaje pentru client; restul se scriu in log. */
export function errorResponse(e: unknown): Response {
  if (e instanceof ValidationError) return json({ ok: false, error: 'Verifică câmpurile marcate.', issues: e.issues }, 422);
  if (e instanceof ImageError) return json({ ok: false, error: e.message, issues: [{ path: 'photos', message: e.message }] }, 422);
  if (e instanceof SyntaxError) return json({ ok: false, error: 'Datele au ajuns greșit. Reîncarcă pagina.' }, 400);
  console.error(e);
  if (e instanceof GitHubError) {
    return json({ ok: false, error: 'Nu am putut salva pe GitHub. Încearcă din nou peste un minut.' }, 502);
  }
  return json({ ok: false, error: 'A apărut o eroare neașteptată. Încearcă din nou.' }, 500);
}
```

- [ ] **Step 4: Componentele de formular**

`admin/src/components/Field.astro`:

```astro
---
interface Props {
  label: string;
  /** Numele complet, pentru campurile fixe. */
  name?: string;
  /** Numele relativ la randul repetabil; numele complet il pune scriptul. */
  row?: string;
  value?: string | number;
  type?: 'text' | 'email' | 'url' | 'number' | 'textarea' | 'select';
  /** Cum se citeste valoarea: numar, cate o linie pe element, paragrafe despartite de un rand gol. */
  kind?: 'number' | 'lines' | 'paragraphs';
  options?: { value: string; label: string }[];
  hint?: string;
  rows?: number;
  max?: number;
  min?: number;
  /** Pe toata latimea randului, in randurile repetabile. */
  wide?: boolean;
}

const { label, name, row, value = '', type = 'text', kind, options = [], hint, rows = 4, max, min, wide = false } = Astro.props;
const attrs = { name, 'data-name': row, 'data-kind': kind ?? (type === 'number' ? 'number' : undefined) };
---

<label class:list={['field', wide && 'field--wide']}>
  <span class="field__label">{label}</span>
  {
    type === 'textarea' ? (
      <textarea {...attrs} rows={rows} maxlength={max}>{value}</textarea>
    ) : type === 'select' ? (
      <select {...attrs}>
        {options.map((o) => (
          <option value={o.value} selected={o.value === value}>
            {o.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        {...attrs}
        type={type}
        value={value}
        maxlength={type === 'number' ? undefined : max}
        min={type === 'number' ? min : undefined}
        max={type === 'number' ? max : undefined}
        inputmode={type === 'number' ? 'numeric' : undefined}
      />
    )
  }
  {hint && <span class="field__hint">{hint}</span>}
  <span class="field__error" hidden></span>
</label>
```

`admin/src/components/Repeater.astro`:

```astro
---
interface Props {
  /** Numele listei in datele trimise: „hours”, „specs”, „items”. */
  name: string;
  addLabel: string;
}

const { name, addLabel } = Astro.props;
---

<div class="repeater" data-repeater={name}>
  <div class="repeater__rows" data-rows><slot /></div>
  <template data-template><slot name="template" /></template>
  <button type="button" class="btn btn--ghost btn--small" data-add>{addLabel}</button>
  <p class="field__error" data-error-for={name} hidden></p>
</div>
```

`admin/src/components/RowTools.astro`:

```astro
<div class="row__tools">
  <button type="button" class="btn btn--ghost btn--small" data-up>Sus</button>
  <button type="button" class="btn btn--ghost btn--small" data-down>Jos</button>
  <button type="button" class="btn btn--danger btn--small" data-remove>Șterge</button>
</div>
```

`admin/src/components/SaveBar.astro`:

```astro
---
interface Props {
  label?: string;
}

const { label = 'Salvează și publică' } = Astro.props;
---

<div class="savebar">
  <p class="savebar__msg" data-save-msg aria-live="polite"></p>
  <a href="" class="btn btn--ghost" data-discard>Renunță</a>
  <button type="submit" class="btn" data-save>{label}</button>
</div>
```

- [ ] **Step 5: Scriptul formularelor**

`admin/src/scripts/form.ts`:

```ts
import { buildObject, toLines, toParagraphs } from '../lib/form-data';
import { startStatus } from './status';

export interface Issue {
  path: string;
  message: string;
}

export interface SaveResult {
  ok: boolean;
  sha?: string;
  slug?: string;
  error?: string;
  issues?: Issue[];
}

let dirty = false;
export const markDirty = () => {
  dirty = true;
};
export const markClean = () => {
  dirty = false;
};

window.addEventListener('beforeunload', (e) => {
  if (dirty) e.preventDefault();
});
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-discard]')) dirty = false;
});

function reindexOne(rep: HTMLElement): void {
  const rows = rep.querySelector<HTMLElement>('[data-rows]');
  if (!rows) return;
  [...rows.children].forEach((row, i) => {
    row.querySelectorAll<HTMLInputElement>('[data-name]').forEach((el) => {
      el.name = `${rep.dataset.repeater}.${i}.${el.dataset.name}`;
    });
  });
}

/** Pune numele complete pe campurile din randurile repetabile, in ordinea din pagina. */
export function reindex(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-repeater]').forEach(reindexOne);
}

export function initRepeaters(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-repeater]').forEach((rep) => {
    const rows = rep.querySelector<HTMLElement>('[data-rows]')!;
    const template = rep.querySelector<HTMLTemplateElement>('template[data-template]')!;

    rep.querySelector('[data-add]')?.addEventListener('click', () => {
      rows.append(template.content.cloneNode(true));
      reindexOne(rep);
      markDirty();
      rows.lastElementChild?.querySelector<HTMLElement>('input, textarea, select')?.focus();
    });

    rows.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      const row = btn?.closest<HTMLElement>('[data-row]');
      if (!btn || !row) return;
      if (btn.matches('[data-remove]')) row.remove();
      else if (btn.matches('[data-up]') && row.previousElementSibling) row.previousElementSibling.before(row);
      else if (btn.matches('[data-down]') && row.nextElementSibling) row.nextElementSibling.after(row);
      else return;
      reindexOne(rep);
      markDirty();
    });

    reindexOne(rep);
  });
}

/** Valorile formularului, cu tipul potrivit; listele goale apar ca [] ca sa se poata salva goale. */
export function serialize(form: HTMLFormElement): [string, unknown][] {
  reindex(form);
  const out: [string, unknown][] = [];
  form.querySelectorAll<HTMLElement>('[data-repeater]').forEach((rep) => out.push([rep.dataset.repeater!, []]));
  const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input[name], textarea[name], select[name]',
  );
  for (const el of fields) {
    if (el.disabled || (el instanceof HTMLInputElement && el.type === 'file')) continue;
    const kind = el.dataset.kind;
    const value =
      el instanceof HTMLInputElement && el.type === 'checkbox'
        ? el.checked
        : kind === 'number'
          ? el.value.trim() === ''
            ? null
            : Number(el.value)
          : kind === 'lines'
            ? toLines(el.value)
            : kind === 'paragraphs'
              ? toParagraphs(el.value)
              : el.value;
    out.push([el.name, value]);
  }
  return out;
}

export function setMessage(form: HTMLFormElement, text: string, error = false): void {
  const msg = form.querySelector<HTMLElement>('[data-save-msg]');
  if (!msg) return;
  msg.textContent = text;
  msg.classList.toggle('is-error', error);
}

/** Erorile apar sub campul lor; cele fara camp, in bara de salvare. */
export function showIssues(form: HTMLFormElement, issues: Issue[]): void {
  form.querySelectorAll('.field.has-error').forEach((f) => f.classList.remove('has-error'));
  form.querySelectorAll<HTMLElement>('.field__error').forEach((e) => {
    e.hidden = true;
    e.textContent = '';
  });

  const loose: string[] = [];
  let first: HTMLElement | null = null;
  for (const issue of issues) {
    const input = issue.path ? form.querySelector<HTMLElement>(`[name="${CSS.escape(issue.path)}"]`) : null;
    const field = input?.closest<HTMLElement>('.field');
    const box = field?.querySelector<HTMLElement>('.field__error') ?? form.querySelector<HTMLElement>(`[data-error-for="${CSS.escape(issue.path)}"]`);
    if (!box) {
      loose.push(issue.message);
      continue;
    }
    field?.classList.add('has-error');
    box.textContent = issue.message;
    box.hidden = false;
    first ??= input ?? box;
  }
  if (loose.length) setMessage(form, loose.join(' '), true);
  first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement || first instanceof HTMLSelectElement) first.focus({ preventScroll: true });
}

function send(url: string, body: XMLHttpRequestBodyInit, isJson: boolean, onProgress?: (p: number) => void): Promise<SaveResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (isJson) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status === 401) resolve({ ok: false, error: 'Sesiunea a expirat. Reîncarcă pagina și intră din nou în cont.' });
      else resolve((xhr.response as SaveResult | null) ?? { ok: false, error: `Eroare ${xhr.status}. Încearcă din nou.` });
    };
    xhr.onerror = () => reject(new Error('retea'));
    xhr.send(body);
  });
}

interface SaveOptions {
  /** Corpul cererii; implicit, JSON-ul formularului. */
  body?: (form: HTMLFormElement) => Promise<{ body: XMLHttpRequestBodyInit; json: boolean }>;
  /** Ce se intampla dupa salvare; implicit porneste bara de publicare. */
  onSaved?: (result: SaveResult) => void;
}

export function initSaveForm(form: HTMLFormElement, opts: SaveOptions = {}): void {
  const button = form.querySelector<HTMLButtonElement>('[data-save]');
  form.addEventListener('input', markDirty);
  form.addEventListener('change', markDirty);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (button?.disabled) return;
    if (button) button.disabled = true;
    setMessage(form, 'Se salvează…');
    try {
      const payload = opts.body
        ? await opts.body(form)
        : { body: JSON.stringify(buildObject(serialize(form))), json: true };
      const result = await send(form.action, payload.body, payload.json, payload.json
        ? undefined
        : (p) => setMessage(form, p < 1 ? `Se urcă pozele: ${Math.round(p * 100)}%` : 'Se pregătesc pozele…'));
      if (result.ok && result.sha) {
        markClean();
        showIssues(form, []);
        setMessage(form, '');
        if (opts.onSaved) opts.onSaved(result);
        else startStatus(result.sha, form.dataset.view);
      } else {
        showIssues(form, result.issues ?? []);
        setMessage(form, result.error ?? 'Nu s-a putut salva.', true);
      }
    } catch {
      setMessage(form, 'Nu s-a putut trimite. Verifică conexiunea la internet și încearcă din nou.', true);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-save-form]').forEach((form) => {
  initRepeaters(form);
  initSaveForm(form);
});
```

- [ ] **Step 6: Bara de publicare**

`admin/src/scripts/status.ts`:

```ts
type State = 'pending' | 'success' | 'failure' | 'slow';

interface Job {
  sha: string;
  view?: string;
  at: number;
}

const KEY = 'lox-publish';
const POLL_MS = 4000;
const SLOW_MS = 6 * 60_000;
const SHA = /^[0-9a-f]{40}$/;

const bar = document.querySelector<HTMLElement>('[data-status]');
const siteUrl = document.body.dataset.siteUrl ?? '';
let timer = 0;

const TEXT: Record<State, string> = {
  pending: 'Se publică. Durează cam un minut.',
  success: 'Publicat.',
  failure: 'Nu s-a publicat. Site-ul a rămas cum era. Încearcă din nou sau scrie-ne.',
  slow: 'Publicarea durează mai mult decât de obicei. Verifică site-ul peste câteva minute.',
};

function render(state: State, job: Job): void {
  if (!bar) return;
  bar.dataset.state = state;
  bar.hidden = false;
  const dot = Object.assign(document.createElement('span'), { className: 'status__dot' });
  const text = Object.assign(document.createElement('span'), { textContent: TEXT[state] });
  bar.replaceChildren(dot, text);
  if (state === 'success') {
    const a = Object.assign(document.createElement('a'), { href: `${siteUrl}${job.view ?? '/'}`, target: '_blank', rel: 'noopener', textContent: 'Vezi pe site' });
    bar.append(a);
  }
  if (state !== 'pending') {
    const close = Object.assign(document.createElement('button'), { type: 'button', className: 'linklike status__close', textContent: 'Închide' });
    close.addEventListener('click', () => (bar.hidden = true));
    bar.append(close);
  }
}

function finish(): void {
  clearTimeout(timer);
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* fara sessionStorage, urmarirea se opreste la schimbarea paginii */
  }
}

async function tick(job: Job): Promise<void> {
  if (Date.now() - job.at > SLOW_MS) {
    finish();
    render('slow', job);
    return;
  }
  try {
    const res = await fetch(`/api/status?sha=${job.sha}`);
    const data = (await res.json()) as { state?: State };
    if (data.state === 'success' || data.state === 'failure') {
      finish();
      render(data.state, job);
      return;
    }
  } catch {
    /* reincercam la urmatorul pas */
  }
  timer = window.setTimeout(() => tick(job), POLL_MS);
}

export function startStatus(sha: string, view?: string): void {
  const job: Job = { sha, view, at: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(job));
  } catch {
    /* continuam doar pe pagina curenta */
  }
  clearTimeout(timer);
  render('pending', job);
  void tick(job);
}

// O publicare pornita inainte de o schimbare de pagina continua sa fie urmarita.
const params = new URLSearchParams(location.search);
const fromUrl = params.get('publicat');
if (fromUrl && SHA.test(fromUrl)) {
  history.replaceState(null, '', location.pathname);
  startStatus(fromUrl, params.get('vezi') ?? undefined);
} else {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const job = JSON.parse(saved) as Job;
      if (SHA.test(job.sha)) {
        render('pending', job);
        void tick(job);
      }
    }
  } catch {
    /* nimic de reluat */
  }
}
```

În `admin/src/layouts/Admin.astro`, în `<script>` adaugă `import '../scripts/status.ts';` după `import '../scripts/shell.ts';`.

`admin/src/scripts/downscale.ts`:

```ts
/**
 * Micsoreaza poza in browser inainte de upload (economie de date pe telefon): maximum 2400 px,
 * JPEG 0,9. Serverul o prelucreaza oricum din nou. Daca browserul nu o poate citi, trimite originalul.
 */
export async function downscale(file: File, max = 2400): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.9),
  );
}
```

- [ ] **Step 7: Rutele de stare și miniaturi**

`admin/src/pages/api/status.ts`:

```ts
import type { APIRoute } from 'astro';
import { json } from '../../lib/http';
import { repo } from '../../lib/repo';

export const GET: APIRoute = async ({ url }) => {
  const sha = url.searchParams.get('sha') ?? '';
  if (!/^[0-9a-f]{40}$/.test(sha)) return json({ ok: false }, 400);
  try {
    return json({ ok: true, state: await repo().runState(sha) });
  } catch {
    // GitHub nu raspunde acum; bara mai intreaba peste cateva secunde.
    return json({ ok: true, state: 'pending' });
  }
};
```

`admin/src/pages/media/[...path].ts`:

```ts
import type { APIRoute } from 'astro';
import { thumbnail } from '../../lib/images';
import { repo } from '../../lib/repo';

const ALLOWED = /^(projects|services|workshop)\/[a-z0-9-]+(\/[a-z0-9-]+)?\.(jpg|jpeg|png|webp)$/;
const MAX_CACHED = 300;
const cache = new Map<string, Uint8Array>();

// Numele pozelor sunt unice (fiecare upload primeste un id nou), deci o miniatura nu se schimba niciodata.
export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? '';
  if (!ALLOWED.test(path)) return new Response('Nu există.', { status: 404 });

  let image = cache.get(path);
  if (!image) {
    try {
      image = new Uint8Array(await thumbnail(await repo().readBytes(`src/assets/images/${path}`)));
    } catch {
      return new Response('Nu există.', { status: 404 });
    }
    if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
    cache.set(path, image);
  }
  return new Response(image, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable' } });
};
```

- [ ] **Step 8: Verifică**

Run: `npx vitest run && npx astro check && npm run build`
Expected: toate testele trec, `0 errors`, build reușit.

Cu `npm run dev` pornit și cookie-ul din Task 10 (`/tmp/lox-cookie`):

```bash
curl -s -b /tmp/lox-cookie -o /tmp/thumb.jpg -w '%{http_code} %{content_type}\n' localhost:4400/media/projects/bucatarie-in-l/01.jpg
python3 -c "from PIL import Image; print(Image.open('/tmp/thumb.jpg').size)"
curl -s -b /tmp/lox-cookie -o /dev/null -w '%{http_code}\n' "localhost:4400/media/..%2F..%2Fpackage.json"
curl -s -b /tmp/lox-cookie "localhost:4400/api/status?sha=$(git -C /tmp/lox-local rev-parse HEAD)"
```

Expected: `200 image/jpeg`; `(480, ...)`; `404`; `{"ok":true,"state":"pending"}` (commit-ul nu a fost făcut de admin, deci modul local nu îl știe).

- [ ] **Step 9: Commit**

```bash
cd ..
git add admin/src admin/tests
git commit -m "feat(admin): formulare cu randuri repetabile, bara de publicare si miniaturi"
```

---
### Task 14: Ecranele simple: Contact, Cifre, Recenzii, Texte categorii

**Files:**
- Create: `admin/src/components/rows/HoursRow.astro`, `SocialRow.astro`, `ReviewRow.astro`, `BodyRow.astro`
- Create: `admin/src/pages/contact.astro`, `cifre.astro`, `recenzii.astro`, `categorii/index.astro`, `categorii/[key].astro`
- Create: `admin/src/pages/api/save/[key].ts`, `admin/src/pages/api/save/categorii/[key].ts`

**Interfaces:**
- Consumes: `Field`, `Repeater`, `RowTools`, `SaveBar`, `form.ts` (Task 13); `readContent`, `saveContent`, `check` (Task 12); `repo()`, `author()` (Task 11); `formatPhone` (Task 12); din schemă: `contactSchema`, `statsSchema`, `reviewsFormSchema`, `themeSchema`, `categoryFormSchema`, `CATEGORY_KEYS`, `CATEGORY_LABELS`, `parseContent`.
- Produces: `POST /api/save/contact|cifre|recenzii|culori` (JSON -> `{ ok, sha }` sau `422 { ok: false, error, issues }`); `POST /api/save/categorii/<cheie>`. Ruta `culori` e folosită de ecranul Aspect (Task 18).

- [ ] **Step 1: Rândurile repetabile**

`admin/src/components/rows/HoursRow.astro`:

```astro
---
import Field from '../Field.astro';
import RowTools from '../RowTools.astro';

interface Props {
  days?: string;
  time?: string;
}

const { days = '', time = '' } = Astro.props;
---

<div class="row" data-row>
  <div class="row__fields">
    <Field label="Zile" row="days" value={days} max={40} />
    <Field label="Ore" row="time" value={time} max={40} />
  </div>
  <RowTools />
</div>
```

`admin/src/components/rows/SocialRow.astro`:

```astro
---
import Field from '../Field.astro';
import RowTools from '../RowTools.astro';

interface Props {
  label?: string;
  href?: string;
}

const { label = '', href = '' } = Astro.props;
---

<div class="row" data-row>
  <div class="row__fields">
    <Field label="Rețea" row="label" value={label} max={30} hint="De exemplu Facebook sau Instagram." />
    <Field label="Link" row="href" type="url" value={href} hint="Adresa paginii, cu https://" />
  </div>
  <RowTools />
</div>
```

`admin/src/components/rows/ReviewRow.astro`:

```astro
---
import Field from '../Field.astro';
import RowTools from '../RowTools.astro';

interface Props {
  author?: string;
  project?: string;
  text?: string;
}

const { author = '', project = '', text = '' } = Astro.props;
---

<div class="row" data-row>
  <div class="row__fields">
    <Field label="Nume" row="author" value={author} max={60} hint="Cum semnează clientul, de exemplu Andreea M." />
    <Field label="Proiect" row="project" value={project} max={80} />
    <Field label="Recenzie" row="text" type="textarea" value={text} max={600} rows={4} wide />
  </div>
  <RowTools />
</div>
```

`admin/src/components/rows/BodyRow.astro`:

```astro
---
import Field from '../Field.astro';
import RowTools from '../RowTools.astro';

interface Props {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

const { heading = '', paragraphs = [], list = [] } = Astro.props;
---

<div class="row" data-row>
  <div class="row__fields">
    <Field label="Titlul blocului" row="heading" value={heading} max={120} wide />
    <Field
      label="Text"
      row="paragraphs"
      type="textarea"
      kind="paragraphs"
      rows={6}
      value={paragraphs.join('\n\n')}
      hint="Un rând gol începe un paragraf nou."
      wide
    />
    <Field
      label="Listă"
      row="list"
      type="textarea"
      kind="lines"
      rows={4}
      value={list.join('\n')}
      hint="Opțională. Câte un element pe rând."
      wide
    />
  </div>
  <RowTools />
</div>
```

- [ ] **Step 2: Contact și program**

`admin/src/pages/contact.astro`:

```astro
---
import Admin from '../layouts/Admin.astro';
import Field from '../components/Field.astro';
import Repeater from '../components/Repeater.astro';
import SaveBar from '../components/SaveBar.astro';
import HoursRow from '../components/rows/HoursRow.astro';
import SocialRow from '../components/rows/SocialRow.astro';
import { readContent } from '../lib/content';
import { formatPhone } from '../lib/format';
import { repo } from '../lib/repo';

const c = await readContent(repo(), 'contact');
---

<Admin title="Contact și program" section="contact">
  <div class="page-head">
    <div>
      <h1>Contact și program</h1>
      <p>Apar în antet, în subsol, pe pagina de contact și în butoanele de WhatsApp.</p>
    </div>
  </div>

  <form action="/api/save/contact" data-save-form data-view="/contact" novalidate>
    <section class="panel">
      <h2 class="panel__title">Telefon și email</h2>
      <div class="fields fields--2">
        <Field label="Telefon" name="phoneDisplay" value={c.phoneDisplay} hint="Cum vrei să apară pe site, de exemplu 0740 000 000." />
        <Field label="WhatsApp" name="whatsappNumber" value={formatPhone(c.whatsappNumber)} hint="Numărul pe care primești mesajele din formulare." />
        <Field label="Email" name="email" type="email" value={c.email} />
      </div>
    </section>

    <section class="panel">
      <h2 class="panel__title">Atelier</h2>
      <div class="fields">
        <Field label="Adresă" name="address" value={c.address} max={120} />
        <Field
          label="Link Google Maps"
          name="mapsUrl"
          type="url"
          value={c.mapsUrl}
          hint="În Google Maps caută atelierul, apasă Distribuie și copiază linkul."
        />
      </div>
    </section>

    <section class="panel">
      <h2 class="panel__title">Program</h2>
      <Repeater name="hours" addLabel="Adaugă un rând">
        {c.hours.map((h) => <HoursRow days={h.days} time={h.time} />)}
        <HoursRow slot="template" />
      </Repeater>
    </section>

    <section class="panel">
      <h2 class="panel__title">Rețele sociale și recenzii Google</h2>
      <Repeater name="social" addLabel="Adaugă o rețea">
        {c.social.map((s) => <SocialRow label={s.label} href={s.href} />)}
        <SocialRow slot="template" />
      </Repeater>
      <div class="fields" style="margin-top: 16px">
        <Field
          label="Link spre recenziile Google"
          name="googleReviewsUrl"
          type="url"
          value={c.googleReviewsUrl}
          hint="Lasă # cât timp nu ai profil de firmă pe Google."
        />
      </div>
    </section>

    <SaveBar />
  </form>
</Admin>

<script>
  import '../scripts/form.ts';
</script>
```

Toate formularele adminului au `novalidate`: validarea o face schema, cu mesaje în română, iar browserul nu blochează valori ca `#` într-un câmp `type="url"`.

- [ ] **Step 3: Cifre**

`admin/src/pages/cifre.astro`:

```astro
---
import Admin from '../layouts/Admin.astro';
import Field from '../components/Field.astro';
import SaveBar from '../components/SaveBar.astro';
import { readContent } from '../lib/content';
import { repo } from '../lib/repo';

const s = await readContent(repo(), 'stats');
---

<Admin title="Cifre" section="cifre">
  <div class="page-head">
    <div>
      <h1>Cifre</h1>
      <p>Cele trei cifre de pe prima pagină și din Despre noi, plus nota de pe Google de lângă recenzii.</p>
    </div>
  </div>

  <form action="/api/save/cifre" data-save-form data-view="/" novalidate>
    <section class="panel">
      <h2 class="panel__title">Cifrele atelierului</h2>
      <div class="fields">
        {
          s.stats.map((stat, i) => (
            <div class="fields fields--2">
              <Field label={`Cifra ${i + 1}`} name={`stats.${i}.value`} value={stat.value} max={12} hint="Scurt: 12, 340+, 2 mm." />
              <Field label="Ce înseamnă" name={`stats.${i}.label`} value={stat.label} max={60} />
            </div>
          ))
        }
      </div>
    </section>

    <section class="panel">
      <h2 class="panel__title">Nota de pe Google</h2>
      <div class="fields fields--2">
        <Field label="Nota" name="googleRating.score" value={s.googleRating.score} hint="De exemplu 4,9." />
        <Field label="Număr de recenzii" name="googleRating.count" type="number" min={0} value={s.googleRating.count} />
      </div>
    </section>

    <SaveBar />
  </form>
</Admin>

<script>
  import '../scripts/form.ts';
</script>
```

- [ ] **Step 4: Recenzii**

`admin/src/pages/recenzii.astro`:

```astro
---
import Admin from '../layouts/Admin.astro';
import Repeater from '../components/Repeater.astro';
import SaveBar from '../components/SaveBar.astro';
import ReviewRow from '../components/rows/ReviewRow.astro';
import { readContent } from '../lib/content';
import { repo } from '../lib/repo';

const reviews = await readContent(repo(), 'reviews');
---

<Admin title="Recenzii" section="recenzii">
  <div class="page-head">
    <div>
      <h1>Recenzii</h1>
      <p>Apar pe prima pagină și pe paginile de proiect, în ordinea de aici.</p>
    </div>
  </div>

  <form action="/api/save/recenzii" data-save-form data-view="/" novalidate>
    <section class="panel">
      <Repeater name="items" addLabel="Adaugă o recenzie">
        {reviews.map((r) => <ReviewRow author={r.author} project={r.project} text={r.text} />)}
        <ReviewRow slot="template" />
      </Repeater>
    </section>
    <SaveBar />
  </form>
</Admin>

<script>
  import '../scripts/form.ts';
</script>
```

- [ ] **Step 5: Texte categorii**

`admin/src/pages/categorii/index.astro`:

```astro
---
import Admin from '../../layouts/Admin.astro';
import { CATEGORY_LABELS } from '@site/content/schema';
import { readContent } from '../../lib/content';
import { repo } from '../../lib/repo';

const pages = await readContent(repo(), 'categories');
---

<Admin title="Texte categorii" section="categorii">
  <div class="page-head">
    <div>
      <h1>Texte categorii</h1>
      <p>Titlul, introducerea și textul de sub catalog, pe fiecare pagină de categorie.</p>
    </div>
  </div>

  <ul class="list">
    {
      pages.map((p) => (
        <li class="item" style="grid-template-columns: minmax(0, 1fr) auto">
          <div>
            <a class="item__title" href={`/categorii/${p.key}`}>{CATEGORY_LABELS[p.key]}</a>
            <p class="item__meta">{p.title}. {p.lead}</p>
          </div>
          <a class="btn btn--ghost btn--small" href={`/categorii/${p.key}`}>Editează</a>
        </li>
      ))
    }
  </ul>
</Admin>
```

`admin/src/pages/categorii/[key].astro`:

```astro
---
import Admin from '../../layouts/Admin.astro';
import Field from '../../components/Field.astro';
import Repeater from '../../components/Repeater.astro';
import SaveBar from '../../components/SaveBar.astro';
import BodyRow from '../../components/rows/BodyRow.astro';
import { CATEGORY_LABELS } from '@site/content/schema';
import { readContent } from '../../lib/content';
import { repo } from '../../lib/repo';

const pages = await readContent(repo(), 'categories');
const page = pages.find((p) => p.key === Astro.params.key);
if (!page) return Astro.redirect('/categorii');
const label = CATEGORY_LABELS[page.key];
---

<Admin title={`Texte: ${label}`} section="categorii">
  <div class="page-head">
    <div>
      <p class="crumb"><a href="/categorii">Texte categorii</a></p>
      <h1>{label}</h1>
    </div>
  </div>

  <form action={`/api/save/categorii/${page.key}`} data-save-form data-view={`/mobilier/${page.key}`} novalidate>
    <section class="panel">
      <h2 class="panel__title">Antetul paginii</h2>
      <div class="fields">
        <Field label="Titlu" name="title" value={page.title} max={80} />
        <Field label="Introducere" name="lead" type="textarea" rows={2} value={page.lead} max={200} hint="O frază scurtă, sub titlu." />
      </div>
    </section>

    <section class="panel">
      <h2 class="panel__title">Textul de sub catalog</h2>
      <Repeater name="body" addLabel="Adaugă un bloc de text">
        {page.body.map((b) => <BodyRow heading={b.heading} paragraphs={b.paragraphs} list={b.list} />)}
        <BodyRow slot="template" />
      </Repeater>
    </section>

    <SaveBar />
  </form>
</Admin>

<script>
  import '../../scripts/form.ts';
</script>
```

- [ ] **Step 6: Rutele de salvare**

`admin/src/pages/api/save/[key].ts`:

```ts
import type { APIRoute } from 'astro';
import { contactSchema, parseContent, reviewsFormSchema, statsSchema, themeSchema } from '@site/content/schema';
import { check, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { author, repo } from '../../../lib/repo';

// Ecranele care salveaza un fisier intreg: contact, cifre, recenzii, culori.
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const body: unknown = await request.json();
    const opts = (message: string) => ({ message, author: author(locals.user!) });
    let sha: string;
    switch (params.key) {
      case 'contact':
        sha = await saveContent(repo(), 'contact', check(parseContent(contactSchema, body)), opts('Contact și program'));
        break;
      case 'cifre':
        sha = await saveContent(repo(), 'stats', check(parseContent(statsSchema, body)), opts('Cifre'));
        break;
      case 'recenzii':
        sha = await saveContent(repo(), 'reviews', check(parseContent(reviewsFormSchema, body)).items, opts('Recenzii'));
        break;
      case 'culori':
        sha = await saveContent(repo(), 'theme', check(parseContent(themeSchema, body)), opts('Culori'));
        break;
      default:
        return json({ ok: false, error: 'Ecran necunoscut.' }, 404);
    }
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
```

`admin/src/pages/api/save/categorii/[key].ts`:

```ts
import type { APIRoute } from 'astro';
import { CATEGORY_KEYS, CATEGORY_LABELS, categoryFormSchema, parseContent } from '@site/content/schema';
import { check, readContent, saveContent } from '../../../../lib/content';
import { errorResponse, json } from '../../../../lib/http';
import { author, repo } from '../../../../lib/repo';

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const key = CATEGORY_KEYS.find((k) => k === params.key);
    if (!key) return json({ ok: false, error: 'Categorie necunoscută.' }, 404);
    const page = check(parseContent(categoryFormSchema, await request.json()));
    const list = await readContent(repo(), 'categories');
    const next = list.map((c) => (c.key === key ? { key, ...page } : c));
    const sha = await saveContent(repo(), 'categories', next, {
      message: `Texte categorii: ${CATEGORY_LABELS[key]}`,
      author: author(locals.user!),
    });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
```

- [ ] **Step 7: Stilul pentru pesmet**

În `admin/src/styles/admin.css`, după regula `.page-head p`, adaugă:

```css
.page-head .crumb { margin: 0 0 4px; font-size: 0.8125rem; }
.crumb a { color: var(--text-2); text-underline-offset: 3px; }
```

- [ ] **Step 8: Verifică**

Run: `npx vitest run && npx astro check && npm run build`
Expected: verde.

Pornește `npm run dev`. Cu Playwright (browser nou), intră cu `test@loxmobila.ro` / `parola-de-test-1` și parcurge:

1. `/contact`: schimbă Telefon în `0741 111 222`, apasă „Salvează și publică”.
   Expected: bara galbenă „Se publică. Durează cam un minut.”, apoi în ~4-8 s bara verde „Publicat.” cu „Vezi pe site”. `git -C /tmp/lox-local log -1 --format='%s|%an'` = `Contact și program|Cont test`; `grep phoneDisplay /tmp/lox-local/src/content/contact.json` conține `0741 111 222`.
2. `/contact`: scrie `contact` în Email și salvează.
   Expected: sub Email apare „Adresa de email nu e validă.”, câmpul are contur roșu, bara de jos arată „Verifică câmpurile marcate.”; numărul de commit-uri din `/tmp/lox-local` nu crește.
3. `/contact`: adaugă un rând de program, completează-l, mută-l „Sus”, salvează. Expected: în `contact.json` rândul nou e primul în `hours`.
4. `/cifre`: schimbă Număr de recenzii în `41`, salvează. Expected: `stats.json` are `"count": 41` (număr, nu text).
5. `/recenzii`: adaugă o recenzie, salvează. Expected: `reviews.json` are 4 elemente; mesajul commit-ului e `Recenzii`.
6. `/categorii/bucatarii`: schimbă Introducerea, șterge lista dintr-un bloc, salvează. Expected: `categories.json` are introducerea nouă, iar blocul nu mai are cheia `list`.
7. Modifică un câmp și încearcă să pleci din pagină: browserul cere confirmare. Apasă „Renunță”: pagina se reîncarcă fără confirmare.

Capturi la 1280, 768 și 390 pentru `/contact` și `/categorii/bucatarii` în `.shots/admin/task14-*.png`. Expected: bara de salvare fixată jos nu acoperă ultimul câmp (conținutul are spațiu de 120 px jos); pe 390 rândurile de program au câmpurile unul sub altul; nimic nu iese din ecran.

Readu clone-ul la starea de dinainte de verificare: `git -C /tmp/lox-local reset -q --hard origin/admin-panel`.

- [ ] **Step 9: Commit**

```bash
cd ..
git add admin/src
git commit -m "feat(admin): ecranele Contact, Cifre, Recenzii si Texte categorii"
```

---

### Task 15: Lista de proiecte

**Files:**
- Modify: `admin/src/pages/proiecte/index.astro` (înlocuiește pagina temporară)
- Create: `admin/src/scripts/projects-list.ts`, `admin/src/pages/api/projects/order.ts`

**Interfaces:**
- Consumes: `reorderProjects` (Task 12), `photosLabel` (Task 12), `initSaveForm`, `serialize`, `markDirty` (Task 13), `projectOrderSchema`.
- Produces: `POST /api/projects/order` cu `{ order: string[], featured: Record<slug, boolean> }`.

- [ ] **Step 1: Pagina**

`admin/src/pages/proiecte/index.astro`:

```astro
---
import Admin from '../../layouts/Admin.astro';
import SaveBar from '../../components/SaveBar.astro';
import { CATEGORY_LABELS } from '@site/content/schema';
import { readContent } from '../../lib/content';
import { photosLabel } from '../../lib/format';
import { repo } from '../../lib/repo';

const projects = await readContent(repo(), 'projects');
---

<Admin title="Proiecte" section="proiecte">
  <div class="page-head">
    <div>
      <h1>Proiecte</h1>
      <p>{projects.length} proiecte. Ordinea de aici e ordinea de pe site; trage de mâner sau folosește Sus și Jos.</p>
    </div>
    <a href="/proiecte/nou" class="btn">Proiect nou</a>
  </div>

  <form action="/api/projects/order" data-order-form data-view="/mobilier" novalidate>
    <ul class="list" data-sortable>
      {
        projects.map((p) => (
          <li class="item" data-slug={p.slug}>
            <button type="button" class="item__drag" data-drag aria-label={`Trage ca să muți ${p.title}`}>
              <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
                <g fill="currentColor">
                  <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
                  <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
                  <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
                </g>
              </svg>
            </button>
            <img class="item__thumb" src={`/media/projects/${p.photos[0]}`} alt="" width="64" height="48" loading="lazy" />
            <div>
              <a class="item__title" href={`/proiecte/${p.slug}`}>{p.title}</a>
              <p class="item__meta">{CATEGORY_LABELS[p.category]}, {photosLabel(p.photos.length)}</p>
            </div>
            <div class="item__side">
              <label class="check">
                <input type="checkbox" name={`featured.${p.slug}`} checked={p.featured} />
                Pe prima pagină
              </label>
              <span class="item__move">
                <button type="button" class="btn btn--ghost btn--small" data-up aria-label={`Mută ${p.title} mai sus`}>Sus</button>
                <button type="button" class="btn btn--ghost btn--small" data-down aria-label={`Mută ${p.title} mai jos`}>Jos</button>
              </span>
            </div>
          </li>
        ))
      }
    </ul>
    <SaveBar label="Salvează ordinea" />
  </form>
</Admin>

<script>
  import '../../scripts/projects-list.ts';
</script>
```

- [ ] **Step 2: Scriptul listei**

`admin/src/scripts/projects-list.ts`:

```ts
import Sortable from 'sortablejs';
import { buildObject } from '../lib/form-data';
import { initSaveForm, markDirty, serialize } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-order-form]');
const list = form?.querySelector<HTMLElement>('[data-sortable]');

if (form && list) {
  Sortable.create(list, { handle: '[data-drag]', animation: 150, delayOnTouchOnly: true, delay: 120, onEnd: markDirty });

  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    const item = btn?.closest('li');
    if (!btn || !item) return;
    if (btn.matches('[data-up]') && item.previousElementSibling) item.previousElementSibling.before(item);
    else if (btn.matches('[data-down]') && item.nextElementSibling) item.nextElementSibling.after(item);
    else return;
    btn.focus();
    markDirty();
  });

  initSaveForm(form, {
    body: async () => {
      const data = buildObject(serialize(form));
      const order = [...list.querySelectorAll<HTMLElement>('[data-slug]')].map((li) => li.dataset.slug!);
      return { body: JSON.stringify({ order, featured: data.featured ?? {} }), json: true };
    },
  });
}
```

- [ ] **Step 3: Ruta de ordonare**

`admin/src/pages/api/projects/order.ts`:

```ts
import type { APIRoute } from 'astro';
import { parseContent, projectOrderSchema } from '@site/content/schema';
import { check, readContent, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { reorderProjects } from '../../../lib/projects';
import { author, repo } from '../../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { order, featured } = check(parseContent(projectOrderSchema, await request.json()));
    const next = reorderProjects(await readContent(repo(), 'projects'), order, featured);
    const sha = await saveContent(repo(), 'projects', next, { message: 'Ordinea proiectelor', author: author(locals.user!) });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
```

- [ ] **Step 4: Verifică**

Run: `npx astro check && npm run build`
Expected: `0 errors`.

Cu `npm run dev` și Playwright, logat:
1. `/proiecte` arată 12 rânduri cu miniatură, titlu, „Bucătării, 2 poze” pentru Bucătărie cu insulă și bifele „Pe prima pagină” ca în `projects.json`.
2. Apasă „Jos” pe primul proiect (Bucătărie în L), debifează „Pe prima pagină” la Dressing din perete în perete, salvează. Expected: bara ajunge la „Publicat.”; în `/tmp/lox-local/src/content/projects.json` primul proiect e `dressing-perete-in-perete`, cu `"featured": false`, iar al doilea `bucatarie-in-l`. Mesajul commit-ului: `Ordinea proiectelor`.
3. Trage un rând de mâner (Playwright `dragTo` de la `[data-drag]` al rândului 3 la rândul 1), salvează. Expected: ordinea din JSON urmează ordinea din pagină.

Capturi la 1280, 768, 390 în `.shots/admin/task15-*.png`. Expected: pe 390 rândul are mânerul, miniatura și titlul pe primul rând, iar bifa și butoanele Sus/Jos dedesubt, fără depășiri.

`git -C /tmp/lox-local reset -q --hard origin/admin-panel`

- [ ] **Step 5: Commit**

```bash
cd ..
git add admin/src
git commit -m "feat(admin): lista de proiecte cu ordonare si bifa pentru prima pagina"
```

---

### Task 16: Formularul de proiect

**Files:**
- Create: `admin/src/components/rows/SpecRow.astro`, `admin/src/components/ProjectForm.astro`
- Create: `admin/src/pages/proiecte/nou.astro`, `admin/src/pages/proiecte/[slug].astro`
- Create: `admin/src/scripts/project-form.ts`
- Create: `admin/src/pages/api/projects/save.ts`, `admin/src/pages/api/projects/delete.ts`
- Modify: `admin/src/styles/admin.css` (panoul de ștergere)

**Interfaces:**
- Consumes: `buildProjectSave`, `deleteProject`, `ProjectDraft` (Task 12), `prepareImage`, `newPhotoId`, `MAX_UPLOAD_BYTES`, `ImageError` (Task 12), `downscale`, `initRepeaters`, `initSaveForm`, `serialize`, `setMessage`, `markDirty`, `markClean`, `SaveResult` (Task 13), `slugRequestSchema`.
- Produces: `POST /api/projects/save` (multipart: câmpul `data` cu JSON-ul `ProjectDraft`, plus câte un fișier pentru fiecare jeton `new:<cheie>`) -> `{ ok, sha, slug }`; `POST /api/projects/delete` cu `{ slug }` -> `{ ok, sha }`.

- [ ] **Step 1: Rândul de specificație și formularul**

`admin/src/components/rows/SpecRow.astro`:

```astro
---
import Field from '../Field.astro';
import RowTools from '../RowTools.astro';

interface Props {
  label?: string;
  value?: string;
}

const { label = '', value = '' } = Astro.props;
---

<div class="row" data-row>
  <div class="row__fields">
    <Field label="Etichetă" row="label" value={label} max={40} hint="Fronturi, Feronerie, Blat, Lățime." />
    <Field label="Valoare" row="value" value={value} max={120} hint="MDF vopsit mat, Blum Legrabox, 3,42 m." />
  </div>
  <RowTools />
</div>
```

`admin/src/components/ProjectForm.astro`:

```astro
---
import Field from './Field.astro';
import Repeater from './Repeater.astro';
import SaveBar from './SaveBar.astro';
import SpecRow from './rows/SpecRow.astro';
import { CATEGORY_KEYS, CATEGORY_LABELS, type Project } from '@site/content/schema';

interface Props {
  /** Lipseste pentru un proiect nou. */
  project?: Project;
}

const { project } = Astro.props;
const p = project ?? {
  title: '',
  category: 'bucatarii' as const,
  weeks: 4,
  featured: false,
  description: '',
  specs: [
    { label: 'Fronturi', value: '' },
    { label: 'Feronerie', value: '' },
  ],
  photos: [] as string[],
};
const categories = CATEGORY_KEYS.map((k) => ({ value: k, label: CATEGORY_LABELS[k] }));
---

<form action="/api/projects/save" data-project-form data-slug={project?.slug ?? ''} novalidate>
  <section class="panel">
    <h2 class="panel__title">Despre proiect</h2>
    <div class="fields">
      <Field
        label="Titlu"
        name="title"
        value={p.title}
        max={80}
        hint={project
          ? 'Adresa paginii rămâne aceeași și dacă schimbi titlul, ca linkurile vechi să meargă.'
          : 'Din titlu se face adresa paginii, de exemplu /proiect/bucatarie-in-l.'}
      />
      <div class="fields fields--2">
        <Field label="Categorie" name="category" type="select" value={p.category} options={categories} />
        <Field label="Durată, în săptămâni" name="weeks" type="number" min={1} max={52} value={p.weeks} />
      </div>
      <Field
        label="Descriere"
        name="description"
        type="textarea"
        rows={6}
        max={1200}
        value={p.description ?? ''}
        hint="Opțională. Dacă o lași goală, pe site apare textul standard despre măsurători, CNC și montaj. Un rând gol începe un paragraf nou."
      />
      <label class="check">
        <input type="checkbox" name="featured" checked={p.featured} />
        Pe prima pagină, în tab-ul categoriei
      </label>
    </div>
  </section>

  <section class="panel">
    <h2 class="panel__title">Poze</h2>
    <p class="panel__lead">Prima poză e coperta. Trage pozele ca să le schimbi ordinea.</p>
    <div class="photos__grid" data-photo-grid>
      {
        p.photos.map((f) => (
          <figure class="photo" data-token={`keep:${f}`}>
            <img src={`/media/projects/${f}`} alt="" loading="lazy" />
            <span class="photo__cover">Copertă</span>
            <div class="photo__tools">
              <button type="button" class="btn btn--ghost btn--small" data-left aria-label="Mută poza la stânga">Stânga</button>
              <button type="button" class="btn btn--ghost btn--small" data-right aria-label="Mută poza la dreapta">Dreapta</button>
              <button type="button" class="btn btn--danger btn--small" data-del>Șterge</button>
            </div>
          </figure>
        ))
      }
    </div>
    <template data-photo-template>
      <figure class="photo">
        <img alt="" />
        <span class="photo__cover">Copertă</span>
        <span class="photo__new">Nouă</span>
        <div class="photo__tools">
          <button type="button" class="btn btn--ghost btn--small" data-left aria-label="Mută poza la stânga">Stânga</button>
          <button type="button" class="btn btn--ghost btn--small" data-right aria-label="Mută poza la dreapta">Dreapta</button>
          <button type="button" class="btn btn--danger btn--small" data-del>Șterge</button>
        </div>
      </figure>
    </template>
    <div class="photos__add">
      <label class="btn btn--ghost">
        Adaugă poze
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple class="sr-only" data-photo-input />
      </label>
      <span class="field__hint">JPEG, PNG sau WebP, până la 25 MB fiecare. De pe telefon merg direct din galerie.</span>
    </div>
    <p class="field__error" data-error-for="photos" hidden></p>
  </section>

  <section class="panel">
    <h2 class="panel__title">Specificații</h2>
    <p class="panel__lead">Apar în fișa proiectului. Materialele din filtrul catalogului se recunosc din ele: MDF vopsit, MDF infoliat, PAL, furnir.</p>
    <Repeater name="specs" addLabel="Adaugă o specificație">
      {p.specs.map((s) => <SpecRow label={s.label} value={s.value} />)}
      <SpecRow slot="template" />
    </Repeater>
  </section>

  {
    project && (
      <section class="panel panel--danger">
        <h2 class="panel__title">Șterge proiectul</h2>
        <p class="field__hint">Proiectul dispare de pe site, împreună cu pozele lui.</p>
        <button type="button" class="btn btn--danger" style="margin-top: 12px" data-delete-open>
          Șterge proiectul
        </button>
      </section>
    )
  }

  <SaveBar />
</form>

{
  project && (
    <dialog class="confirm" data-delete-dialog>
      <h2>Ștergi „{project.title}”?</h2>
      <p>Proiectul și pozele lui dispar de pe site. Din admin nu se mai pot recupera.</p>
      <div class="confirm__actions">
        <button type="button" class="btn btn--ghost" data-delete-cancel>Renunță</button>
        <button type="button" class="btn btn--danger-solid" data-delete-confirm>Șterge proiectul</button>
      </div>
    </dialog>
  )
}

<script>
  import '../scripts/project-form.ts';
</script>
```

În `admin/src/styles/admin.css`, după regula `.panel__lead`, adaugă:

```css
.panel--danger { border-color: #EBC9C5; }
```

- [ ] **Step 2: Paginile**

`admin/src/pages/proiecte/nou.astro`:

```astro
---
import Admin from '../../layouts/Admin.astro';
import ProjectForm from '../../components/ProjectForm.astro';
---

<Admin title="Proiect nou" section="proiecte">
  <div class="page-head">
    <div>
      <p class="crumb"><a href="/proiecte">Proiecte</a></p>
      <h1>Proiect nou</h1>
    </div>
  </div>
  <ProjectForm />
</Admin>
```

`admin/src/pages/proiecte/[slug].astro`:

```astro
---
import Admin from '../../layouts/Admin.astro';
import ProjectForm from '../../components/ProjectForm.astro';
import { env } from '../../lib/env';
import { readContent } from '../../lib/content';
import { repo } from '../../lib/repo';

const projects = await readContent(repo(), 'projects');
const project = projects.find((p) => p.slug === Astro.params.slug);
if (!project) return Astro.redirect('/proiecte');
---

<Admin title={project.title} section="proiecte">
  <div class="page-head">
    <div>
      <p class="crumb"><a href="/proiecte">Proiecte</a></p>
      <h1>{project.title}</h1>
    </div>
    <a class="btn btn--ghost" href={`${env().siteUrl}/proiect/${project.slug}`} target="_blank" rel="noopener">Vezi pe site</a>
  </div>
  <ProjectForm project={project} />
</Admin>
```

- [ ] **Step 3: Scriptul formularului**

`admin/src/scripts/project-form.ts`:

```ts
import Sortable from 'sortablejs';
import { buildObject } from '../lib/form-data';
import { downscale } from './downscale';
import { initRepeaters, initSaveForm, markClean, markDirty, serialize, setMessage, type SaveResult } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-project-form]');

if (form) {
  const grid = form.querySelector<HTMLElement>('[data-photo-grid]')!;
  const input = form.querySelector<HTMLInputElement>('[data-photo-input]')!;
  const template = form.querySelector<HTMLTemplateElement>('template[data-photo-template]')!;
  const blobs = new Map<string, Blob>();
  let counter = 0;

  initRepeaters(form);
  Sortable.create(grid, { animation: 150, delayOnTouchOnly: true, delay: 120, filter: 'button', preventOnFilter: false, onEnd: markDirty });

  grid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    const photo = btn?.closest<HTMLElement>('.photo');
    if (!btn || !photo) return;
    if (btn.matches('[data-del]')) {
      const token = photo.dataset.token ?? '';
      if (token.startsWith('new:')) {
        blobs.delete(token.slice(4));
        URL.revokeObjectURL(photo.querySelector('img')!.src);
      }
      photo.remove();
    } else if (btn.matches('[data-left]') && photo.previousElementSibling) photo.previousElementSibling.before(photo);
    else if (btn.matches('[data-right]') && photo.nextElementSibling) photo.nextElementSibling.after(photo);
    else return;
    markDirty();
  });

  input.addEventListener('change', async () => {
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;
    setMessage(form, 'Se pregătesc pozele…');
    for (const file of files) {
      const key = `n${++counter}`;
      const blob = await downscale(file).catch(() => file);
      blobs.set(key, blob);
      const photo = (template.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
      photo.dataset.token = `new:${key}`;
      photo.querySelector('img')!.src = URL.createObjectURL(blob);
      grid.append(photo);
    }
    setMessage(form, '');
    markDirty();
  });

  const tokens = () => [...grid.querySelectorAll<HTMLElement>('.photo')].map((p) => p.dataset.token ?? '');

  initSaveForm(form, {
    body: async () => {
      const photos = tokens();
      const body = new FormData();
      body.append('data', JSON.stringify({ ...buildObject(serialize(form)), slug: form.dataset.slug || undefined, photos }));
      for (const token of photos) {
        if (!token.startsWith('new:')) continue;
        const key = token.slice(4);
        body.append(key, blobs.get(key)!, `${key}.jpg`);
      }
      return { body, json: false };
    },
    onSaved: (r: SaveResult) => {
      const slug = r.slug ?? form.dataset.slug!;
      location.href = `/proiecte/${slug}?publicat=${r.sha}&vezi=${encodeURIComponent(`/proiect/${slug}`)}`;
    },
  });

  // Stergerea, cu confirmare in fereastra proprie, nu in dialogul browserului.
  const dialog = document.querySelector<HTMLDialogElement>('dialog[data-delete-dialog]');
  form.querySelector('[data-delete-open]')?.addEventListener('click', () => dialog?.showModal());
  dialog?.querySelector('[data-delete-cancel]')?.addEventListener('click', () => dialog.close());
  dialog?.querySelector<HTMLButtonElement>('[data-delete-confirm]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    const res = await fetch('/api/projects/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: form.dataset.slug }),
    }).catch(() => null);
    const data = ((await res?.json().catch(() => null)) ?? {}) as SaveResult;
    if (data.ok && data.sha) {
      markClean();
      location.href = `/proiecte?publicat=${data.sha}&vezi=${encodeURIComponent('/mobilier')}`;
      return;
    }
    btn.disabled = false;
    dialog.close();
    setMessage(form, data.error ?? 'Nu s-a putut șterge proiectul. Încearcă din nou.', true);
  });
}
```

- [ ] **Step 4: Rutele**

`admin/src/pages/api/projects/save.ts`:

```ts
import type { APIRoute } from 'astro';
import { readContent, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { ImageError, MAX_UPLOAD_BYTES, newPhotoId, prepareImage } from '../../../lib/images';
import { buildProjectSave, type ProjectDraft } from '../../../lib/projects';
import { author, repo } from '../../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const form = await request.formData();
    const draft = JSON.parse(String(form.get('data') ?? '{}')) as ProjectDraft;
    const uploads = new Map<string, Buffer>();
    for (const [key, value] of form) {
      if (key === 'data' || typeof value === 'string') continue;
      if (value.size > MAX_UPLOAD_BYTES) throw new ImageError(`Poza ${value.name} are peste 25 MB.`);
      uploads.set(key, Buffer.from(await value.arrayBuffer()));
    }
    const save = await buildProjectSave({
      list: await readContent(repo(), 'projects'),
      draft,
      uploads,
      prepare: prepareImage,
      newId: newPhotoId,
    });
    const sha = await saveContent(repo(), 'projects', save.list, {
      message: save.message,
      author: author(locals.user!),
      files: save.files,
      deletes: save.deletes,
    });
    return json({ ok: true, sha, slug: save.slug });
  } catch (e) {
    return errorResponse(e);
  }
};
```

`admin/src/pages/api/projects/delete.ts`:

```ts
import type { APIRoute } from 'astro';
import { parseContent, slugRequestSchema } from '@site/content/schema';
import { check, readContent, saveContent } from '../../../lib/content';
import { errorResponse, json } from '../../../lib/http';
import { deleteProject } from '../../../lib/projects';
import { author, repo } from '../../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { slug } = check(parseContent(slugRequestSchema, await request.json()));
    const r = deleteProject(await readContent(repo(), 'projects'), slug);
    const sha = await saveContent(repo(), 'projects', r.list, { message: r.message, author: author(locals.user!), deletes: r.deletes });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
```

- [ ] **Step 5: Verifică**

Run: `npx vitest run && npx astro check && npm run build`
Expected: verde.

Cu `npm run dev` și Playwright, logat. Pentru poze folosește fișierele din `../src/assets/images/services/`.

1. `/proiecte/nou`: salvează fără nimic completat. Expected: „Câmpul e obligatoriu.” sub Titlu și „Proiectul are nevoie de cel puțin o poză.” sub poze; niciun commit nou.
2. Completează Titlu `Bucătărie de test`, Durată `3`, o specificație, adaugă două poze (`bucatarie.jpg`, `living.jpg`), mută a doua la stânga, salvează. Expected: în timpul trimiterii bara arată „Se urcă pozele: N%”; apoi pagina trece la `/proiecte/bucatarie-de-test` cu bara „Se publică”, apoi „Publicat.”. În clone: `projects.json` are primul proiect `bucatarie-de-test` cu 2 poze, prima fiind cea din `living.jpg`; folderul `src/assets/images/projects/bucatarie-de-test/` are 2 fișiere JPEG de maximum 2400 px; mesajul commit-ului: `Proiect nou: Bucătărie de test`.
3. Pe pagina proiectului, șterge o poză, schimbă titlul în `Bucătărie de test 2`, salvează. Expected: adresa rămâne `/proiecte/bucatarie-de-test`; poza ștearsă a dispărut din folder; commit `Proiect modificat: Bucătărie de test 2`.
4. „Șterge proiectul”, apoi „Renunță” în fereastră: nimic nu se întâmplă. Din nou „Șterge proiectul”, apoi confirmă. Expected: lista `/proiecte` cu bara de publicare; folderul proiectului nu mai există; commit `Proiect șters: Bucătărie de test 2`.
5. Adaugă un fișier text redenumit `poza.jpg`. Expected: mesaj „Fișierul nu e o poză validă.” sub poze, fără commit.

Capturi la 1280, 768, 390 pentru `/proiecte/bucatarie-in-l` în `.shots/admin/task16-*.png`. Expected: grila de poze are 2-5 coloane după lățime, eticheta „Copertă” pe prima poză, butoanele pozei încap sub ea; fereastra de ștergere (captură separată, deschisă) e centrată și lizibilă pe 390.

`git -C /tmp/lox-local reset -q --hard origin/admin-panel`

- [ ] **Step 6: Commit**

```bash
cd ..
git add admin/src
git commit -m "feat(admin): proiect nou, editare cu poze ordonabile si stergere cu confirmare"
```

---

### Task 17: Poze pagini

**Files:**
- Create: `admin/src/pages/poze.astro`, `admin/src/scripts/page-photos.ts`, `admin/src/pages/api/poze.ts`

**Interfaces:**
- Consumes: `PAGE_PHOTO_SLOTS`, `PAGE_PHOTO_LABELS`, `slotFolder`, `currentFile`, `buildPagePhotosSave` (Task 12); `downscale`, `initSaveForm`, `markDirty` (Task 13).
- Produces: `POST /api/poze` (multipart, câte un fișier pe cheie de slot) -> `{ ok, sha }`.

- [ ] **Step 1: Pagina**

`admin/src/pages/poze.astro`:

```astro
---
import Admin from '../layouts/Admin.astro';
import SaveBar from '../components/SaveBar.astro';
import { readContent } from '../lib/content';
import { PAGE_PHOTO_LABELS, PAGE_PHOTO_SLOTS, currentFile, slotFolder } from '../lib/page-photos';
import { repo } from '../lib/repo';

const photos = await readContent(repo(), 'pagePhotos');
---

<Admin title="Poze pagini" section="poze">
  <div class="page-head">
    <div>
      <h1>Poze pagini</h1>
      <p>Plăcile de categorii de pe prima pagină și poza atelierului. Heroul cu LED-uri rămâne fix.</p>
    </div>
  </div>

  <form action="/api/poze" data-photos-form data-view="/" novalidate>
    <ul class="tiles">
      {
        PAGE_PHOTO_SLOTS.map((slot) => (
          <li class="tile" data-slot={slot}>
            <img src={`/media/${slotFolder(slot)}/${currentFile(photos, slot)}`} alt="" loading="lazy" />
            <div class="tile__body">
              <span class="tile__name">{PAGE_PHOTO_LABELS[slot]}</span>
              <label class="btn btn--ghost btn--small">
                Schimbă poza
                <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" data-slot-input={slot} />
              </label>
            </div>
          </li>
        ))
      }
    </ul>
    <p class="field__hint" style="margin-top: 12px">
      Pe site pozele se taie automat (4:3 pe calculator, 4:5 pe telefon), deci ține subiectul spre mijloc.
    </p>
    <SaveBar />
  </form>
</Admin>

<script>
  import '../scripts/page-photos.ts';
</script>
```

- [ ] **Step 2: Scriptul**

`admin/src/scripts/page-photos.ts`:

```ts
import { downscale } from './downscale';
import { initSaveForm, markDirty } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-photos-form]');

if (form) {
  const chosen = new Map<string, Blob>();

  form.querySelectorAll<HTMLInputElement>('[data-slot-input]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      const slot = input.dataset.slotInput!;
      const blob = await downscale(file).catch(() => file);
      chosen.set(slot, blob);
      const tile = input.closest<HTMLElement>('[data-slot]')!;
      const img = tile.querySelector('img')!;
      if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
      img.src = URL.createObjectURL(blob);
      tile.classList.add('is-changed');
      markDirty();
    });
  });

  initSaveForm(form, {
    body: async () => {
      const body = new FormData();
      for (const [slot, blob] of chosen) body.append(slot, blob, `${slot}.jpg`);
      return { body, json: false };
    },
    onSaved: (r) => {
      location.href = `/poze?publicat=${r.sha}&vezi=${encodeURIComponent('/')}`;
    },
  });
}
```

- [ ] **Step 3: Ruta**

`admin/src/pages/api/poze.ts`:

```ts
import type { APIRoute } from 'astro';
import { readContent, saveContent } from '../../lib/content';
import { errorResponse, json } from '../../lib/http';
import { ImageError, MAX_UPLOAD_BYTES, newPhotoId, prepareImage } from '../../lib/images';
import { buildPagePhotosSave } from '../../lib/page-photos';
import { author, repo } from '../../lib/repo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const form = await request.formData();
    const uploads = new Map<string, Buffer>();
    for (const [key, value] of form) {
      if (typeof value === 'string') continue;
      if (value.size > MAX_UPLOAD_BYTES) throw new ImageError(`Poza ${value.name} are peste 25 MB.`);
      uploads.set(key, Buffer.from(await value.arrayBuffer()));
    }
    const save = await buildPagePhotosSave({
      current: await readContent(repo(), 'pagePhotos'),
      uploads,
      prepare: prepareImage,
      newId: newPhotoId,
    });
    const sha = await saveContent(repo(), 'pagePhotos', save.value, {
      message: save.message,
      author: author(locals.user!),
      files: save.files,
      deletes: save.deletes,
    });
    return json({ ok: true, sha });
  } catch (e) {
    return errorResponse(e);
  }
};
```

- [ ] **Step 4: Verifică**

Run: `npx astro check && npm run build`
Expected: `0 errors`.

Cu `npm run dev` și Playwright, logat:
1. `/poze` arată 7 plăci: Bucătării, Dressinguri, Living, Dormitor, Băi, Spații comerciale, Atelier, fiecare cu poza actuală.
2. Salvează fără schimbări. Expected: mesaj „Nu ai schimbat nicio poză.” în bara de jos.
3. Schimbă poza la Băi (cu `../src/assets/images/services/dormitor.jpg`). Expected: placa are contur negru și previzualizarea nouă; după salvare, `page-photos.json` din clone are `"bai": "bai-<8 hex>.jpg"`, fișierul există în `services/`, iar `baie.jpg` a fost șters; commit `Poze pagini: Băi`.

Capturi la 1280, 768, 390 în `.shots/admin/task17-*.png`. Expected: 3-4 coloane pe desktop, o coloană pe 390, butonul „Schimbă poza” încape lângă nume.

`git -C /tmp/lox-local reset -q --hard origin/admin-panel`

- [ ] **Step 5: Commit**

```bash
cd ..
git add admin/src
git commit -m "feat(admin): schimbarea pozelor de categorii si a pozei atelierului"
```

---

### Task 18: Aspect

**Files:**
- Create: `admin/src/pages/aspect.astro`, `admin/src/scripts/aspect.ts`

**Interfaces:**
- Consumes: `ORIGINAL_THEME`, `LIGHT_THEME`, `deriveTheme`, `themeWarnings`, `ThemeColors` din `@site/lib/theme` (Task 4); protocolul `postMessage` din Task 7; `POST /api/save/culori` (Task 14); `initSaveForm`, `markDirty` (Task 13).
- Produces: ecranul Aspect.

- [ ] **Step 1: Pagina**

`admin/src/pages/aspect.astro`:

```astro
---
import Admin from '../layouts/Admin.astro';
import SaveBar from '../components/SaveBar.astro';
import { LIGHT_THEME, ORIGINAL_THEME, themeWarnings } from '@site/lib/theme';
import { env } from '../lib/env';
import { readContent } from '../lib/content';
import { repo } from '../lib/repo';

const theme = await readContent(repo(), 'theme');
const { siteUrl } = env();
const fields = [
  { name: 'background', label: 'Fundal', hint: 'Culoarea paginilor.' },
  { name: 'text', label: 'Text', hint: 'Titluri și paragrafe.' },
  { name: 'accent', label: 'Accent', hint: 'Butoane, linkuri și detalii.' },
] as const;
---

<Admin title="Aspect" section="aspect" wide>
  <div class="page-head">
    <div>
      <h1>Aspect</h1>
      <p>Culorile site-ului. Previzualizarea se schimbă pe loc; pe site ajung după „Salvează și publică”.</p>
    </div>
  </div>

  <div class="aspect">
    <form action="/api/save/culori" class="panel" data-theme-form data-view="/" novalidate>
      <div class="fields">
        {
          fields.map((f) => (
            <div class="field">
              <span class="field__label" id={`eticheta-${f.name}`}>{f.label}</span>
              <div class="swatch">
                <input type="color" value={theme[f.name].toLowerCase()} data-color={f.name} aria-labelledby={`eticheta-${f.name}`} />
                <input
                  type="text"
                  name={f.name}
                  value={theme[f.name]}
                  maxlength="7"
                  spellcheck="false"
                  autocomplete="off"
                  aria-labelledby={`eticheta-${f.name}`}
                  data-hex={f.name}
                />
              </div>
              <span class="field__hint">{f.hint}</span>
              <span class="field__error" hidden></span>
            </div>
          ))
        }
      </div>

      <div class="warnings" data-warnings>
        {themeWarnings(theme).map((w) => <p class="warning">{w.message}</p>)}
      </div>

      <div class="presets">
        <span class="field__label">Pornește de la</span>
        <div class="presets__row">
          <button type="button" class="btn btn--ghost btn--small" data-preset={JSON.stringify(ORIGINAL_THEME)}>Original, închis</button>
          <button type="button" class="btn btn--ghost btn--small" data-preset={JSON.stringify(LIGHT_THEME)}>Deschis</button>
        </div>
      </div>

      <SaveBar />
    </form>

    <div class="preview" data-preview>
      <div class="preview__bar" role="group" aria-label="Lățimea previzualizării">
        <button type="button" class="btn btn--ghost btn--small" aria-pressed="true" data-width="desktop">Calculator</button>
        <button type="button" class="btn btn--ghost btn--small" aria-pressed="false" data-width="phone">Telefon</button>
      </div>
      <iframe
        class="preview__frame"
        src={`${siteUrl}/?tema`}
        title="Previzualizarea site-ului"
        data-frame
        data-origin={new URL(siteUrl).origin}></iframe>
    </div>
  </div>
</Admin>

<script>
  import '../scripts/aspect.ts';
</script>
```

- [ ] **Step 2: Scriptul**

`admin/src/scripts/aspect.ts`:

```ts
import { deriveTheme, themeWarnings, type ThemeColors } from '@site/lib/theme';
import { initSaveForm, markDirty } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-theme-form]');
const frame = document.querySelector<HTMLIFrameElement>('iframe[data-frame]');

if (form && frame) {
  const origin = frame.dataset.origin!;
  const names = ['background', 'text', 'accent'] as const;
  const hex = (n: (typeof names)[number]) => form.querySelector<HTMLInputElement>(`[data-hex="${n}"]`)!;
  const color = (n: (typeof names)[number]) => form.querySelector<HTMLInputElement>(`[data-color="${n}"]`)!;
  const warnings = form.querySelector<HTMLElement>('[data-warnings]')!;
  const valid = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v.trim());

  const current = (): ThemeColors | null => {
    const out = {} as ThemeColors;
    for (const n of names) {
      const v = hex(n).value.trim();
      if (!valid(v)) return null;
      out[n] = v.toUpperCase();
    }
    return out;
  };

  // Trimite culorile in iframe si actualizeaza avertismentele de contrast.
  const apply = () => {
    const c = current();
    if (!c) return;
    const { scheme, vars } = deriveTheme(c);
    frame.contentWindow?.postMessage({ type: 'lox-theme', scheme, vars }, origin);
    warnings.replaceChildren(
      ...themeWarnings(c).map((w) => Object.assign(document.createElement('p'), { className: 'warning', textContent: w.message })),
    );
  };

  for (const n of names) {
    color(n).addEventListener('input', () => {
      hex(n).value = color(n).value.toUpperCase();
      markDirty();
      apply();
    });
    hex(n).addEventListener('input', () => {
      markDirty();
      if (!valid(hex(n).value)) return;
      color(n).value = hex(n).value.trim().toLowerCase();
      apply();
    });
  }

  form.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) =>
    b.addEventListener('click', () => {
      const preset = JSON.parse(b.dataset.preset!) as ThemeColors;
      for (const n of names) {
        hex(n).value = preset[n];
        color(n).value = preset[n].toLowerCase();
      }
      markDirty();
      apply();
    }),
  );

  frame.addEventListener('load', apply);
  window.addEventListener('message', (e) => {
    if (e.origin === origin && (e.data as { type?: string })?.type === 'lox-theme-ready') apply();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-width]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-width]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      frame.closest('[data-preview]')!.classList.toggle('is-phone', b.dataset.width === 'phone');
    }),
  );

  initSaveForm(form);
}
```

- [ ] **Step 3: Verifică**

Run: `npx astro check && npm run build`
Expected: `0 errors`.

Pornește site-ul construit pentru previzualizare (din rădăcină, terminal separat):

```bash
PUBLIC_ADMIN_ORIGIN=http://localhost:4400 npm run build && npx astro preview --port 4322
```

Cu `npm run dev` în `admin/` și Playwright, logat, deschide `/aspect` la 1440:
1. Iframe-ul arată prima pagină a site-ului, închisă.
2. Apasă „Deschis”. Expected: în mai puțin de o secundă, pagina din iframe devine deschisă (verifică în frame: `document.documentElement.dataset.scheme === 'light'`), iar câmpurile arată `#F5F2ED`, `#151412`, `#86643A`; niciun avertisment.
3. Scrie `#DDDDDD` la Text. Expected: apare „Textul se citește greu pe fundalul ăsta.”
4. Apasă „Telefon”: iframe-ul se îngustează la 390 px și site-ul arată varianta de telefon.
5. Pune din nou „Deschis” și salvează. Expected: `theme.json` din clone are culorile temei deschise; commit `Culori`. Navighează în iframe pe altă pagină: culorile de previzualizare rămân (sessionStorage).

Capturi la 1440 și 390 în `.shots/admin/task18-*.png`. Expected: pe 1440 formularul în stânga și previzualizarea în dreapta; pe 390 formularul deasupra, previzualizarea dedesubt, bara de salvare nu acoperă butoanele de temă.

`git -C /tmp/lox-local reset -q --hard origin/admin-panel`, apoi reconstruiește site-ul fără variabilă: `npm run build` (din rădăcină).

- [ ] **Step 4: Commit**

```bash
cd ..
git add admin/src
git commit -m "feat(admin): ecranul Aspect cu culori libere, avertismente de contrast si previzualizare"
```

---

### Task 19: Verificarea cap-coadă în modul local

**Files:**
- Create: `admin/e2e/flow.mjs`, `admin/.env.e2e` (ignorat de git)

**Interfaces:**
- Consumes: tot adminul; `scripts/shots.mjs` nu e folosit aici.
- Produces: `node admin/e2e/flow.mjs` iese cu 0 dacă tot fluxul merge și site-ul se construiește cu conținutul scris de admin.

- [ ] **Step 1: Mediul de test**

Din rădăcină:

```bash
rm -rf /tmp/lox-e2e && git clone -q "$PWD" /tmp/lox-e2e
LINE=$(cd admin && npm run -s user -- e2e@loxmobila.ro "Test cap-coada" "parola-e2e-12345")
cat > admin/.env.e2e <<EOF
GITHUB_REPO=RTR-TECH-SOLUTIONS/lox-mobila
LOCAL_REPO_DIR=/tmp/lox-e2e
SESSION_SECRET=$(openssl rand -hex 32)
ADMIN_USERS=[$LINE]
PUBLIC_SITE_URL=http://localhost:4322
ADMIN_ORIGIN=http://localhost:4400
EOF
```

- [ ] **Step 2: Scriptul**

`admin/e2e/flow.mjs`:

```js
// Verificarea cap-coada a adminului, in modul local (fara GitHub).
// Cere: site-ul pe 4322 (construit cu PUBLIC_ADMIN_ORIGIN=http://localhost:4400) si adminul pornit cu
// ADMIN_ENV_FILE=.env.e2e npm run dev. Iese cu cod 1 la prima verificare care nu trece.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ADMIN = 'http://localhost:4400';
const REPO = '/tmp/lox-e2e';
const PHOTOS = new URL('../../src/assets/images/services/', import.meta.url).pathname;
const SHOTS = new URL('../../.shots/admin/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const read = (file) => JSON.parse(readFileSync(`${REPO}/src/content/${file}.json`, 'utf8'));
const lastCommit = () => execFileSync('git', ['-C', REPO, 'log', '-1', '--format=%s'], { encoding: 'utf8' }).trim();
const commits = () => Number(execFileSync('git', ['-C', REPO, 'rev-list', '--count', 'HEAD'], { encoding: 'utf8' }));
function expect(ok, what) {
  if (!ok) {
    console.error('NU TRECE:', what);
    process.exit(1);
  }
  console.log('ok', what);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('dialog', (d) => d.accept());
const published = async () => {
  await page.locator('[data-status][data-state="success"]').waitFor({ timeout: 20_000 });
};
const save = async () => {
  await page.locator('[data-save]').click();
  await published();
};

// Login
await page.goto(`${ADMIN}/proiecte`);
expect(page.url().includes('/login'), 'fara sesiune, /proiecte duce la login');
await page.fill('input[name=email]', 'e2e@loxmobila.ro');
await page.fill('input[name=password]', 'gresita');
await page.click('button[type=submit]');
expect(await page.getByText('Emailul sau parola nu sunt corecte.').isVisible(), 'parola gresita e refuzata');
await page.fill('input[name=password]', 'parola-e2e-12345');
await page.click('button[type=submit]');
await page.waitForURL(`${ADMIN}/proiecte`);
const initial = read('projects').length;
expect((await page.locator('[data-slug]').count()) === initial, `lista are ${initial} proiecte`);

// Contact: salvare buna si una respinsa
await page.goto(`${ADMIN}/contact`);
await page.fill('input[name=phoneDisplay]', '0741 111 222');
await save();
expect(read('contact').phoneDisplay === '0741 111 222' && lastCommit() === 'Contact și program', 'contactul se salveaza');
const before = commits();
await page.fill('input[name=email]', 'contact');
await page.locator('[data-save]').click();
await page.getByText('Adresa de email nu e validă.').waitFor();
expect(commits() === before, 'emailul invalid nu face commit');
await page.reload();

// Proiect nou cu doua poze, editare, stergere
await page.goto(`${ADMIN}/proiecte/nou`);
await page.fill('input[name=title]', 'Bucătărie de test');
await page.fill('input[name=weeks]', '3');
await page.locator('[data-name=value]').first().fill('MDF vopsit mat');
await page.locator('[data-name=value]').nth(1).fill('Blum Legrabox');
await page.setInputFiles('[data-photo-input]', [`${PHOTOS}bucatarie.jpg`, `${PHOTOS}living.jpg`]);
await page.locator('.photo').nth(1).waitFor();
await save();
await page.waitForURL(/\/proiecte\/bucatarie-de-test(\?.*)?$/);
let p = read('projects')[0];
expect(p.slug === 'bucatarie-de-test' && p.photos.length === 2, 'proiectul nou e primul, cu 2 poze');
expect(p.photos.every((f) => existsSync(`${REPO}/src/assets/images/projects/${f}`)), 'pozele proiectului exista in repo');
await page.screenshot({ path: `${SHOTS}flow-proiect-1280.png`, fullPage: true });

await page.locator('.photo [data-del]').first().click();
await save();
p = read('projects')[0];
expect(p.photos.length === 1 && lastCommit() === 'Proiect modificat: Bucătărie de test', 'o poza stearsa la editare');

await page.click('[data-delete-open]');
await page.click('[data-delete-confirm]');
await page.waitForURL(/\/proiecte(\?.*)?$/);
await published();
expect(read('projects').length === initial && !existsSync(`${REPO}/src/assets/images/projects/bucatarie-de-test`), 'proiectul si folderul lui sunt sterse');

// Ordinea si bifa de prima pagina
await page.locator('[data-slug]').first().locator('[data-down]').click();
await save();
const order = read('projects').map((x) => x.slug);
expect(order.length === initial && lastCommit() === 'Ordinea proiectelor', 'ordinea se salveaza');

// Poza de pagina
await page.goto(`${ADMIN}/poze`);
await page.setInputFiles('[data-slot-input=bai]', `${PHOTOS}dormitor.jpg`);
await save();
const bai = read('page-photos').categories.bai;
expect(/^bai-[0-9a-f]{8}\.jpg$/.test(bai) && existsSync(`${REPO}/src/assets/images/services/${bai}`), 'poza de la Bai se inlocuieste');

// Recenzii, cifre, categorii
await page.goto(`${ADMIN}/recenzii`);
await page.click('[data-repeater=items] [data-add]');
const row = page.locator('[data-repeater=items] [data-row]').last();
await row.locator('[data-name=author]').fill('Ioana T.');
await row.locator('[data-name=project]').fill('Dressing');
await row.locator('[data-name=text]').fill('Au venit la ora stabilită și au lăsat curat după montaj.');
await save();
expect(read('reviews').at(-1).author === 'Ioana T.', 'recenzia noua e salvata');

await page.goto(`${ADMIN}/cifre`);
await page.fill('input[name="googleRating.count"]', '41');
await save();
expect(read('stats').googleRating.count === 41, 'cifrele se salveaza ca numere');

await page.goto(`${ADMIN}/categorii/bucatarii`);
await page.fill('textarea[name=lead]', 'Corpuri calculate pe electrocasnicele tale.');
await save();
expect(read('categories').find((c) => c.key === 'bucatarii').lead === 'Corpuri calculate pe electrocasnicele tale.', 'textul categoriei se salveaza');

// Culori, cu previzualizare
await page.goto(`${ADMIN}/aspect`);
await page.click('[data-preset*="F5F2ED"]');
const frame = page.frameLocator('iframe[data-frame]');
await frame.locator('html[data-scheme="light"]').waitFor({ timeout: 5000 }).catch(() => {});
expect((await frame.locator('html').getAttribute('data-scheme')) === 'light', 'previzualizarea trece pe tema deschisa');
await save();
expect(read('theme').background === '#F5F2ED', 'tema deschisa e salvata');

// Capturi pe toate ecranele, la trei latimi
for (const width of [1280, 768, 390]) {
  await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
  for (const path of ['/proiecte', '/proiecte/bucatarie-in-l', '/poze', '/recenzii', '/categorii/bucatarii', '/contact', '/cifre', '/aspect']) {
    await page.goto(ADMIN + path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow <= 0, `fara scroll orizontal pe ${path} la ${width}`);
    await page.screenshot({ path: `${SHOTS}${path.slice(1).replaceAll('/', '_')}-${width}.png`, fullPage: true });
  }
}
await browser.close();

// Site-ul se construieste cu tot ce a scris adminul
execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: REPO, stdio: 'inherit' });
execFileSync('npm', ['test'], { cwd: REPO, stdio: 'inherit' });
execFileSync('npm', ['run', 'build'], { cwd: REPO, stdio: 'inherit' });
console.log('ok site-ul se construieste cu continutul scris de admin');
```

- [ ] **Step 3: Rulează**

Terminal 1 (rădăcină): `PUBLIC_ADMIN_ORIGIN=http://localhost:4400 npm run build && npx astro preview --port 4322`
Terminal 2: `cd admin && ADMIN_ENV_FILE=.env.e2e npm run dev`
Terminal 3 (rădăcină): `node admin/e2e/flow.mjs`

Expected: fiecare linie începe cu `ok`, ultima este `ok site-ul se construieste cu continutul scris de admin`, cod de ieșire 0.

- [ ] **Step 4: Verificare vizuală**

Deschide cu Read capturile din `.shots/admin/` la 1280 și 390 pentru fiecare ecran și verifică:
1. Nimic nu se suprapune: bara de salvare, bara de publicare, meniul lateral și conținutul au fiecare locul lor.
2. Textul e lizibil, cu diacritice corecte, fără cuvinte tăiate.
3. Aspectul e cel din spec: fundal neutru deschis, panouri albe, butoane negre, alama doar în logo și la meniul activ; fără gradient, fără iconițe decorative, fără etichete uppercase.
4. Pe 390, butoanele au cel puțin 32 px înălțime și nu ies din ecran.

Pentru orice problemă: corectează în `admin.css` sau în componentă, rulează din nou `node admin/e2e/flow.mjs` (după `rm -rf /tmp/lox-e2e && git clone -q "$PWD" /tmp/lox-e2e`).

- [ ] **Step 5: Readu site-ul la build-ul normal și fă commit**

```bash
npm run build
git add admin/e2e/flow.mjs admin/src
git commit -m "test(admin): verificare cap-coada in modul local, cu build-ul site-ului"
```

---

## Partea C: deploy

### Task 20: Adminul în Coolify

Pașii 3-8 publică lucruri în afara calculatorului (push, aplicație în Coolify, DNS, token). **Fiecare se face doar după ce Mario confirmă explicit.**

**Files:**
- Create: `admin/Dockerfile`, `.dockerignore` (rădăcină), `admin/README.md`

**Interfaces:**
- Consumes: tot adminul; workflow-ul din Task 7.
- Produces: adminul la `https://lox-admin.rtrsolutions.ro`, care scrie pe `main`.

- [ ] **Step 1: Imaginea Docker**

`admin/Dockerfile`:

```dockerfile
# Adminul LOX. Contextul de build e radacina repo-ului: adminul foloseste schema si tema din ../src.
FROM node:24-alpine AS build
WORKDIR /repo/admin
COPY admin/package.json admin/package-lock.json ./
RUN npm ci
COPY admin/ ./
COPY src/content/schema.ts /repo/src/content/schema.ts
COPY src/lib/theme.ts /repo/src/lib/theme.ts
# schema.ts cauta zod langa el; il gaseste prin node_modules-ul adminului.
RUN ln -s /repo/admin/node_modules /repo/node_modules && npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY admin/package.json admin/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /repo/admin/dist ./dist
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:4321/health || exit 1
CMD ["node", "dist/server/entry.mjs"]
```

`.dockerignore` (rădăcină):

```
**/node_modules
**/dist
**/.env
**/.env.*
!**/.env.example
.git
.astro
.shots
docs
public
src/assets
```

`admin/README.md`:

```markdown
# Admin LOX Mobila

Panoul în care atelierul LOX își editează proiectele, pozele, textele, contactul și culorile.
Fiecare salvare face un commit pe `main`; workflow-ul `deploy.yml` publică site-ul în cam un minut.

## Local

    cp .env.example .env        # apoi completează; LOCAL_REPO_DIR = un clone local, fără GitHub
    npm install
    npm run dev                 # http://localhost:4400

## Cont nou sau parolă nouă

    npm run user -- atelier@loxmobila.ro "Nume" "parola de minimum 10 caractere"

Linia afișată se adaugă în lista `ADMIN_USERS` din Coolify, apoi se repornește aplicația.

## Productie

Coolify, aplicație Dockerfile: contextul `/`, fișierul `admin/Dockerfile`, portul 4321, verificarea `/health`.
Variabilele sunt cele din `.env.example`; `LOCAL_REPO_DIR` rămâne gol.

Adminul face commit direct pe `main`: înainte de lucru în cod, `git pull`.
```

- [ ] **Step 2: Build local al imaginii**

Run (rădăcină): `docker build -f admin/Dockerfile -t lox-admin . && docker run --rm -d -p 4401:4321 --env-file admin/.env -e ADMIN_ORIGIN=http://localhost:4401 -e LOCAL_REPO_DIR= -e GITHUB_TOKEN=token-fals --name lox-admin-test lox-admin && sleep 3 && curl -s localhost:4401/health; docker rm -f lox-admin-test`
Expected: `ok`. (Dacă Docker nu e instalat pe Mac, pasul se face pe VPS la Step 6 și se notează asta.)

Commit:

```bash
git add admin/Dockerfile .dockerignore admin/README.md
git commit -m "chore(admin): imaginea Docker si instructiunile de rulare"
```

- [ ] **Step 3: Ce îi cerem lui Mario (confirmare explicită)**

1. Aprobare pentru merge `admin-panel` în `main` și push (declanșează deploy-ul site-ului pe GitHub Pages cu conținutul din JSON; site-ul trebuie să arate identic).
2. Un token GitHub fine-grained: GitHub, Settings, Developer settings, Fine-grained tokens, repository `RTR-TECH-SOLUTIONS/lox-mobila`, permisiuni Contents: Read and write, Actions: Read-only, Metadata: Read-only, expirare 1 an.
3. Înregistrarea DNS `A lox-admin.rtrsolutions.ro -> 178.104.230.135`.
4. Emailul clientului și numele care să apară în istoricul modificărilor.

- [ ] **Step 4: Merge și push (după aprobare)**

```bash
git switch main && git merge --no-ff admin-panel -m "feat: panou de admin pentru continutul si culorile site-ului" && git push origin main
gh run watch -R RTR-TECH-SOLUTIONS/lox-mobila --exit-status $(gh run list -R RTR-TECH-SOLUTIONS/lox-mobila -L 1 --json databaseId -q '.[0].databaseId')
```

Expected: rularea se termină cu succes. `node scripts/shots.mjs .shots/live / 1440,390` cu `BASE_URL=https://rtr-tech-solutions.github.io/lox-mobila` arată pagina neschimbată.

- [ ] **Step 5: Ramura de probă**

```bash
git push origin main:admin-smoke
```

- [ ] **Step 6: Aplicația în Coolify (după aprobare)**

În Coolify (`https://coolify.rtrsolutions.ro`), proiectul RTR, New Resource, Private Repository (GitHub App `coolify-rtr`):
- repository `RTR-TECH-SOLUTIONS/lox-mobila`, branch `main`;
- Build Pack: Dockerfile; Base Directory: `/`; Dockerfile Location: `/admin/Dockerfile`;
- Ports Exposes: `4321`; Domains: `https://lox-admin.rtrsolutions.ro`;
- Watch Paths: `admin/**`, `src/content/schema.ts`, `src/lib/theme.ts`;
- Health Check: path `/health`, port `4321`;
- Environment Variables: `GITHUB_TOKEN` (tokenul de la Step 3), `GITHUB_REPO=RTR-TECH-SOLUTIONS/lox-mobila`, `GITHUB_BRANCH=admin-smoke` (doar pentru proba de la Step 7), `SESSION_SECRET` (`openssl rand -hex 32`), `ADMIN_USERS` (liniile generate cu `npm run user` pentru client și pentru Mario, parole de minimum 12 caractere, transmise separat), `PUBLIC_SITE_URL=https://rtr-tech-solutions.github.io/lox-mobila`, `ADMIN_ORIGIN=https://lox-admin.rtrsolutions.ro`.

Deploy. Expected: `curl -s https://lox-admin.rtrsolutions.ro/health` răspunde `ok`, certificatul e valid, `curl -sI https://lox-admin.rtrsolutions.ro/proiecte` răspunde `302` spre `/login` și are `x-frame-options: DENY`.

- [ ] **Step 7: Proba pe ramura de test**

Logat ca Mario pe `https://lox-admin.rtrsolutions.ro`: schimbă o etichetă din Cifre și salvează.
Expected: `git fetch origin admin-smoke && git log -1 --format='%s|%an' origin/admin-smoke` = `Cifre|<numele lui Mario>`. Bara rămâne pe „Se publică” (pe `admin-smoke` nu rulează deploy) până la mesajul de întârziere; e normal pentru probă.

Apoi, în Coolify, `GITHUB_BRANCH=main`, redeploy, și șterge ramura: `git push origin --delete admin-smoke`.

- [ ] **Step 8: Prima publicare reală (după aprobare)**

Logat ca Mario: în Aspect, apasă „Original, închis” și salvează (nu schimbă nimic vizibil, dar trece prin tot lanțul).
Expected: bara ajunge la „Publicat.” în aproximativ un minut; `gh run list -R RTR-TECH-SOLUTIONS/lox-mobila -L 1` arată rularea pentru commit-ul `Culori` cu succes.

Apoi, local: `git pull` pe `main`.

- [ ] **Step 9: Memoria proiectului**

Actualizează `lox-mobila-preview.md` din memorie: adminul există, unde rulează, cum se fac conturile, că adminul face commit pe `main` și trebuie `git pull` înainte de lucru.
