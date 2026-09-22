// Verificarea cap-coada a adminului, in modul local (fara GitHub).
// Cere: site-ul pe 4322 (construit cu PUBLIC_ADMIN_ORIGIN=http://localhost:4400) si adminul pornit cu
// ADMIN_ENV_FILE=.env.e2e npm run dev. Iese cu cod 1 la prima verificare care nu trece.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ADMIN = 'http://localhost:4400';
const REPO = '/tmp/lox-e2e';
// fileURLToPath (nu .pathname) ca sa nu ramana %20 in calea reala, care are spatii.
const PHOTOS = fileURLToPath(new URL('../../src/assets/images/services/', import.meta.url));
const SHOTS = fileURLToPath(new URL('../../.shots/admin/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });

const read = (file) => JSON.parse(readFileSync(`${REPO}/src/content/${file}.json`, 'utf8'));
const lastCommit = () => execFileSync('git', ['-C', REPO, 'log', '-1', '--format=%s'], { encoding: 'utf8' }).trim();
const commits = () => Number(execFileSync('git', ['-C', REPO, 'rev-list', '--count', 'HEAD'], { encoding: 'utf8' }));
// Git nu tine directoare goale: dupa ce se sterg toate pozele unui proiect, folderul lui poate
// ramane fizic pe disc (empty dir), desi in depozit (si la un clone nou) nu mai exista nimic sub
// calea aia. Verificam prin git, nu prin existsSync pe disc, ca sa nu depindem de acest artefact
// al modului local (pe GitHub adevarat directorul n-ar aparea niciodata).
const goneFromRepo = (dir) => {
  const out = execFileSync('git', ['-C', REPO, 'ls-tree', '-r', '--name-only', 'HEAD', '--', dir], { encoding: 'utf8' }).trim();
  return out.length === 0;
};
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
  // Inchidem bara dupa fiecare confirmare: altfel ramane vizibila si urmatorul published() (fie
  // prin save(), fie apelat direct, ca la stergerea unui proiect) s-ar potrivi fals pe ea, inainte
  // sa apara noua confirmare de la salvarea urmatoare.
  await page.locator('[data-status] .status__close').click().catch(() => {});
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
const described = await page.locator('input[name=email]').evaluate(
  (el) =>
    el.getAttribute('aria-invalid') === 'true' &&
    document.getElementById(el.getAttribute('aria-describedby') ?? '')?.textContent === 'Adresa de email nu e validă.',
);
expect(described, 'campul gresit are aria-invalid si eroarea legata prin aria-describedby');
await page.reload();

// Proiect nou: fara titlu si fara poze nu se trimite nimic
await page.goto(`${ADMIN}/proiecte/nou`);
let projectPosts = 0;
page.on('request', (r) => r.url().endsWith('/api/projects/save') && projectPosts++);
await page.locator('[data-save]').click();
await page.locator('[data-error-for="photos"]:not([hidden])').waitFor();
expect(
  projectPosts === 0 &&
    (await page.locator('input[name=title]').getAttribute('aria-invalid')) === 'true' &&
    (await page.locator('[data-error-for="photos"]').textContent()) === 'Proiectul are nevoie de cel puțin o poză.' &&
    (await page.locator('[data-save-msg]').textContent()) === 'Verifică câmpurile marcate.',
  'fara titlu si fara poze, formularul arata erorile si nu trimite nimic',
);

// Proiect nou cu doua poze, editare, stergere
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
expect(read('projects').length === initial && goneFromRepo('src/assets/images/projects/bucatarie-de-test'), 'proiectul si folderul lui sunt sterse');

// Ordinea si bifa de prima pagina
await page.locator('[data-slug]').first().locator('[data-down]').click();
const [orderRequest] = await Promise.all([page.waitForRequest(`${ADMIN}/api/projects/order`), save()]);
const order = read('projects').map((x) => x.slug);
expect(order.length === initial && lastCommit() === 'Ordinea proiectelor', 'ordinea se salveaza');
const sentFeatured = orderRequest.postDataJSON().featured;
expect(
  !Array.isArray(sentFeatured) && Object.keys(sentFeatured).length === initial,
  'bifele de prima pagina pleaca ca obiect, cate una pe proiect',
);

// Poza de pagina
await page.goto(`${ADMIN}/poze`);
await page.setInputFiles('[data-slot-input=bai]', `${PHOTOS}dormitor.jpg`);
// Schimbarea pozei se proceseaza async (downscale) inainte sa apara pe pagina; fara asteptarea
// asta, click-ul pe Salveaza poate ajunge inaintea ei, iar formularul crede ca nu s-a schimbat nimic.
await page.locator('[data-slot=bai].is-changed').waitFor();
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

// Verificare extra (cerere controller): pe fundalul deschis, titlul din hero ramane text deschis
// pe fotografia intunecata (regula .on-photo). Asteptam ~5s cat se aplica tranzitia, apoi captam la 1440.
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${SHOTS}aspect-deschis-hero-1440.png`, fullPage: true });
const heroColor = await frame.locator('#hero-title').evaluate((el) => getComputedStyle(el).color);
const [hr, hg, hb] = heroColor.match(/[\d.]+/g).map(Number);
const heroLuminance = (0.2126 * hr + 0.7152 * hg + 0.0722 * hb) / 255;
console.log(`info titlul din hero, tema deschisa: culoare=${heroColor} luminanta=${heroLuminance.toFixed(3)}`);
expect(heroLuminance > 0.5, `titlul din hero ramane text deschis pe poza intunecata (culoare ${heroColor}, luminanta ${heroLuminance.toFixed(3)} > 0.5)`);
await page.setViewportSize({ width: 1280, height: 900 });

await save();
expect(read('theme').background === '#F5F2ED', 'tema deschisa e salvata');

// Verificare extra (cerere controller): la 390px, dupa o salvare pe /proiecte, butonul „Inchide”
// al barei de status ramane in intregime in ecran.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${ADMIN}/proiecte`);
await page.locator('[data-slug]').first().locator('[data-down]').click();
// Nu folosim save() aici: trebuie sa masuram bara INAINTE sa fie inchisa (published() o inchide
// dupa fiecare confirmare, ca sa nu dea fals-pozitiv la urmatorul save; vezi mai sus).
await page.locator('[data-save]').click();
await page.locator('[data-status][data-state="success"]').waitFor({ timeout: 20_000 });
const closeInfo = await page.evaluate(() => {
  const btn = document.querySelector('[data-status] .status__close');
  const r = btn.getBoundingClientRect();
  return { right: r.right, innerWidth: window.innerWidth };
});
console.log(`info buton Inchide la 390px: right=${closeInfo.right.toFixed(1)} innerWidth=${closeInfo.innerWidth}`);
expect(
  closeInfo.right <= closeInfo.innerWidth,
  `butonul Inchide incape in ecran la 390px (right=${closeInfo.right.toFixed(1)} <= innerWidth=${closeInfo.innerWidth})`,
);
await page.locator('[data-status] .status__close').click().catch(() => {});
await page.setViewportSize({ width: 1280, height: 900 });

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
