# LOX Mobila Iași: plan de implementare preview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un preview de pitch pentru LOX Mobila (mobilă la comandă, Iași): homepage complet + pagina `/proiecte`, dark premium pe paleta logoului, cu cerere de ofertă prin WhatsApp.

**Architecture:** Astro static, fără framework JS. Tot conținutul stă în `src/data/*.ts` și ajunge în componente prin props, ca trecerea la proiectul real (Keystatic sau SSR) să fie o schimbare de sursă de date. Interactivitatea (filtru, lightbox, drawer, formular WhatsApp, reveal) e făcută cu scripturi vanilla mici; logica pură e separată de DOM și testată cu Vitest.

**Tech Stack:** Node 24.14, npm 11, Astro 7.3.x, Tailwind CSS 4.3.x prin `@tailwindcss/vite`, `@fontsource-variable/fraunces` + `@fontsource-variable/inter` 5.3.x, Vitest 5.x, sharp 0.35.x (folosit de `astro:assets`). Imagini generate cu Higgsfield `gpt_image_2_5` (2k medium, plafon 50 de credite). Verificare vizuală cu Playwright MCP.

**Spec:** `docs/superpowers/specs/2026-09-20-lox-mobila-preview-design.md`

## Global Constraints

- PM: **npm**. Fără pnpm/bun. Fără React sau alt framework UI.
- Limbă site: doar română, cu diacritice corecte (ș, ț cu virgulă, nu sedilă). Identificatori de cod în engleză.
- Paletă, exact: `--ink #0C0C0C`, `--ink-2 #141414`, `--ink-3 #1E1E1E`, `--line #2A2A2A`, `--bone #F2EFEA`, `--bone-2 #A8A39B`, `--brass #B7966B`, `--brass-hi #C9AA80`. Un singur accent (`brass`). Nicio altă culoare în UI, inclusiv verde WhatsApp.
- Radius: 10px butoane și input-uri, 4px imagini. Fără pill.
- Titluri Fraunces Variable, body Inter Variable, self-hosted, `font-display: swap`.
- Uppercase cu tracking 0.18em doar în: nav, numere de secțiune/pași, fișe tehnice. Niciodată ca „eyebrow" deasupra unui titlu de secțiune.
- Interzis: emoji, gradient mesh/blob, carduri flotante, grile de carduri identice rotunjite, avatare rotunde, poze cu oameni, iconițe în cerc, copy generic („calitate superioară", „soluții personalizate").
- Imaginile sunt generate cu Higgsfield (Task 3), plafon 50 de credite. Fiecare trece printr-o poartă vizuală: nicio imagine nu intră în proiect fără să fi fost inspectată cu Read.
- Em-dash în copy: maximum unul pe secțiune. Fără săgeți „→" în copy; o singură săgeată permisă pe linkul „Vezi proiectele".
- Niciun text hardcodat în componente dacă există în `src/data`. Placeholder-ele clientului stau doar în `src/data/site.ts`, marcate `// PLACEHOLDER`.
- Header fix: tot conținutul de sub el folosește `--header-h` (72px desktop, 64px mobil). Nicio suprapunere la 360x740, 768x1024, 1280x800, 1440x700.
- Mișcare 150-250ms `ease-out`; totul dezactivat la `prefers-reduced-motion: reduce`.
- Fără JS, conținutul rămâne vizibil (reveal-ul nu ascunde nimic dacă scriptul nu rulează).
- În afara scopului: SEO on-page, schema, sitemap, cookie banner, pagini legale, credit RTR, Resend.
- Git: folderul nu e repo. **Nu se face `git init`, commit sau push** decât dacă Mario cere explicit. Pașii de commit lipsesc intenționat din plan.

## Structura de fișiere

```
astro.config.mjs            config Astro + plugin Tailwind
tsconfig.json               extends astro/tsconfigs/strict
package.json
src/
  styles/tokens.css         custom properties + @theme Tailwind
  styles/global.css         reset minim, tipografie, utilitare proprii (.container, .label, .hairline)
  layouts/Base.astro        <html lang="ro">, <head>, Header, <slot/>, Footer, scripturi globale
  data/types.ts             toate interfețele
  data/site.ts              nume, oraș, contact, program, social, cifre   (PLACEHOLDER-e aici)
  data/services.ts  data/projects.ts  data/process.ts  data/materials.ts  data/reviews.ts
  lib/images.ts             rezolvă nume de fișier -> ImageMetadata prin import.meta.glob
  lib/whatsapp.ts           logică pură: normalizare număr, compunere mesaj, URL
  lib/filter.ts             logică pură: matchesFilter
  scripts/header.ts  scripts/nav.ts  scripts/filter.ts  scripts/lightbox.ts
  scripts/contact.ts  scripts/reveal.ts                 legătura cu DOM-ul
  components/ui/Button.astro  ui/SectionHeading.astro  ui/SpecList.astro  ui/Logo.astro
  components/Header.astro  MobileNav.astro  Footer.astro
  components/Hero.astro  Positioning.astro  Services.astro
  components/ProjectCard.astro  ProjectGrid.astro  Lightbox.astro
  components/Process.astro  Materials.astro  Workshop.astro
  components/Reviews.astro  CtaBand.astro  ContactForm.astro
  pages/index.astro  pages/proiecte.astro
  assets/images/hero/  services/  projects/  workshop/
tests/
  whatsapp.test.ts  filter.test.ts  data.test.ts
refs/                       screenshot-urile de research (există deja)
```

---

### Task 1: Scaffold, tokens, layout de bază

Setup manual (nu `npm create astro`), pentru că folderul nu e gol și are spațiu în nume.

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/env.d.ts`
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro`

**Interfaces:**
- Produces: layout `Base.astro` cu props `{ title: string; description?: string }`; clasele utilitare `.container`, `.label`, `.hairline`, `.section`; utilitarele Tailwind `bg-ink`, `bg-ink-2`, `bg-ink-3`, `border-line`, `text-bone`, `text-bone-2`, `text-brass`, `bg-brass`, `font-serif`, `font-sans`.

- [ ] **Step 1: package.json + dependențe**

```bash
cd "/Users/mariorotaru/Desktop/RTR TECH SOLUTIONS/website/lox mobila"
npm init -y
npm pkg set name="lox-mobila" private=true type="module"
npm pkg set scripts.dev="astro dev" scripts.build="astro build" scripts.preview="astro preview" scripts.test="vitest run" scripts.check="astro check"
npm install astro@^7.3.3 tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 @fontsource-variable/fraunces@^5.3.0 @fontsource-variable/inter@^5.3.0 sharp@^0.35.4
npm install -D vitest@^5.0.1 @astrojs/check typescript
```

- [ ] **Step 2: config**

`astro.config.mjs`
```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://loxmobila.ro',
  vite: { plugins: [tailwindcss()] },
});
```

`tsconfig.json`
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"] } }
}
```

`.gitignore`
```
node_modules
dist
.astro
.playwright-mcp
.DS_Store
```

- [ ] **Step 3: tokens**

`src/styles/tokens.css`
```css
@import "tailwindcss";

@theme {
  --color-ink: #0C0C0C;
  --color-ink-2: #141414;
  --color-ink-3: #1E1E1E;
  --color-line: #2A2A2A;
  --color-bone: #F2EFEA;
  --color-bone-2: #A8A39B;
  --color-brass: #B7966B;
  --color-brass-hi: #C9AA80;

  --font-serif: "Fraunces Variable", "Iowan Old Style", Georgia, serif;
  --font-sans: "Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif;

  --radius-ui: 10px;
  --radius-img: 4px;
}

:root {
  --header-h: 64px;
  --gutter: 20px;
  --container: 1280px;
  --section-y: clamp(72px, 10vw, 144px);
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --dur: 200ms;

  --fs-display: clamp(2.5rem, 1.4rem + 5.2vw, 5.5rem);
  --fs-h2: clamp(1.9rem, 1.3rem + 2.6vw, 3.25rem);
  --fs-h3: clamp(1.25rem, 1.1rem + 0.7vw, 1.6rem);
  --fs-body: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --fs-label: 0.78rem;
}

@media (min-width: 768px) {
  :root { --header-h: 72px; --gutter: 48px; }
}
```

- [ ] **Step 4: global.css**

`src/styles/global.css`
```css
@import "@fontsource-variable/fraunces";
@import "@fontsource-variable/inter";
@import "./tokens.css";

@layer base {
  html { background: var(--color-ink); color: var(--color-bone); scroll-behavior: smooth; scroll-padding-top: var(--header-h); }
  body { font-family: var(--font-sans); font-size: var(--fs-body); line-height: 1.6; -webkit-font-smoothing: antialiased; }
  h1, h2, h3 { font-family: var(--font-serif); font-weight: 400; line-height: 1.08; letter-spacing: -0.01em; text-wrap: balance; }
  h1 { font-size: var(--fs-display); }
  h2 { font-size: var(--fs-h2); }
  h3 { font-size: var(--fs-h3); line-height: 1.2; }
  p { text-wrap: pretty; }
  img { display: block; max-width: 100%; height: auto; }
  :focus-visible { outline: 2px solid var(--color-brass); outline-offset: 3px; }
  ::selection { background: var(--color-brass); color: var(--color-ink); }
}

@layer components {
  .container { width: 100%; max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }
  .section { padding-block: var(--section-y); }
  .label { font-size: var(--fs-label); letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-bone-2); }
  .hairline { height: 1px; background: var(--color-brass); border: 0; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 5: layout + pagină de test**

`src/layouts/Base.astro`
```astro
---
import '../styles/global.css';
interface Props { title: string; description?: string }
const { title, description = 'Mobilă la comandă în Iași: bucătării, dressinguri, living și dormitor, proiectate 3D și executate în atelier propriu.' } = Astro.props;
---
<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0C0C0C" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <a href="#continut" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-brass focus:text-ink focus:px-4 focus:py-2">Sari la conținut</a>
    <slot name="header" />
    <main id="continut"><slot /></main>
    <slot name="footer" />
  </body>
</html>
```

`src/pages/index.astro` (temporar)
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="LOX Mobila | Mobilă la comandă în Iași">
  <section class="section container">
    <p class="label">01</p>
    <h1>Mobilă făcută pe milimetrul tău.</h1>
    <hr class="hairline w-24 my-8" />
    <p class="text-bone-2 max-w-xl">Test de tokens: șțăîâ ȘȚĂÎÂ.</p>
  </section>
</Base>
```

- [ ] **Step 6: verificare**

Run: `npm run build`
Expected: `1 page(s) built`, zero erori.

Run: `npm run dev` (background), apoi Playwright MCP: navigate `http://localhost:4321`, screenshot `refs/t1-tokens.png`.
Expected: fundal `#0C0C0C`, titlu în Fraunces, diacriticele ș/ț randate în același font (nu fallback), linie alamă sub titlu.

---

### Task 2: Stratul de date

**Files:**
- Create: `src/data/types.ts`, `site.ts`, `services.ts`, `projects.ts`, `process.ts`, `materials.ts`, `reviews.ts`
- Test: `tests/data.test.ts`

**Interfaces:**
- Produces (toate din `src/data/types.ts`):

```ts
export type ProjectCategory = 'bucatarii' | 'dressing' | 'dormitor' | 'living';

export interface SiteData {
  name: string; tagline: string; city: string; county: string; domain: string;
  phoneDisplay: string; phoneHref: string; whatsappNumber: string; email: string;
  address: string; mapsUrl: string;
  hours: { days: string; time: string }[];
  social: { label: string; href: string }[];
  stats: { value: string; label: string }[];
  nav: { label: string; href: string }[];
  googleReviewsUrl: string;
}
export interface Service { slug: string; title: string; line: string; image: string; size: 'lg' | 'md' | 'sm' }
export interface ProjectSpec { label: string; value: string }
export interface Project {
  slug: string; title: string; category: ProjectCategory; district: string;
  weeks: number; cover: string; gallery: string[]; specs: ProjectSpec[]; featured: boolean;
}
export interface ProcessStep { n: string; title: string; text: string; duration: string }
export interface MaterialRow { name: string; look: string; moisture: string; bestFor: string; price: 1 | 2 | 3 | 4 }
export interface Review { author: string; project: string; district: string; text: string }
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  bucatarii: 'Bucătării', dressing: 'Dressing', dormitor: 'Dormitor', living: 'Living',
};
```

- Exporturi: `site: SiteData`, `services: Service[]`, `projects: Project[]`, `processSteps: ProcessStep[]`, `materials: MaterialRow[]`, `hardwareNote: string`, `reviews: Review[]`.
- Câmpurile `image`, `cover`, `gallery[]` sunt **nume de fișier** (ex. `bucatarie-copou-01.jpg`), relative la folderul categoriei din `src/assets/images/`. Rezolvarea se face în `src/lib/images.ts` (Task 3).

- [ ] **Step 1: testul de integritate (pică)**

`tests/data.test.ts`
```ts
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
  it('phoneHref is a tel: link', () => expect(site.phoneHref).toMatch(/^tel:\+40\d{9}$/));
  it('has exactly 3 stats', () => expect(site.stats).toHaveLength(3));
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

describe.skipIf(!existsSync(join(IMG, 'projects')))('image files exist (active after Task 3)', () => {
  it('every referenced project image is on disk', () => {
    for (const p of projects) for (const f of [p.cover, ...p.gallery]) {
      expect(existsSync(join(IMG, 'projects', f)), f).toBe(true);
    }
  });
  it('every service image is on disk', () => {
    for (const s of services) expect(existsSync(join(IMG, 'services', s.image)), s.image).toBe(true);
  });
});
```

Run: `npm test`
Expected: FAIL, „Cannot find module '../src/data/site'".

- [ ] **Step 2: `types.ts`** cu exact codul din blocul Interfaces de mai sus.

- [ ] **Step 3: `site.ts`**

```ts
import type { SiteData } from './types';

export const site: SiteData = {
  name: 'LOX Mobila',
  tagline: 'Idei. Design. Precizie.',
  city: 'Iași',
  county: 'județul Iași',
  domain: 'loxmobila.ro',
  phoneDisplay: '0740 000 000',            // PLACEHOLDER
  phoneHref: 'tel:+40740000000',           // PLACEHOLDER
  whatsappNumber: '40740000000',           // PLACEHOLDER
  email: 'contact@loxmobila.ro',           // PLACEHOLDER
  address: 'Șos. Păcurari nr. 00, Iași',   // PLACEHOLDER
  mapsUrl: 'https://maps.google.com/?q=Iasi', // PLACEHOLDER
  hours: [
    { days: 'Luni - Vineri', time: '08:00 - 17:00' },   // PLACEHOLDER
    { days: 'Sâmbătă', time: 'doar cu programare' },     // PLACEHOLDER
  ],
  social: [
    { label: 'Facebook', href: '#' },      // PLACEHOLDER
    { label: 'Instagram', href: '#' },     // PLACEHOLDER
  ],
  stats: [
    { value: '12', label: 'ani de atelier' },           // PLACEHOLDER
    { value: '340+', label: 'proiecte montate' },       // PLACEHOLDER
    { value: '2 mm', label: 'toleranța la care lucrăm' },
  ],
  nav: [
    { label: 'Ce facem', href: '/#ce-facem' },
    { label: 'Proiecte', href: '/proiecte' },
    { label: 'Cum lucrăm', href: '/#cum-lucram' },
    { label: 'Materiale', href: '/#materiale' },
    { label: 'Atelierul', href: '/#atelier' },
    { label: 'Contact', href: '/#contact' },
  ],
  googleReviewsUrl: '#',                   // PLACEHOLDER
};
```

- [ ] **Step 4: `services.ts`**

```ts
import type { Service } from './types';

export const services: Service[] = [
  { slug: 'bucatarii', title: 'Bucătării', size: 'lg', image: 'bucatarie.jpg',
    line: 'Corpuri calculate pe electrocasnicele tale, nu invers. Blat, fronturi și feronerie alese împreună, pe mostre.' },
  { slug: 'dressing', title: 'Dressinguri', size: 'md', image: 'dressing.jpg',
    line: 'Din perete în perete și până în tavan, fără plinte de umplutură.' },
  { slug: 'living', title: 'Living', size: 'md', image: 'living.jpg',
    line: 'Comode TV, biblioteci și placări de perete cu cablurile ascunse din proiect.' },
  { slug: 'dormitor', title: 'Dormitor', size: 'md', image: 'dormitor.jpg',
    line: 'Paturi cu ladă, noptiere suspendate, tăblii tapițate pe dimensiunea saltelei.' },
  { slug: 'bai', title: 'Băi', size: 'sm', image: 'baie.jpg',
    line: 'Măști de lavoar din MDF hidrofug, vopsit în câmp electrostatic.' },
  { slug: 'comercial', title: 'Spații comerciale', size: 'sm', image: 'comercial.jpg',
    line: 'Recepții, cabinete și magazine, cu termen ferm în contract.' },
];
```

- [ ] **Step 5: `projects.ts`** (12 proiecte; primele 6 `featured: true`)

```ts
import type { Project } from './types';

export const projects: Project[] = [
  { slug: 'bucatarie-l-copou', title: 'Bucătărie în L', category: 'bucatarii', district: 'Copou', weeks: 5, featured: true,
    cover: 'bucatarie-copou-01.jpg', gallery: ['bucatarie-copou-02.jpg'],
    specs: [
      { label: 'Fronturi', value: 'MDF vopsit mat, RAL 7016' },
      { label: 'Feronerie', value: 'Blum Legrabox, amortizare' },
      { label: 'Corpuri', value: '14' },
      { label: 'Blat', value: 'Quartz 20 mm' },
    ] },
  { slug: 'dressing-tatarasi', title: 'Dressing din perete în perete', category: 'dressing', district: 'Tătărași', weeks: 3, featured: true,
    cover: 'dressing-tatarasi-01.jpg', gallery: ['dressing-tatarasi-02.jpg'],
    specs: [
      { label: 'Fronturi', value: 'PAL Egger, uși glisante' },
      { label: 'Feronerie', value: 'Sistem glisare Hettich TopLine' },
      { label: 'Deschidere', value: '3,42 m x 2,68 m' },
      { label: 'Interior', value: 'Iluminare LED pe senzor' },
    ] },
  { slug: 'living-bucium', title: 'Perete TV cu bibliotecă', category: 'living', district: 'Bucium', weeks: 4, featured: true,
    cover: 'living-bucium-01.jpg', gallery: [],
    specs: [
      { label: 'Fronturi', value: 'Furnir de stejar, lac mat' },
      { label: 'Feronerie', value: 'Blum Tip-On, fără mânere' },
      { label: 'Lățime', value: '4,10 m' },
      { label: 'Detaliu', value: 'Canal de cabluri în spatele panoului' },
    ] },
  { slug: 'bucatarie-insula-valea-lupului', title: 'Bucătărie cu insulă', category: 'bucatarii', district: 'Valea Lupului', weeks: 6, featured: true,
    cover: 'bucatarie-valea-lupului-01.jpg', gallery: ['bucatarie-valea-lupului-02.jpg'],
    specs: [
      { label: 'Fronturi', value: 'MDF vopsit mat, negru grafit' },
      { label: 'Feronerie', value: 'Blum Aventos la corpurile suspendate' },
      { label: 'Corpuri', value: '19 + insulă 2,4 m' },
      { label: 'Blat', value: 'Compozit Dekton 12 mm' },
    ] },
  { slug: 'dormitor-pacurari', title: 'Dormitor matrimonial', category: 'dormitor', district: 'Păcurari', weeks: 4, featured: true,
    cover: 'dormitor-pacurari-01.jpg', gallery: [],
    specs: [
      { label: 'Pat', value: 'Ladă cu ridicare pe amortizoare, 160 x 200' },
      { label: 'Tăblie', value: 'Tapițată, stofă bucle' },
      { label: 'Noptiere', value: 'Suspendate, sertar Tip-On' },
      { label: 'Material', value: 'PAL Egger stejar Halifax' },
    ] },
  { slug: 'dressing-walkin-copou', title: 'Dressing walk-in', category: 'dressing', district: 'Copou', weeks: 4, featured: true,
    cover: 'dressing-copou-01.jpg', gallery: [],
    specs: [
      { label: 'Structură', value: 'Deschisă, fără uși' },
      { label: 'Material', value: 'PAL Egger gri piatră' },
      { label: 'Feronerie', value: 'Sertare Hettich InnoTech' },
      { label: 'Suprafață', value: '6,5 mp' },
    ] },
  { slug: 'bucatarie-liniara-nicolina', title: 'Bucătărie liniară, garsonieră', category: 'bucatarii', district: 'Nicolina', weeks: 3, featured: false,
    cover: 'bucatarie-nicolina-01.jpg', gallery: [],
    specs: [
      { label: 'Fronturi', value: 'MDF infoliat, alb mat' },
      { label: 'Feronerie', value: 'Blum Tandembox' },
      { label: 'Lungime', value: '2,75 m' },
      { label: 'Blat', value: 'Postforming 38 mm' },
    ] },
  { slug: 'living-biblioteca-tatarasi', title: 'Bibliotecă până în tavan', category: 'living', district: 'Tătărași', weeks: 3, featured: false,
    cover: 'living-tatarasi-01.jpg', gallery: [],
    specs: [
      { label: 'Material', value: 'MDF vopsit, verde închis' },
      { label: 'Înălțime', value: '2,74 m' },
      { label: 'Rafturi', value: '25 mm, fără săgeată la 90 cm' },
      { label: 'Detaliu', value: 'Scară pe șină' },
    ] },
  { slug: 'dormitor-copii-bucium', title: 'Cameră de copil', category: 'dormitor', district: 'Bucium', weeks: 3, featured: false,
    cover: 'dormitor-bucium-01.jpg', gallery: [],
    specs: [
      { label: 'Pat', value: 'Etajat, cu birou dedesubt' },
      { label: 'Material', value: 'PAL Egger + MDF vopsit' },
      { label: 'Muchii', value: 'Rotunjite R3 la toate canturile' },
      { label: 'Feronerie', value: 'Balamale Blum cu amortizare' },
    ] },
  { slug: 'bucatarie-u-pacurari', title: 'Bucătărie în U', category: 'bucatarii', district: 'Păcurari', weeks: 5, featured: false,
    cover: 'bucatarie-pacurari-01.jpg', gallery: [],
    specs: [
      { label: 'Fronturi', value: 'Furnir de nuc + MDF vopsit' },
      { label: 'Feronerie', value: 'Blum Legrabox, colțar LeMans' },
      { label: 'Corpuri', value: '17' },
      { label: 'Blat', value: 'Granit Nero Assoluto, periat' },
    ] },
  { slug: 'dressing-hol-nicolina', title: 'Dulap de hol cu cuier', category: 'dressing', district: 'Nicolina', weeks: 2, featured: false,
    cover: 'dressing-nicolina-01.jpg', gallery: [],
    specs: [
      { label: 'Material', value: 'PAL Egger + oglindă fumurie' },
      { label: 'Adâncime', value: '38 cm, pe nișă' },
      { label: 'Feronerie', value: 'Balamale Hettich Sensys' },
      { label: 'Detaliu', value: 'Banchetă tapițată integrată' },
    ] },
  { slug: 'living-comoda-valea-lupului', title: 'Comodă TV suspendată', category: 'living', district: 'Valea Lupului', weeks: 2, featured: false,
    cover: 'living-valea-lupului-01.jpg', gallery: [],
    specs: [
      { label: 'Fronturi', value: 'MDF vopsit mat, frezat riflaj' },
      { label: 'Lungime', value: '2,80 m, o singură piesă' },
      { label: 'Prindere', value: 'Șină ascunsă, 120 kg' },
      { label: 'Feronerie', value: 'Blum Tip-On' },
    ] },
];
```

- [ ] **Step 6: `process.ts`, `materials.ts`, `reviews.ts`**

```ts
// process.ts
import type { ProcessStep } from './types';
export const processSteps: ProcessStep[] = [
  { n: '01', title: 'Discuția', duration: '20 de minute',
    text: 'Ne suni sau ne scrii pe WhatsApp. Ne spui ce încăpere, ce îți dorești și cam ce buget ai. Îți spunem sincer dacă se leagă.' },
  { n: '02', title: 'Măsurătorile', duration: 'gratuit în Iași',
    text: 'Venim cu laserul și măsurăm tot: pereți, prize, țevi, abateri de la vertical. Peretele drept există doar în planuri.' },
  { n: '03', title: 'Schița și prețul', duration: '2-3 zile',
    text: 'Primești o schiță cotată și un preț defalcat pe corpuri, materiale și feronerie. Vezi exact pe ce se duc banii.' },
  { n: '04', title: 'Proiectul 3D', duration: '3-5 zile',
    text: 'După avans, modelăm totul 3D. Alegi culorile pe mostre fizice, la lumina din casa ta, nu de pe ecran.' },
  { n: '05', title: 'Execuția', duration: '2-6 săptămâni',
    text: 'Debităm pe CNC, cantuim și asamblăm de probă în atelier. Nimic nu pleacă la tine fără să fi fost montat o dată la noi.' },
  { n: '06', title: 'Montajul', duration: '1-3 zile',
    text: 'Montăm cu echipa noastră, nu cu subcontractori. Reglăm fiecare ușă, facem curat și îți predăm mobila gata de folosit.' },
];

// materials.ts
import type { MaterialRow } from './types';
export const materials: MaterialRow[] = [
  { name: 'PAL melaminat', look: 'Texturi de lemn și uni, mat', moisture: 'Medie, cu cant ABS 2 mm',
    bestFor: 'Carcase, dressinguri, dormitoare', price: 1 },
  { name: 'MDF infoliat', look: 'Fronturi frezate, folie PVC', moisture: 'Bună',
    bestFor: 'Bucătării clasice, fronturi cu profil', price: 2 },
  { name: 'MDF vopsit', look: 'Orice culoare RAL sau NCS, mat ori lucios', moisture: 'Foarte bună',
    bestFor: 'Bucătării moderne, băi, piese fără mânere', price: 3 },
  { name: 'Furnir natural', look: 'Lemn real: stejar, nuc, frasin', moisture: 'Bună, cu lac în 3 straturi',
    bestFor: 'Living, placări, piese de accent', price: 4 },
];
export const hardwareNote =
  'Lucrăm cu feronerie Blum și Hettich: balamale și glisiere cu amortizare, garantate de producător pe viață. Blaturi din postforming, quartz, compozit sau piatră naturală, de la furnizori din Iași.';

// reviews.ts
import type { Review } from './types';
export const reviews: Review[] = [
  { author: 'Andreea M.', project: 'Bucătărie în L', district: 'Copou',
    text: 'Aveam un perete strâmb cu aproape doi centimetri și eram sigură că o să se vadă. Nu se vede. Blatul e lipit de perete pe toată lungimea.' },
  { author: 'Radu și Ioana P.', project: 'Dressing și dormitor', district: 'Bucium',
    text: 'Ne-au spus cinci săptămâni și au montat în a cincea. Prețul din ofertă a fost prețul de pe factură, fără surprize la final.' },
  { author: 'Cristian D.', project: 'Perete TV cu bibliotecă', district: 'Tătărași',
    text: 'Ce m-a convins a fost că au montat totul de probă la ei în atelier. La mine acasă au stat o zi și n-au tăiat nimic pe loc.' },
];
```

(fiecare bloc în fișierul lui; `materials.ts` exportă și `hardwareNote`)

- [ ] **Step 7:** Run: `npm test`
Expected: PASS pe `site`, `projects`, `content shape`; blocul „image files exist" apare SKIPPED.

---

### Task 3: Imagini generate cu Higgsfield, și logo

Imaginile se generează cu Higgsfield, model `gpt_image_2_5`, **buget maxim 50 de credite** (decizia lui
Mario, 2026-09-20). Costuri verificate cu `get_cost`: 1k low 1, 2k medium 1.5, 2k high 3, 4k high 4.5.

**Setare aleasă: `resolution: "2k"`, `quality: "medium"` = 1.5 credite.** Testul a comparat aceeași
bucătărie la medium și la high: ambele fotorealiste, diferența nu justifică dublul cost. 2k dă
2688x1520 la 16:9 și 2336x1744 la 4:3, peste minimele din spec.

**Buget:**

| Poziție | Bucăți | Credite |
|---|---|---|
| Test de calitate (deja cheltuit) | 4 | 7.5 |
| Imagini noi de generat | 19 | 28.5 |
| **Subtotal** | | **36** |
| Rezervă pentru regenerări (aprox. 9 imagini) | | 14 |
| **Plafon** | | **50** |

Cele 4 imagini de test se refolosesc, sunt deja în `refs/test/`:

| Fișier test | Destinație |
|---|---|
| `t0-kitchen-medium.png` (16:9) | `hero/hero.jpg` |
| `t1-kitchen-high.png` (16:9) | `projects/bucatarie-copou-01.jpg` (featured, 16:9) |
| `t2-dressing-medium.png` (4:3) | `projects/dressing-tatarasi-01.jpg` |
| `t3-workshop-medium.png` (4:3) | `workshop/atelier.jpg` |

Notă de layout: `atelier.jpg` iese 4:3, nu 4:5 cum cerea Task 10. Ajustează raportul din Workshop.astro
la 4:3, nu recadra imaginea.

**Files:**
- Create: `src/assets/images/hero/hero.jpg`
- Create: `src/assets/images/services/{bucatarie,dressing,living,dormitor,baie,comercial}.jpg`
- Create: `src/assets/images/projects/*.jpg`, exact cele 15 nume din `projects.ts`
- Create: `src/assets/images/workshop/atelier.jpg`
- Create: `src/assets/images/CREDITS.md`
- Create: `src/lib/images.ts`, `src/components/ui/Logo.astro`, `public/favicon.svg`

**Interfaces:**
```ts
// src/lib/images.ts
import type { ImageMetadata } from 'astro';
type Folder = 'hero' | 'services' | 'projects' | 'workshop';
export function resolveImage(folder: Folder, file: string): ImageMetadata;  // throws daca lipseste
```
- `Logo.astro` props: `{ class?: string; showWordmark?: boolean }` (default `true`), litere pe `currentColor`, arc pe `var(--color-brass)`.

**Schelet de prompt, obligatoriu pe fiecare generare.** Se înlocuiește doar `<SUBIECT>`; restul rămâne
identic, ca să iasă un set coerent vizual:

```
<SUBIECT>. Shot on a <35mm|50mm> lens at f/<2.8|4>, eye level, natural film grain,
one dominant light source, real imperfect reflections, slight natural vignette.
Low key exposure, deep shadows, restrained and moody. Palette of graphite, matte black,
warm walnut and oak, with a thin brushed brass accent.
Real photograph, not a render. No people, no text, no logos, no signage, no brand names.
```

Subiectele, fiecare legat de fișa lui din `projects.ts`:

| Fișier | AR | `<SUBIECT>` |
|---|---|---|
| `services/bucatarie.jpg` | 4:3 | `Architectural photograph of a handleless matte graphite kitchen run with a honed stone worktop and warm under-cabinet light` |
| `services/dressing.jpg` | 4:3 | `Architectural photograph of a built-in wardrobe with sliding doors in warm stone-grey melamine and a slim brass pull` |
| `services/living.jpg` | 4:3 | `Architectural photograph of a wall-mounted walnut veneer TV unit with an integrated bookshelf in a dark living room` |
| `services/dormitor.jpg` | 4:3 | `Architectural photograph of a bedroom with an upholstered boucle headboard and floating oak bedside tables` |
| `services/baie.jpg` | 4:3 | `Architectural photograph of a bathroom vanity in matte painted MDF with a stone top and a backlit mirror` |
| `services/comercial.jpg` | 4:3 | `Architectural photograph of a dark reception desk in fluted oak in a small office lobby at night` |
| `projects/bucatarie-copou-02.jpg` | 4:3 | `Close architectural detail of a soft-close drawer bank open in a matte anthracite kitchen, showing the drawer box and the stone worktop edge` |
| `projects/dressing-tatarasi-02.jpg` | 4:3 | `Architectural detail of a sliding wardrobe door track and a brushed brass handle profile, warm LED light inside` |
| `projects/living-bucium-01.jpg` | 4:3 | `Architectural photograph of a full-wall oak veneer media wall with a recessed TV niche and a hidden cable channel` |
| `projects/bucatarie-valea-lupului-01.jpg` | 16:9 | `Architectural photograph of a matte graphite kitchen with a large island and a compact worktop, lit from a wide window` |
| `projects/bucatarie-valea-lupului-02.jpg` | 4:3 | `Architectural detail of a kitchen island end panel meeting a dark stone worktop with a thin shadow gap` |
| `projects/dormitor-pacurari-01.jpg` | 4:3 | `Architectural photograph of an oak bedroom set with a storage bed, upholstered headboard and floating bedside tables` |
| `projects/dressing-copou-01.jpg` | 4:3 | `Architectural photograph of an open walk-in wardrobe with stone-grey shelving, shoe racks and warm shelf lighting` |
| `projects/bucatarie-nicolina-01.jpg` | 4:3 | `Architectural photograph of a compact single-run matte white kitchen in a small studio flat with dark walls` |
| `projects/living-tatarasi-01.jpg` | 4:3 | `Architectural photograph of a floor-to-ceiling bookshelf in deep green painted MDF with a rolling ladder` |
| `projects/dormitor-bucium-01.jpg` | 4:3 | `Architectural photograph of a children's room with a bunk bed over a built-in desk, oak and soft painted panels, rounded edges` |
| `projects/bucatarie-pacurari-01.jpg` | 16:9 | `Architectural photograph of a U-shaped kitchen combining walnut veneer fronts with matte painted units and a black granite worktop` |
| `projects/dressing-nicolina-01.jpg` | 4:3 | `Architectural photograph of a shallow hallway wardrobe with smoked mirror doors and an integrated upholstered bench` |
| `projects/living-valea-lupului-01.jpg` | 4:3 | `Architectural detail of a long wall-hung TV console in matte painted MDF with a fluted front, floating above a wooden floor` |

- [ ] **Step 1: generează în două loturi** (10, apoi 9) cu `generate_image_batch`, `model: "gpt_image_2_5"`,
`resolution: "2k"`, `quality: "medium"`. Așteaptă cu `jobs_wait`, grupuri de maximum 12.

- [ ] **Step 2: poarta vizuală.** Descarcă fiecare rezultat în `refs/gen/` și **inspectează-l cu Read**.
Respinge dacă are: geometrie imposibilă, mânere sau balamale care nu se leagă, sertare fără logică,
text mâzgălit, simetrie nefiresc de perfectă, plastic lucios, look de randare, sau tonuri care ies din
paletă (albastru, verde crud, alb rece). Nicio imagine nu intră în proiect nevăzută.

- [ ] **Step 3: regenerează respinsele** din rezerva de 14 credite, cu promptul ajustat pe defectul
observat. Dacă un subiect nu iese bun în 2 încercări, renunță la el, scoate proiectul din `projects.ts`
(actualizează și testul care cere 12 proiecte și 6 featured) și spune-i lui Mario.

- [ ] **Step 4: mută și convertește.** PNG-urile au aprox. 5 MB bucata. Scrie un script Python în
scratchpad care mapează fiecare fișier din `refs/gen/` la calea lui din tabel și îl salvează ca JPEG
calitate 88 în `src/assets/images/<folder>/`, creând folderele lipsă:
`Image.open(src).convert('RGB').save(dst, 'JPEG', quality=88, optimize=True)`.
Verifică după: fiecare fișier sub 900 KB. `astro:assets` le recomprimă oricum la build în AVIF/WebP.

- [ ] **Step 5: `CREDITS.md`** cu model, setări, dată, `job_id` pentru fiecare imagine și totalul de
credite consumat. Notă explicită: imagini generate, de înlocuit cu fotografiile clientului la proiectul real.

- [ ] **Step 6: `src/lib/images.ts`**

```ts
import type { ImageMetadata } from 'astro';

type Folder = 'hero' | 'services' | 'projects' | 'workshop';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

export function resolveImage(folder: Folder, file: string): ImageMetadata {
  const key = `/src/assets/images/${folder}/${file}`;
  const mod = files[key];
  if (!mod) throw new Error(`Missing image: ${key}`);
  return mod.default;
}
```

- [ ] **Step 7: logo SVG.** Punct de plecare, de ajustat vizual față de imaginea clientului:

`src/components/ui/Logo.astro`
```astro
---
interface Props { class?: string; showWordmark?: boolean }
const { class: cls = '', showWordmark = true } = Astro.props;
---
<span class:list={['inline-flex flex-col items-center leading-none', cls]}>
  <svg viewBox="0 0 330 100" class="h-[1.9em] w-auto" role="img" aria-label="LOX Mobila">
    <path fill="currentColor" d="M0 0h22v79h60v21H0z" />
    <path fill="currentColor" fill-rule="evenodd"
      d="M128 0h62a30 30 0 0 1 30 30v40a30 30 0 0 1-30 30h-62a30 30 0 0 1-30-30V30a30 30 0 0 1 30-30zm2 21a9 9 0 0 0-9 9v40a9 9 0 0 0 9 9h58a9 9 0 0 0 9-9V30a9 9 0 0 0-9-9z" />
    <path fill="currentColor" d="M232 0h27l71 100h-27z" />
    <path fill="var(--color-brass)" d="M206 106c46-8 84-48 124-106-30 58-70 96-124 106z" />
  </svg>
  {showWordmark && <span class="mt-[0.45em] text-[0.42em] tracking-[0.55em] pl-[0.55em] font-sans font-medium uppercase">Mobila</span>}
</span>
```

- [ ] **Step 8: verificare logo.** Pagină temporară care randează `<Logo class="text-6xl" />` pe `bg-ink`;
screenshot Playwright, comparat lângă imaginea clientului. Ajustează path-urile până când proporțiile
L/O/X și arcul de alamă sunt recognoscibile. **Fallback după 3 iterații:** crop PNG din imaginea primită
(zona 360-1150 x 120-400) salvat ca `src/assets/images/logo.png`, folosit prin `<Image>`, plus notă către
Mario să ceară sursa vectorială.

- [ ] **Step 9: favicon.** `public/favicon.svg`: pătrat `#0C0C0C` cu X-ul alb și arcul de alamă.

- [ ] **Step 10:** Run: `npm test`
Expected: blocul „image files exist" rulează acum și trece: 15 imagini de proiect + 6 de servicii.

### Task 4: Primitive UI

**Files:**
- Create: `src/components/ui/Button.astro`, `ui/SectionHeading.astro`, `ui/SpecList.astro`

**Interfaces:**
- `Button.astro` props: `{ href?: string; variant?: 'primary' | 'outline' | 'link'; type?: 'button' | 'submit'; class?: string; [attr: string]: any }`. Randat `<a>` dacă are `href`, altfel `<button>`.
- `SectionHeading.astro` props: `{ n: string; title: string; lead?: string; id?: string }`. `n` este numărul secțiunii („02").
- `SpecList.astro` props: `{ specs: { label: string; value: string }[] }`.

- [ ] **Step 1: Button**

```astro
---
interface Props { href?: string; variant?: 'primary' | 'outline' | 'link'; type?: 'button' | 'submit'; class?: string; [k: string]: any }
const { href, variant = 'primary', type = 'button', class: cls = '', ...rest } = Astro.props;
const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 ease-out';
const variants = {
  primary: 'h-13 px-7 rounded-[10px] bg-brass text-ink hover:bg-brass-hi',
  outline: 'h-13 px-7 rounded-[10px] border border-bone/25 text-bone hover:border-brass hover:text-brass',
  link: 'text-bone underline decoration-brass decoration-1 underline-offset-[6px] hover:text-brass',
};
const Tag = href ? 'a' : 'button';
---
<Tag href={href} type={href ? undefined : type} class:list={[base, variants[variant], cls]} {...rest}><slot /></Tag>
```
(`h-13` = 52px, țintă tactilă peste 44px.)

- [ ] **Step 2: SectionHeading.** Numărul stă **lângă** titlu, pe aceeași linie de bază, în alamă, nu deasupra lui (nu e eyebrow):

```astro
---
interface Props { n: string; title: string; lead?: string; id?: string }
const { n, title, lead, id } = Astro.props;
---
<header class="grid gap-6 md:grid-cols-[auto_1fr] md:gap-x-10 items-baseline mb-12 md:mb-20">
  <span class="label text-brass tabular-nums" aria-hidden="true">{n}</span>
  <div>
    <h2 id={id}>{title}</h2>
    {lead && <p class="mt-5 max-w-[58ch] text-bone-2">{lead}</p>}
  </div>
</header>
```

- [ ] **Step 3: SpecList** (fișa tehnică):

```astro
---
interface Props { specs: { label: string; value: string }[] }
const { specs } = Astro.props;
---
<dl class="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[0.9rem]">
  {specs.map((s) => (
    <>
      <dt class="label !text-[0.68rem] pt-[0.2em]">{s.label}</dt>
      <dd class="text-bone">{s.value}</dd>
    </>
  ))}
</dl>
```

- [ ] **Step 4: verificare.** Pagina temporară `/` randează toate cele 3 primitive. `npm run build` trece. Screenshot: contrast text `bone-2` pe `ink` lizibil, focus ring alamă vizibil la Tab.

---

### Task 5: Header, drawer mobil, Footer

**Files:**
- Create: `src/components/Header.astro`, `MobileNav.astro`, `Footer.astro`, `src/scripts/header.ts`, `src/scripts/nav.ts`
- Modify: `src/layouts/Base.astro` (montează Header și Footer direct, elimină sloturile `header`/`footer`)

**Interfaces:**
- Consumes: `site.nav`, `site.phoneDisplay`, `site.phoneHref`, `site.social`, `site.address`, `site.hours`, `Logo`, `Button`.
- `Header.astro` props: `{ overlay?: boolean }`. `overlay=true` (homepage) înseamnă transparent peste hero; `false` (`/proiecte`) înseamnă solid de la început. `Base.astro` primește `headerOverlay?: boolean` și îl pasează.
- `Base.astro`: când `headerOverlay` e `false`, `<main>` primește `padding-top: var(--header-h)`.

- [ ] **Step 1: Header.** `<header data-header data-overlay={overlay}>` `position: fixed; inset: 0 0 auto; height: var(--header-h); z-index: 40`. Conținut: Logo stânga (link `/`), `<nav aria-label="Principal">` cu `site.nav` ca `.label` (ascuns sub 1024px), telefon ca link text (ascuns sub 640px), `Button` primary „Cere ofertă" spre `/#contact` (pe mobil înălțime 44px, padding redus), buton hamburger `aria-controls="mobile-nav" aria-expanded="false"` (vizibil sub 1024px). Stări CSS:

```css
[data-header] { transition: background-color var(--dur) var(--ease), border-color var(--dur) var(--ease); border-bottom: 1px solid transparent; }
[data-header][data-overlay="false"], [data-header].is-scrolled { background: color-mix(in srgb, var(--color-ink) 92%, transparent); backdrop-filter: blur(10px); border-bottom-color: var(--color-line); }
```

- [ ] **Step 2: `src/scripts/header.ts`**

```ts
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
```

- [ ] **Step 3: MobileNav.** `<dialog id="mobile-nav">` nativ, full-screen, `bg-ink`. Conține: buton închidere, linkurile din `site.nav` în Fraunces la `var(--fs-h2)`, fiecare cu numărul `01`-`06` în alamă în stânga, apoi telefon + WhatsApp jos. `<dialog>` cu `showModal()` dă gratis focus trap, Esc și `inert` pe restul paginii.

`src/scripts/nav.ts`
```ts
const dialog = document.querySelector<HTMLDialogElement>('#mobile-nav');
const opener = document.querySelector<HTMLButtonElement>('[aria-controls="mobile-nav"]');
if (dialog && opener) {
  const setOpen = (open: boolean) => {
    opener.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  opener.addEventListener('click', () => { dialog.showModal(); setOpen(true); });
  dialog.addEventListener('close', () => { setOpen(false); opener.focus(); });
  dialog.querySelectorAll('a, [data-close]').forEach((el) => el.addEventListener('click', () => dialog.close()));
}
```

- [ ] **Step 4: Footer.** `bg-ink`, `border-t border-line`. Grid 4 coloane desktop / 1 mobil: (1) Logo + `site.tagline` ca `.label`; (2) nav; (3) contact: telefon, email, adresă; (4) program + social ca linkuri text. Rând final: `© 2026 LOX Mobila`. **Fără** credit RTR și fără linkuri legale.

- [ ] **Step 5: scripturile** se includ în `Base.astro` cu `<script>import '../scripts/header.ts'; import '../scripts/nav.ts';</script>`.

- [ ] **Step 6: verificare Playwright** la 1280x800 și 360x740: header nu acoperă conținut; la scroll devine solid; la 360 butonul „Cere ofertă" și hamburgerul încap fără wrap; drawerul se deschide, Esc îl închide, focusul revine pe hamburger.

---

### Task 6: Hero și Poziționare

**Files:**
- Create: `src/components/Hero.astro`, `src/components/Positioning.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `resolveImage('hero','hero.jpg')`, `site.city`, `site.stats`, `Button`.

- [ ] **Step 1: Hero.** Structură:

```astro
<section class="hero" aria-labelledby="hero-title">
  <Image src={resolveImage('hero','hero.jpg')} alt="" widths={[768,1280,1920,2400]} sizes="100vw" loading="eager" fetchpriority="high" class="hero__img" />
  <div class="hero__shade" aria-hidden="true"></div>
  <div class="container hero__inner">
    <h1 id="hero-title">Mobilă făcută<br />pe milimetrul tău.</h1>
    <hr class="hairline hero__rule" />
    <p class="hero__lead">Bucătării, dressinguri și mobilier la comandă în {site.city}. Proiectăm 3D, executăm în atelierul nostru și montăm cu echipa noastră.</p>
    <div class="hero__cta">
      <Button href="/#contact">Cere ofertă</Button>
      <Button href="/proiecte" variant="link">Vezi proiectele →</Button>
    </div>
    <ul class="hero__signals label">
      <li>Proiectare 3D</li><li>Atelier propriu în {site.city}</li><li>Montaj inclus</li>
    </ul>
  </div>
</section>
```

CSS colocat (`<style>`):
```css
.hero { position: relative; min-height: min(100svh, 920px); display: grid; align-items: end; isolation: isolate; }
.hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; }
.hero__shade { position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(180deg, rgb(12 12 12 / .72) 0%, rgb(12 12 12 / .30) 32%, rgb(12 12 12 / .78) 72%, #0C0C0C 100%); }
.hero__inner { padding-top: calc(var(--header-h) + 48px); padding-bottom: clamp(40px, 7vw, 96px); }
.hero__rule { width: 96px; margin-block: clamp(20px, 3vw, 36px); }
.hero__lead { max-width: 52ch; color: var(--color-bone); }
.hero__cta { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px; margin-top: 32px; }
.hero__signals { display: flex; flex-wrap: wrap; gap: 8px 28px; margin-top: clamp(32px, 5vw, 64px); padding-top: 20px; border-top: 1px solid rgb(242 239 234 / .16); }
@media (max-height: 760px) and (min-width: 1024px) { .hero h1 { font-size: clamp(2.5rem, 7.2vh, 4.25rem); } }
```
Gradientul de aici e un overlay de lizibilitate pe fotografie (negru spre negru), nu un gradient decorativ colorat.

- [ ] **Step 2: Positioning.** `section.section` pe `bg-ink`. Grid 12 coloane: stânga (col 1-7) un singur paragraf mare în Fraunces la `var(--fs-h3)`:
„Un perete nu e niciodată drept și o nișă nu are niciodată cât scrie în plan. De aceea măsurăm cu laserul, desenăm fiecare corp la cotă și montăm de probă în atelier înainte să ajungem la tine."
Dreapta (col 9-12): `site.stats` ca listă verticală, fiecare rând `value` în Fraunces `var(--fs-h2)` + `label` ca `.label`, separate de `border-t border-line`. Nu carduri.

- [ ] **Step 3: `index.astro`** devine `<Base title=... headerOverlay><Hero /><Positioning /></Base>`.

- [ ] **Step 4: verificare Playwright** la 1440x700, 1280x800, 768x1024, 360x740: titlul nu intră sub header; CTA-ul și rândul de semnale sunt vizibile fără scroll la 1440x700; textul are contrast pe orice zonă a pozei; fără overflow orizontal (`document.documentElement.scrollWidth === innerWidth`).

---

### Task 7: Ce facem (servicii)

**Files:**
- Create: `src/components/Services.astro`
- Modify: `src/pages/index.astro`

**Interfaces:** Consumes `services`, `resolveImage('services', s.image)`, `SectionHeading`.

- [ ] **Step 1:** `section#ce-facem.section` cu `SectionHeading n="01" title="Ce facem" lead="Orice piesă care trebuie să intre fix într-un loc anume. Dacă se găsește gata făcută la dimensiunea ta, îți spunem de unde s-o cumperi."`

- [ ] **Step 2: layout asimetric**, CSS grid colocat:

```css
.svc { display: grid; gap: 12px; grid-template-columns: 1fr; }
@media (min-width: 900px) {
  .svc { grid-template-columns: repeat(12, 1fr); grid-auto-rows: 240px; }
  .svc__item[data-size="lg"] { grid-column: span 6; grid-row: span 3; }
  .svc__item[data-size="md"] { grid-column: span 6; grid-row: span 1; }
  .svc__item[data-size="sm"] { grid-column: span 6; grid-row: span 1; }
}
.svc__item { position: relative; overflow: hidden; border-radius: var(--radius-img); min-height: 260px; isolation: isolate; display: grid; align-items: end; }
.svc__item img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; transition: transform 600ms var(--ease); }
.svc__item::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, transparent 35%, rgb(12 12 12 / .88) 100%); }
.svc__item:hover img { transform: scale(1.03); }
.svc__body { padding: 24px; }
```
Rezultat desktop: Bucătării pe toată înălțimea în stânga (3 rânduri), Dressing / Living / Dormitor stivuite în dreapta, apoi Băi și Spații comerciale pe un rând dedesubt, jumate-jumate. Fiecare item: `<h3>` + `line` în `text-bone-2` (max 38ch). Itemii sunt `<article>`, nu linkuri (nu există pagini de serviciu la preview).

- [ ] **Step 3: verificare** la 1280 și 360: compoziția nu arată ca o grilă uniformă; textul e lizibil pe fiecare poză; pe mobil itemii au min 260px.

---

### Task 8: Proiecte, filtru, lightbox

**Files:**
- Create: `src/lib/filter.ts`, `src/scripts/filter.ts`, `src/scripts/lightbox.ts`
- Create: `src/components/ProjectCard.astro`, `ProjectGrid.astro`, `Lightbox.astro`
- Test: `tests/filter.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- `src/lib/filter.ts`: `export const ALL = 'toate'; export function matchesFilter(category: string, active: string): boolean`
- `ProjectCard.astro` props: `{ project: Project }`. Randat `<article data-project data-category={project.category}>`, cu buton `data-lightbox-open` care poartă `data-images` (JSON cu `{src, alt}[]`, URL-uri deja optimizate la 1600px cu `getImage` din `astro:assets`, importat ca `optimize`: `import { getImage as optimize } from "astro:assets"`).
- `ProjectGrid.astro` props: `{ projects: Project[]; showFilters?: boolean }` (default `true`).
- `Lightbox.astro`: fără props, un singur `<dialog id="lightbox">` per pagină.

- [ ] **Step 1: test (pică)**

`tests/filter.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { matchesFilter, ALL } from '../src/lib/filter';

describe('matchesFilter', () => {
  it('shows everything for ALL', () => expect(matchesFilter('dressing', ALL)).toBe(true));
  it('matches same category', () => expect(matchesFilter('dressing', 'dressing')).toBe(true));
  it('hides other categories', () => expect(matchesFilter('living', 'dressing')).toBe(false));
});
```
Run: `npm test` → FAIL (modul lipsă).

- [ ] **Step 2: implementare**

`src/lib/filter.ts`
```ts
export const ALL = 'toate';
export function matchesFilter(category: string, active: string): boolean {
  return active === ALL || category === active;
}
```
Run: `npm test` → PASS.

- [ ] **Step 3: `src/scripts/filter.ts`**

```ts
import { matchesFilter } from '../lib/filter';

document.querySelectorAll<HTMLElement>('[data-project-grid]').forEach((grid) => {
  const buttons = grid.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const cards = grid.querySelectorAll<HTMLElement>('[data-project]');
  const status = grid.querySelector<HTMLElement>('[data-filter-status]');
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    const active = btn.dataset.filter!;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    cards.forEach((card) => {
      const ok = matchesFilter(card.dataset.category!, active);
      card.hidden = !ok;
      if (ok) shown++;
    });
    if (status) status.textContent = `${shown} proiecte afișate`;
  }));
});
```

- [ ] **Step 4: ProjectCard.** Fără chenar, fără fundal de card, fără radius mare. Imagine 4:3 (`radius-img`), sub ea: rând cu `<h3>` stânga și `.label` dreapta („Copou · 5 săpt."), apoi `hr` 1px `border-line`, apoi `SpecList`. Imaginea e într-un `<button data-lightbox-open aria-label="Deschide galeria: {title}">`. Grila: 1 col mobil, 2 col ≥700px, 3 col ≥1100px, `gap: 56px 32px`. Ca să nu fie grilă perfectă de itemi identici: în varianta featured (6 itemi), primul și al patrulea item se întind pe 2 coloane la ≥1100px cu imagine 16:9.

- [ ] **Step 5: ProjectGrid.** `<div data-project-grid>`: rând de filtre (`<button data-filter aria-pressed>` ca text `.label`, cel activ subliniat cu alamă 1px; nu pill-uri), `<p data-filter-status class="sr-only" aria-live="polite">`, apoi grila. Etichetele vin din `CATEGORY_LABELS` + „Toate".

- [ ] **Step 6: Lightbox + script**

`src/scripts/lightbox.ts`
```ts
type Img = { src: string; alt: string };
const dialog = document.querySelector<HTMLDialogElement>('#lightbox');
if (dialog) {
  const img = dialog.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const counter = dialog.querySelector<HTMLElement>('[data-lb-counter]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  let items: Img[] = []; let i = 0; let opener: HTMLElement | null = null;

  const render = () => {
    img.src = items[i].src; img.alt = items[i].alt;
    counter.textContent = `${i + 1} / ${items.length}`;
    const single = items.length < 2; prev.hidden = single; next.hidden = single;
  };
  const step = (d: number) => { i = (i + d + items.length) % items.length; render(); };

  document.querySelectorAll<HTMLElement>('[data-lightbox-open]').forEach((btn) =>
    btn.addEventListener('click', () => {
      items = JSON.parse(btn.dataset.images!); i = 0; opener = btn; render(); dialog.showModal();
    }));
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  dialog.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
}
```
`Lightbox.astro`: `<dialog id="lightbox">` full-viewport, `::backdrop` `rgb(12 12 12 / .94)`, imagine `object-fit: contain` max `92vw x 84vh`, butoane prev/next/close ca text `.label` („Înapoi", „Înainte", „Închide"), contor jos.

- [ ] **Step 7: în `index.astro`:** `section#proiecte.section bg-ink-2` cu `SectionHeading n="02" title="Proiecte montate în Iași"`, `ProjectGrid projects={projects.filter(p => p.featured)}`, apoi `Button variant="outline" href="/proiecte"`: „Toate cele 12 proiecte". `<Lightbox />` o dată pe pagină.

- [ ] **Step 8: verificare Playwright:** click pe „Dressing" lasă doar cardurile dressing, `aria-pressed` corect; click pe imagine deschide lightbox, săgețile schimbă poza, Esc închide și focusul revine; la 360px fișa tehnică nu dă overflow.

---

### Task 9: Cum lucrăm și Materiale

**Files:**
- Create: `src/components/Process.astro`, `src/components/Materials.astro`
- Modify: `src/pages/index.astro`

**Interfaces:** Consumes `processSteps`, `materials`, `hardwareNote`, `SectionHeading`.

- [ ] **Step 1: Process.** `section#cum-lucram.section`, `SectionHeading n="03" title="Cum lucrăm" lead="Șase pași, aceiași de fiecare dată. Știi din prima zi ce urmează și cât durează."` Lista e `<ol>`; fiecare `<li>` e un rând de fișă:

```css
.step { display: grid; grid-template-columns: 56px 1fr; gap: 0 24px; padding-block: 28px; border-top: 1px solid var(--color-line); position: relative; }
.step__n { font-family: var(--font-serif); font-size: var(--fs-h3); color: var(--color-brass); font-variant-numeric: tabular-nums; }
@media (min-width: 900px) { .step { grid-template-columns: 96px minmax(0, 320px) 1fr auto; align-items: baseline; gap: 0 40px; } }
.step::before { content: ""; position: absolute; left: 0; top: -1px; width: 56px; height: 1px; background: var(--color-brass); }
```
Coloane desktop: număr | titlu (`h3`) | text (`text-bone-2`, max 56ch) | durată (`.label`, aliniată dreapta). Segmentul scurt de alamă pe linia de sus a fiecărui rând este „linia de cotă". Fără iconițe.

- [ ] **Step 2: Materials.** `section#materiale.section bg-ink-2`, `SectionHeading n="04" title="Materiale și feronerie" lead="Îți arătăm mostrele și îți spunem ce merită și ce nu pentru încăperea ta. O bucătărie și un dressing nu cer același material."` Un `<table>` real cu `<caption class="sr-only">`, `<thead>` cu `.label`, `<th scope="row">` în Fraunces pentru numele materialului. Coloane: Material | Cum arată | Umezeală | Unde îl folosim | Preț. Prețul: 4 liniuțe orizontale de 14x2px, primele `price` în alamă, restul `--line`, cu `<span class="sr-only">Nivel de preț {price} din 4</span>`. Rânduri separate de `border-line`, fără zebra, fără chenar exterior.

Sub 800px tabelul se transformă în listă:
```css
@media (max-width: 799px) {
  .mat thead { position: absolute; clip-path: inset(50%); width: 1px; height: 1px; overflow: hidden; }
  .mat tr { display: block; padding-block: 24px; border-top: 1px solid var(--color-line); }
  .mat th[scope="row"] { display: block; margin-bottom: 12px; }
  .mat td { display: grid; grid-template-columns: 110px 1fr; gap: 16px; padding-block: 4px; }
  .mat td::before { content: attr(data-label); font-size: var(--fs-label); letter-spacing: .18em; text-transform: uppercase; color: var(--color-bone-2); }
}
```
(fiecare `<td>` primește `data-label`). Sub tabel: `hardwareNote` ca paragraf max 70ch, cu `border-l border-brass pl-6`.

- [ ] **Step 3: verificare** la 1280 și 360: tabelul nu scrollează orizontal la 360; rândurile de proces se citesc ca o fișă, nu ca un timeline decorativ.

---

### Task 10: Atelierul, Recenzii, CTA

**Files:**
- Create: `src/components/Workshop.astro`, `Reviews.astro`, `CtaBand.astro`
- Modify: `src/pages/index.astro`

**Interfaces:** Consumes `resolveImage('workshop','atelier.jpg')`, `reviews`, `site.googleReviewsUrl`, `site.city`, `SectionHeading`, `Button`.

- [ ] **Step 1: Workshop.** `section#atelier.section`. Grid 2 coloane desktop (imagine 7/12 stânga, text 5/12 dreapta), imagine 4:5 cu `radius-img`. `SectionHeading n="05" title="Atelierul"`. Text, trei paragrafe scurte:
  1. „Tot ce montăm iese din atelierul nostru din {city}. Nu revindem mobilă făcută de alții și nu dăm montajul pe mâna altcuiva."
  2. „Plăcile se debitează pe CNC, din fișierul proiectului tău, așa că piesa din atelier are exact cota din desen. Canturile se aplică la cald, cu adeziv poliuretanic, care rezistă la abur și la apă."
  3. „Înainte de livrare asamblăm totul de probă. Dacă o ușă freacă, freacă la noi, nu la tine în bucătărie."

- [ ] **Step 2: Reviews.** `section.section bg-ink-2`, `SectionHeading n="06" title="Ce spun cei care gătesc deja în ele"`. Trei `<figure>` pe o coloană lată (nu 3 carduri egale pe rând): `<blockquote>` în Fraunces `var(--fs-h3)`, `text-bone`, max 60ch; `<figcaption class="label">`: „{author} · {project}, {district}". Între ele `border-t border-line`. Alinierea alternează: recenzia 2 e împinsă cu `md:ml-[16%]`. Fără ghilimele decorative gigant, fără stele, fără avatare. La final: `Button variant="link"` „Vezi recenziile pe Google".

- [ ] **Step 3: CtaBand.** `section bg-ink`, `border-y border-line`, padding `clamp(64px, 9vw, 120px)`. Stânga: `<h2>` „Spune-ne ce ai în cap." + `<p class="text-bone-2">` „Măsurătorile sunt gratuite în {city} și nu te obligă la nimic." Dreapta: `Button` „Cere ofertă" + telefon ca link. Un singur CTA dominant.

- [ ] **Step 4: verificare** la 1280 și 360.

---

### Task 11: Contact și formularul WhatsApp

**Files:**
- Create: `src/lib/whatsapp.ts`, `src/scripts/contact.ts`, `src/components/ContactForm.astro`
- Test: `tests/whatsapp.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
```ts
// src/lib/whatsapp.ts
export interface QuoteRequest { name: string; phone: string; projectType: string; message: string }
export function normalizeNumber(raw: string): string;                 // '0740 000 000' -> '40740000000'
export function buildMessage(r: QuoteRequest): string;
export function buildWhatsAppUrl(number: string, r: QuoteRequest): string;
```

- [ ] **Step 1: test (pică)**

`tests/whatsapp.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { normalizeNumber, buildMessage, buildWhatsAppUrl } from '../src/lib/whatsapp';

const req = { name: 'Ana Pop', phone: '0740 111 222', projectType: 'Bucătărie', message: 'Apartament nou, 3,2 m de perete.' };

describe('normalizeNumber', () => {
  it('converts local 07xx to 407xx', () => expect(normalizeNumber('0740 000 000')).toBe('40740000000'));
  it('strips + and spaces', () => expect(normalizeNumber('+40 740 000 000')).toBe('40740000000'));
  it('handles 0040 prefix', () => expect(normalizeNumber('0040740000000')).toBe('40740000000'));
});

describe('buildMessage', () => {
  it('includes all fields on separate lines', () => {
    expect(buildMessage(req)).toBe(
      'Bună ziua, aș dori o ofertă.\n\nNume: Ana Pop\nTelefon: 0740 111 222\nProiect: Bucătărie\n\nApartament nou, 3,2 m de perete.',
    );
  });
  it('omits the details block when message is empty', () => {
    expect(buildMessage({ ...req, message: '   ' })).toBe(
      'Bună ziua, aș dori o ofertă.\n\nNume: Ana Pop\nTelefon: 0740 111 222\nProiect: Bucătărie',
    );
  });
  it('trims inputs', () => expect(buildMessage({ ...req, name: '  Ana Pop  ' })).toContain('Nume: Ana Pop\n'));
});

describe('buildWhatsAppUrl', () => {
  it('builds an encoded wa.me url', () => {
    const url = buildWhatsAppUrl('0740 000 000', req);
    expect(url.startsWith('https://wa.me/40740000000?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe(buildMessage(req));
  });
});
```
Run: `npm test` → FAIL (modul lipsă).

- [ ] **Step 2: implementare**

```ts
export interface QuoteRequest { name: string; phone: string; projectType: string; message: string }

export function normalizeNumber(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '40' + d.slice(1);
  return d;
}

export function buildMessage(r: QuoteRequest): string {
  const lines = [
    'Bună ziua, aș dori o ofertă.',
    '',
    `Nume: ${r.name.trim()}`,
    `Telefon: ${r.phone.trim()}`,
    `Proiect: ${r.projectType.trim()}`,
  ];
  const details = r.message.trim();
  if (details) lines.push('', details);
  return lines.join('\n');
}

export function buildWhatsAppUrl(number: string, r: QuoteRequest): string {
  return `https://wa.me/${normalizeNumber(number)}?text=${encodeURIComponent(buildMessage(r))}`;
}
```
Run: `npm test` → PASS (toate suitele).

- [ ] **Step 3: ContactForm.** `section#contact.section`, `SectionHeading n="07" title="Hai să vorbim despre proiectul tău"`. Grid 2 coloane. Stânga, formular `<form data-quote-form data-wa={site.whatsappNumber} novalidate={false}>`:
  - `name` text, `required`, `autocomplete="name"`, label „Nume"
  - `phone` tel, `required`, `autocomplete="tel"`, `pattern="[0-9+ ]{10,15}"`, label „Telefon"
  - `projectType` `<select required>`: Bucătărie, Dressing, Living, Dormitor, Baie, Spațiu comercial, Altceva
  - `message` `<textarea rows="4">`, label „Câteva detalii (opțional)", placeholder „Ex: bucătărie în L, 3,2 m x 2,4 m, apartament nou"
  - `Button type="submit"`: „Trimite pe WhatsApp"
  - sub buton, `text-bone-2` mic: „Se deschide WhatsApp cu mesajul gata scris. Răspundem în aceeași zi lucrătoare."

  Stil câmpuri: label vizibil deasupra (nu floating, nu doar placeholder), input `bg-ink-3`, `border border-line`, `rounded-[10px]`, `h-13`, focus `border-brass`. Dreapta: telefon mare în Fraunces (link `tel:`), WhatsApp ca `Button variant="outline"`, email, adresă cu link spre `mapsUrl`, program din `site.hours` ca `<dl>`.

- [ ] **Step 4: `src/scripts/contact.ts`**

```ts
import { buildWhatsAppUrl } from '../lib/whatsapp';

document.querySelectorAll<HTMLFormElement>('[data-quote-form]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const url = buildWhatsAppUrl(form.dataset.wa!, {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      projectType: String(data.get('projectType') ?? ''),
      message: String(data.get('message') ?? ''),
    });
    window.open(url, '_blank', 'noopener');
  });
});
```
Fallback fără JS: `<form action={`https://wa.me/${site.whatsappNumber}`} method="get" target="_blank">`, deci submitul deschide totuși conversația.

- [ ] **Step 5: verificare Playwright:** submit gol arată validarea nativă; completat, interceptează `window.open` cu `browser_evaluate` (`window.open = (u) => (window.__u = u)`) și verifică că `__u` începe cu `https://wa.me/40` și conține numele codat. La 360px câmpurile au 100% lățime.

---

### Task 12: Pagina `/proiecte`

**Files:**
- Create: `src/pages/proiecte.astro`

**Interfaces:** Consumes `projects` (toate 12), `ProjectGrid`, `Lightbox`, `CtaBand`, `Base` cu `headerOverlay={false}`.

- [ ] **Step 1:** Structură: header de pagină (`container`, padding-top `clamp(48px, 8vw, 112px)`): `<h1>` „Proiecte" + paragraf „Douăsprezece lucrări din ultimii doi ani, toate montate în Iași și împrejurimi. Fiecare are fișa ei: ce material, ce feronerie, cât a durat." Apoi `ProjectGrid projects={projects}` (varianta completă: grilă uniformă 3 coloane, fără itemi pe 2 coloane), `<Lightbox />`, `<CtaBand />`.

- [ ] **Step 2: verificare:** `npm run build` raportează 2 pagini; headerul e solid de la început și nu acoperă `h1`; filtrele și lightboxul funcționează și aici; linkurile de nav `/#...` duc corect înapoi pe homepage la ancoră, cu offset corect sub header.

---

### Task 13: Reveal la scroll și finisaj

**Files:**
- Create: `src/scripts/reveal.ts`
- Modify: `src/styles/global.css`, `src/layouts/Base.astro`, componentele care primesc `data-reveal`

- [ ] **Step 1: `reveal.ts`** (progresiv: clasa care ascunde se pune doar dacă JS rulează și userul nu a cerut reduced motion)

```ts
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (!reduce && 'IntersectionObserver' in window && els.length) {
  document.documentElement.classList.add('has-reveal');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}
```

`global.css`, adaugă:
```css
.has-reveal [data-reveal] { opacity: 0; transform: translateY(14px); transition: opacity 500ms var(--ease), transform 500ms var(--ease); }
.has-reveal [data-reveal].is-in { opacity: 1; transform: none; }
```

- [ ] **Step 2:** `data-reveal` pe: `SectionHeading` (rădăcină), fiecare `.svc__item`, fiecare `ProjectCard`, fiecare `.step`, fiecare `<figure>` din Reviews. **Nu** pe Hero (LCP) și nu pe formular.

- [ ] **Step 3: finisaj:** hover states pe toate linkurile (culoare spre `brass`, 200ms); `loading="lazy" decoding="async"` pe tot sub fold; `width`/`height` explicite (vin din `astro:assets`); `alt` descriptiv pe pozele de proiect („Bucătărie în L cu fronturi gri antracit, Copou"), `alt=""` pe cele decorative.

- [ ] **Step 4: verificare:** cu Playwright `browser_emulate_media` reducedMotion `reduce`: tot conținutul e vizibil imediat. Cu JS dezactivat (`curl -s localhost:4321 | grep -c data-reveal` confirmă doar markup; clasa `has-reveal` nu există în HTML-ul static): nimic ascuns.

---

### Task 14: Verificare finală

- [ ] **Step 1:** `npm test` → toate suitele PASS. `npm run check` → 0 erori. `npm run build` → 2 pagini, 0 warning-uri.

- [ ] **Step 2: matrice responsive.** `npm run preview`, apoi Playwright full-page screenshot pentru `/` și `/proiecte` la 360x740, 768x1024, 1280x800, 1440x700. Salvate în `refs/final/`. La fiecare: `document.documentElement.scrollWidth <= window.innerWidth`; headerul nu acoperă titluri; niciun text tăiat; ancorele din nav opresc cu titlul secțiunii vizibil sub header.

- [ ] **Step 3: tastatură.** Tab de la începutul paginii: skip link, nav, CTA, filtre, carduri, formular. Focus vizibil peste tot. Drawer și lightbox: Esc închide, focus revine.

- [ ] **Step 4: checklist anti-AI (Regula #1)**, bifat vizual pe screenshot-uri:
  - [ ] zero emoji, zero iconițe în cerc, zero badge-uri flotante
  - [ ] un singur accent pe toată pagina; niciun verde, roșu sau albastru în UI
  - [ ] nicio grilă de carduri identice rotunjite (servicii asimetric, proiecte fără chenar de card)
  - [ ] niciun eyebrow uppercase deasupra titlurilor
  - [ ] fiecare secțiune are fotografie sau conținut tehnic real (tabel, fișă), nu doar text
  - [ ] copy: detaliu concret în fiecare paragraf; max un em-dash pe secțiune; o singură săgeată
  - [ ] diacritice corecte peste tot, inclusiv în `alt` și `aria-label`
  - [ ] nicio poză cu oameni; nicio imagine cu tell-uri de generare (geometrie imposibilă, mânere care nu se leagă, text mâzgălit)

- [ ] **Step 5: review extern.** Rulează agentul `design-reviewer` pe `http://localhost:4321` cu screenshot-urile din `refs/final/`; aplică observațiile de severitate mare.

- [ ] **Step 6: predare către Mario.** Rezumat: ce s-a construit, lista de PLACEHOLDER-e din `src/data/site.ts` de cerut clientului (telefon, WhatsApp, adresă, program, social, cifre, link recenzii Google, sursa vectorială a logoului, poze proprii), și ce urmează la dezvoltare dacă acceptă clientul (SEO local Iași + keyworduri, LocalBusiness schema, pagini pe serviciu, cookie banner + pagini legale, credit RTR, deploy Hostinger).
