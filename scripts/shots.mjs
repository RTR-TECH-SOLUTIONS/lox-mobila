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
