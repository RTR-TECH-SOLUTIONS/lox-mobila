# LOX Mobila: spec panou de admin

Data: 2026-09-22
Faza: preview de pitch; adminul se arată clientului ca parte din ofertă
Aprobat de Mario în conversație, pe 2026-09-22

## 1. Ce vrem

Clientul (atelierul LOX) își administrează singur site-ul, fără să atingă cod:

- adaugă, modifică, șterge și ordonează proiecte, cu pozele lor;
- schimbă pozele fixe din pagini;
- schimbă culorile site-ului, inclusiv spre o variantă deschisă;
- editează recenziile, textele categoriilor, datele de contact și programul, cifrele de pe site.

Criterii: arată profesionist, nu pare făcut de AI, e simplu de folosit, merge și de pe telefon (pozele de la
montaj se urcă de acolo).

## 2. Decizii luate și variante respinse

| Decizie | Ales | Respins și de ce |
|---|---|---|
| Tip de admin | Admin făcut de noi, integral în română | Keystatic: butoanele interfeței rămân în engleză, iar traducerea lui în română e automată și proastă („Bord”, „Filiala noua”). Sveltia CMS: clientul ar avea nevoie de cont GitHub. |
| Unde stă conținutul | Fișiere JSON și poze în repo, publicate prin commit | Supabase sau PocketBase: încă o bază de date de întreținut, iar site-ul ar pierde fie statica, fie optimizarea pozelor la build. |
| Culori | Color picker liber pentru 3 culori, cu avertismente de contrast | Teme fixe alese de noi (Mario a vrut libertate pentru client). |
| Conținut editabil | Proiecte, poze pagini, recenzii, texte categorii, contact și program, cifre, culori | Meniul, pașii procesului, tabelul de materiale și heroul rămân în cod. |

## 3. Arhitectura

```
Client (browser, telefon sau desktop)
  |  login, formulare, poze
  v
Admin LOX: Astro 7 SSR (@astrojs/node), container Docker în Coolify, pe VPS-ul Hetzner
  |  citește și scrie prin API-ul GitHub (token limitat la repo)
  v
GitHub: RTR-TECH-SOLUTIONS/lox-mobila, ramura main
  |  push pe main pornește workflow-ul existent (teste, astro check, build)
  v
Site static (acum GitHub Pages, mai târziu Hostinger)
```

- Adminul stă în folderul `admin/` din același repo, cu `package.json` propriu. Schema datelor și calculul
  culorilor sunt cod comun, importat și de site, și de admin, ca să nu existe două reguli diferite.
- Un deploy al site-ului durează acum cam un minut (măsurat pe ultimele 3 rulări: 49-62 s).
- Fiecare ecran de admin scrie un singur fișier JSON, plus pozele lui. O salvare înseamnă un singur commit.

## 4. Modelul de conținut

Toate fișierele stau în `src/content/`. Schema e în `src/content/schema.ts` (zod 4, dependență directă a site-ului; adminul nu importă zod separat). Site-ul
citește JSON-ul și îl validează la build; dacă un fișier e greșit, build-ul se oprește cu un mesaj clar și
site-ul publicat rămâne pe versiunea anterioară.

| Fișier | Ecran | Conținut |
|---|---|---|
| `projects.json` | Proiecte | listă ordonată: `slug`, `title`, `category` (bucatarii, dressing, dormitor, living), `weeks`, `featured`, `description` (opțional), `specs` [{`label`, `value`}], `photos` [cale] |
| `page-photos.json` | Poze pagini | `categories` (câte o poză pentru cele 6 plăci de pe prima pagină: bucatarii, dressing, living, dormitor, bai, comercial), `atelier` |
| `reviews.json` | Recenzii | listă ordonată: `author`, `project`, `text` |
| `categories.json` | Texte categorii | cele 4 pagini de categorie: `key`, `title`, `lead`, `body` [{`heading`, `paragraphs`, `list`}] |
| `contact.json` | Contact și program | `phoneDisplay`, `whatsappNumber`, `email`, `address`, `mapsUrl`, `hours` [{`days`, `time`}], `social` [{`label`, `href`}], `googleReviewsUrl` |
| `stats.json` | Cifre | `stats` [3 x {`value`, `label`}], `googleRating` {`score`, `count`} |
| `theme.json` | Aspect | `background`, `text`, `accent` (hex) |

Reguli:

- `phoneHref` nu se mai scrie de mână; se calculează din `phoneDisplay`.
- `photos[0]` e coperta proiectului; câmpurile `cover` și `gallery` dispar.
- `slug` se generează din titlu la creare (fără diacritice, cu cratime, unic) și nu se mai schimbă la
  editarea titlului, ca linkurile existente să nu se strice.
- Dacă `description` lipsește, pagina proiectului afișează textul generat de acum.
- `src/data/site.ts` păstrează în cod ce nu se editează (nume, tagline, oraș, meniu) și compune obiectul
  `site` din el plus `contact.json` și `stats.json`, ca componentele să se schimbe cât mai puțin.

## 5. Poze

- Pozele proiectelor stau în `src/assets/images/projects/<slug>/<id>.jpg`, unde `id` e aleator (8 caractere).
  Un nume nou la fiecare upload evită cache-ul vechi. Cele 15 poze existente se mută în structura asta, iar
  numele lor pierd cartierele.
- Pozele de pagină stau în `services/` și `workshop/`, ca acum; la înlocuire se scrie un fișier nou și cel
  vechi se șterge în același commit.
- În browser, înainte de upload, poza se micșorează la maximum 2400 px pe latura lungă (economie de date
  mobile). Pe server, sharp o validează, o rotește după EXIF, o limitează la 2400 px, o salvează JPEG
  calitate 82 și șterge toate metadatele, inclusiv GPS-ul (pozele făcute la client conțin locația casei).
- Formate acceptate: JPEG, PNG, WebP, maximum 25 MB pe poză. Pe iPhone, Safari transformă singur HEIC în
  JPEG la upload.
- Ștergerea unui proiect îi șterge și folderul de poze, în același commit.
- În admin, miniaturile vin printr-o rută proprie (`/media/...`) care citește poza din repo și o servește la
  480 px, cu cache.

## 6. Ecranele adminului

Meniu lateral pe desktop, bară sus cu meniu pliabil pe telefon. Ordinea: Proiecte, Poze pagini, Recenzii,
Texte categorii, Contact și program, Cifre, Aspect.

- **Proiecte**: listă cu copertă, titlu, categorie și bifa „Pe prima pagină”. Ordinea se schimbă prin
  tragere (merge și pe touch) sau cu butoane de mutare, pentru tastatură. Buton „Proiect nou”.
- **Formular proiect**: titlu, categorie, durată în săptămâni, descriere (opțională, cu nota „dacă o lași
  goală, pe site apare textul standard”), specificații (rânduri etichetă plus valoare, adaugi sau ștergi),
  poze (adaugi mai multe deodată, tragi ca să ordonezi, prima e coperta, ștergi), bifa „Pe prima pagină”.
  Ștergerea proiectului cere confirmare într-o fereastră proprie, nu în dialogul browserului.
- **Poze pagini**: cele 6 plăci de categorii și poza atelierului, fiecare cu poza actuală și butonul
  „Schimbă poza”. Heroul cu LED-uri nu apare aici: e construit din straturi de lumină și rămâne fix.
- **Recenzii**: listă ordonabilă; adaugi, editezi, ștergi.
- **Texte categorii**: câte un formular pentru fiecare din cele 4 pagini: titlu, introducere, blocuri de text
  (titlu, paragrafe, listă opțională).
- **Contact și program**: câmpurile din `contact.json`; rânduri de program și rețele sociale adăugate sau
  șterse liber.
- **Cifre**: cele 3 cifre (valoare și etichetă) și nota Google cu numărul de recenzii.
- **Aspect**: vezi secțiunea 7.

Comportament comun:

- Nimic nu se salvează până la „Salvează și publică”. Dacă pleci de pe pagină cu modificări nesalvate,
  apare un avertisment.
- Validarea se face în formular (câmp gol, număr invalid) și din nou pe server, cu aceeași schemă.
- După salvare apare o bară de stare: „Se publică, durează cam un minut”, apoi „Publicat” cu link spre
  pagina de pe site, sau „Nu s-a publicat. Site-ul a rămas cum era.” dacă build-ul a eșuat.

## 7. Culorile

- Clientul alege liber 3 culori: fundal, text, accent (color picker plus câmp hex).
- `src/lib/theme.ts` calculează restul variabilelor din ele:
  - paleta păstrează numele de acum din `@theme` (`ink` = fundal, `bone` = text, `brass` = accent), deci
    componentele se schimbă puțin;
  - `--color-ink-2`, `--color-ink-3`, `--color-line`, `--color-deep`: fundalul amestecat cu textul (sau cu
    negru, pentru subsol) în proporții mici;
  - `--color-bone-2`: textul amestecat cu fundalul;
  - `--color-brass-hi`: accentul, mai deschis pe fundal închis și mai închis pe fundal deschis;
  - `--color-on-accent`: negru sau alb, care contrastează mai bine cu accentul (textul de pe butoane);
  - `--shadow-rgb`, `--shadow-k`: umbre negre pe tema închisă, maro foarte slab pe cea deschisă;
  - `scheme`: `dark` sau `light`, după luminozitatea fundalului.
  Proporțiile se aleg astfel încât tema originală (`#0C0C0C`, `#F2EFEA`, `#B7966B`) să reproducă culorile
  de acum, cu toleranță de 5 unități pe canal; un test verifică asta.
- Avertismente (nu blochează salvarea): contrast text/fundal sub 4,5:1 („Textul se citește greu pe fundalul
  ăsta”) și accent/fundal sub 3:1 („Butoanele și linkurile se văd slab”).
- Puncte de pornire: „Original, închis” (servește și ca revenire la culorile de acum) și „Deschis” (fundal
  alb cald, text negru, alamă mai închisă, cu contrast AA verificat).
- Previzualizare live: ecranul Aspect arată prima pagină a site-ului publicat într-un iframe. La fiecare
  mișcare din color picker, adminul trimite variabilele prin `postMessage`; un script mic din site le aplică
  doar când pagina e deschisă în iframe și mesajul vine de la originea adminului.
- Logo: literele sunt albe, deci pe fundal deschis ar dispărea. Se generează din PNG o variantă cu litere
  închise; site-ul o afișează pe cea potrivită după `scheme`.
- Pe site: toate culorile scrise direct în componente (aproximativ 120 de locuri) trec pe variabile semantice.
  Secțiunile pe fotografie (heroul, bannerele de pagină, banda de final, plăcile de categorii, headerul
  când stă peste hero) primesc clasa `on-photo`, care readuce în interiorul lor paleta închisă originală,
  deci text deschis în orice temă.
- `Layout` scrie variabilele calculate din `theme.json` într-un `<style>` inline și pune `data-scheme` pe
  `<html>`.

## 8. Login și siguranță

- Login cu email și parolă. Conturile le creăm noi (clientul și Mario), fără înregistrare publică.
- Conturile stau în variabila de mediu `ADMIN_USERS` (JSON: email, nume, hash). Hash-ul e scrypt din
  `node:crypto`; un script `npm run user` generează linia pentru un cont nou.
- Sesiune într-un cookie semnat HMAC (`SESSION_SECRET`), HttpOnly, Secure, SameSite=Strict, valabil 30 de
  zile. Toate rutele cer sesiune, în afară de `/login` și `/health`.
- Cererile care modifică date verifică originea în middleware, față de `ADMIN_ORIGIN` (verificarea din Astro
  e oprită, pentru că în spatele proxy-ului din Coolify ar vedea protocolul greșit).
- 5 încercări greșite pentru același email și IP blochează login-ul 15 minute.
- Commit-urile se fac cu un token GitHub fine-grained, limitat la `lox-mobila`: Contents citire și scriere,
  Actions citire. Tokenul stă doar în variabilele de mediu din Coolify.
- Adminul nu se indexează (`noindex`, `robots.txt` cu `Disallow: /`) și nu poate fi pus în iframe pe alte
  site-uri (`X-Frame-Options: DENY`).
- Parolă uitată: o resetează Mario, generând un hash nou. Nu există resetare prin email în prima versiune.

## 9. Publicarea

- O salvare construiește un singur commit prin Git Data API: blob-uri pentru fișierele noi, un tree peste
  cel curent (fișierele șterse primesc `sha: null`), commit, actualizarea ramurii `main`.
- Dacă între timp ramura s-a mișcat (de exemplu, Mario a dat push), adminul reface tree-ul peste noul
  commit și încearcă o dată. Pentru fișierul salvat câștigă ultima scriere.
- Mesaje de commit în română, cu numele utilizatorului ca autor: „Proiect nou: Bucătărie cu insulă”,
  „Proiect modificat: ...”, „Proiect șters: ...”, „Ordinea proiectelor”, „Culori”, „Contact și program”,
  „Recenzii”, „Texte categorii”, „Cifre”, „Poze pagini”.
- Starea publicării vine din GitHub Actions (rulările pentru SHA-ul commit-ului), cerută de admin la câteva
  secunde, până la final.
- Adminul citește conținutul curent tot din GitHub, cu un cache scurt golit după propriile commit-uri, ca să
  nu lucreze pe date vechi.

## 10. Cum arată adminul

- Interfață deschisă și neutră, ca la uneltele de lucru reale: fundal gri cald foarte deschis, panouri albe,
  text aproape negru, linii subțiri, Inter.
- Butonul principal e negru, cu radius 8 px; alama LOX apare doar în logo și la elementul activ din meniu.
- Liste dense cu miniaturi, fără carduri identice rotunjite, fără iconițe decorative, fără gradient.
- Pe formulare, bara cu „Salvează și publică” și „Renunță” stă fixată jos.
- Texte scurte și precise, în română, cu diacritice.

## 11. Structura codului

- Site: `src/content/*.json`, `src/content/schema.ts`, `src/lib/content.ts` (citire și validare),
  `src/lib/theme.ts` (calcul variabile și contrast), `scripts/logo-variants.py`.
- Admin: `admin/` cu `astro.config.mjs` (output server, adapter node standalone), `src/pages` (ecranele și
  rutele API), `src/lib/github.ts` (citire, commit, stare), `src/lib/images.ts` (sharp), `src/lib/auth.ts`,
  `src/scripts` (TypeScript vanilla pentru poze, ordonare, color picker, stare), `Dockerfile`.
- Ordonarea prin tragere folosește SortableJS (suportă touch); restul interactivității e TypeScript fără
  framework, ca în site.
- Mod local pentru teste: cu `LOCAL_REPO_DIR` setat, adminul scrie într-un clone local cu git, fără GitHub;
  așa se testează cap-coadă, inclusiv build-ul site-ului cu conținutul scris de admin.
- Testele site-ului nu fixează numere pe care clientul le schimbă (câte proiecte, câte recenzii), pentru că
  deploy-ul le rulează după fiecare salvare din admin.
- În Coolify: aplicație Dockerfile cu contextul la rădăcina repo-ului, `admin/Dockerfile`, watch paths pe
  `admin/**`, `src/content/schema.ts` și `src/lib/theme.ts`, ca un commit de conținut să nu redeployeze
  adminul.

## 12. Testare

- Vitest: schema (date valide și invalide), `slugify` și unicitatea, calculul temei și contrastul (inclusiv
  reproducerea temei originale), procesarea pozelor (rotire, dimensiune, lipsa EXIF), construirea
  commit-ului cu API-ul GitHub simulat (fișiere noi, șterse, reîncercare), sesiunea și limitarea login-ului.
- Testele existente ale site-ului (25) rămân verzi după mutarea datelor în JSON.
- Playwright: adminul la 390, 768 și 1280 px pe fiecare ecran; site-ul în tema originală și în cea deschisă
  la 1920, 1440, 1024, 768 și 390 px, fără suprapuneri și fără elemente ascunse. Tema originală trebuie să
  arate identic cu ce e acum.

## 13. Etape

1. **Site pregătit**: conținutul în JSON cu schemă, pozele proiectelor în foldere, culorile pe variabile,
   tema calculată din `theme.json`, varianta deschisă și logo-ul închis, scriptul de previzualizare. Se
   poate publica singur, fără admin.
2. **Admin local**: login, ecranele, poze, stare publicare. Ramura în care scrie adminul vine din
   `GITHUB_BRANCH`; local se scrie pe o ramură de test, care nu pornește deploy-ul, iar starea publicării se
   testează cu API-ul simulat.
3. **Deploy**: aplicația în Coolify pe `lox-admin.rtrsolutions.ro` pentru pitch, apoi `admin.loxmobila.ro`.

## 14. În afara primei versiuni

Resetare parolă prin email, roluri diferite, istoric cu anulare din interfață, editarea meniului, a pașilor
de proces, a materialelor și a heroului, câmpuri SEO, ciorne păstrate între sesiuni.

## 15. Ce trebuie de la Mario (la etapa 3)

- Un token GitHub fine-grained pentru `lox-mobila` (Contents citire și scriere, Actions citire).
- Înregistrarea DNS `lox-admin.rtrsolutions.ro` spre `178.104.230.135`.
- Emailul clientului pentru cont și parolele inițiale.

După ce adminul e live, commit-urile de conținut ajung direct pe `main`, deci înainte de lucru în cod se dă
`git pull`.
