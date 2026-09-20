# LOX Mobila Iași: spec design preview

Data: 2026-09-20
Faza: preview de pitch (fără SEO fin, fără pachet legal, fără credit RTR)
Referință client: https://dekodoc.ro/
Logo: `/Users/mariorotaru/Downloads/3d0197ed-5ca4-40e6-93a7-163392f301e1.jpeg`

## 1. Context

LOX Mobila face mobilă la comandă în Iași. Nu este magazin: nu există coș, prețuri de raft sau catalog
de produse. Site-ul vinde un serviciu (proiectare, execuție, montaj) și are un singur scop: cerere de
ofertă prin WhatsApp sau telefon.

Tagline din logo: „IDEI. DESIGN. PRECIZIE." Domeniu de pe materialele de brand: loxmobila.ro.

## 2. Research de piață (Regula #2)

Site-uri analizate: dekodoc.ro (referința clientului), tandemcasa.ro, maravimob.ro, mobambient.ro,
sygmob.ro.

Numitor comun ca structură:
1. hero cu promisiune + oraș + CTA dublu (ofertă, WhatsApp)
2. argumente „de ce noi"
3. servicii pe categorii: bucătării, dressing, living, dormitor
4. portofoliu de proiecte reale, cu filtre și locație
5. proces în pași
6. ghid de materiale
7. despre + cifre
8. recenzii Google
9. CTA final
10. contact cu formular
11. footer

Observații vizuale:
- dekodoc.ro: structură bună, estetică de template (badge pill roșu uppercase, buton roșu + buton verde
  WhatsApp, sans geometric bold, poze de șantier).
- tandemcasa.ro: registrul cel mai apropiat de LOX. Foto edge-to-edge, tipografie spațiată, copy scurt.
- Toată piața e pe fundal alb. Un site dark se diferențiază imediat.

Decizie: luăm structura dekodoc (aprox. 90%), ridicăm execuția la registrul tandemcasa, pe paleta
logoului LOX.

## 3. Poziționare și ton

Nu „firmă de mobilă", ci atelier care execută pe cotă. Precizia este argumentul, nu prețul.

Ton: scurt, sigur, tehnic. Fără superlative. Fiecare afirmație are un detaliu concret de proces
(„verificăm cota pe loc înainte de debitare", „feronerie Blum cu amortizare").

De evitat în copy: „calitate superioară", „soluții personalizate", „echipa noastră de profesioniști",
săgeți și em-dash în exces, emoji.

## 4. Limbaj vizual: fișa de atelier

Obiectul real al meseriei este releveul cu cote și fișa de execuție. Site-ul împrumută din el:
- numerotare `01` la `06` cu linii fine de cotă în locul iconițelor în cerc
- fișă tehnică pe fiecare proiect: tip, cartier, material fronturi, feronerie, număr corpuri, blat, durată
- materialele într-un tabel comparativ, nu în carduri
- linii hairline de 1px în alamă ca separatoare, în locul umbrelor și al cardurilor

Interzis: gradient mesh, blob-uri, carduri flotante, grile de carduri identice rotunjite, etichete
uppercase deasupra fiecărui titlu de secțiune, avatare rotunde la recenzii, poze stock cu oameni.

Uppercase cu tracking larg este permis doar în nav, în numerele de secțiune și în fișele tehnice,
ca ecou al tagline-ului din logo.

## 5. Tokens

Culori extrase programatic din logo:

| Token | Valoare | Folosire |
|---|---|---|
| `--ink` | `#0C0C0C` | fundal de bază |
| `--ink-2` | `#141414` | suprafețe, benzi alternate |
| `--ink-3` | `#1E1E1E` | input-uri, hover pe suprafețe |
| `--line` | `#2A2A2A` | separatoare neutre |
| `--bone` | `#F2EFEA` | text principal |
| `--bone-2` | `#A8A39B` | text secundar (contrast AA pe `--ink`) |
| `--brass` | `#B7966B` | accent unic: linii, numere, butonul principal |
| `--brass-hi` | `#C9AA80` | hover pe accent |

Reguli: un singur accent. Butonul principal este alamă plin cu text `--ink`. WhatsApp este buton cu
contur, nu verde. Radius 10px pe butoane și input-uri, 4px pe imagini. Fără umbre colorate.

Tipografie:
- titluri: serif editorial cu contrast (Fraunces sau Instrument Serif, de validat vizual), `clamp()`
- body: sans neutru (Inter sau Geist), 16-18px, line-height 1.6
- etichete tehnice: același sans, uppercase, tracking 0.18em, 12-13px
- self-hosted, `font-display: swap`

Spacing pe scală de 4/8. Container max 1280px, gutter 20px mobil și 48px desktop.
Mișcare: 150-250ms ease-out, reveal discret la scroll, totul oprit la `prefers-reduced-motion`.

## 6. Structura paginilor

### `/` homepage

| # | Secțiune | Conținut și layout |
|---|---|---|
| 1 | Header | fix, 72px, transparent peste hero, `--ink` solid după scroll. Logo stânga, nav, telefon, buton „Cere ofertă". Mobil: drawer. Variabilă `--header-h`. |
| 2 | Hero | foto bucătărie edge-to-edge cu overlay întunecat, titlu serif („Mobilă făcută pe milimetrul tău."), linie alamă, subtitlu cu Iași, CTA „Cere ofertă" + link „Vezi proiectele". Rând de semnale: Proiectare 3D, Atelier propriu în Iași, Montaj inclus. Înălțime `min(100svh, 920px)`, verificat pe ecrane scurte. |
| 3 | Poziționare | două coloane: paragraf scurt + 3 cifre pe o linie cu separatoare hairline (ani, proiecte, corpuri montate). |
| 4 | Ce facem | layout asimetric: Bucătării ocupă jumătate, Dressing, Living, Dormitor în cealaltă jumătate, plus rând îngust pentru Băi și Spații comerciale. Imagine mare, titlu peste, o frază concretă. |
| 5 | Proiecte | 6 proiecte, filtre (Toate, Bucătării, Dressing, Dormitor, Living), fișă tehnică sub fiecare, lightbox. Link spre `/proiecte`. |
| 6 | Cum lucrăm | 6 pași `01`-`06`: discuție, măsurători la fața locului, schiță și preț, proiect 3D, execuție în atelier, livrare și montaj. Linie de cotă verticală în alamă. Fiecare pas are durata orientativă. |
| 7 | Materiale | tabel comparativ: PAL melaminat, MDF infoliat, MDF vopsit, furnir natural. Coloane: aspect, rezistență la umezeală, unde se potrivește, nivel de preț. Pe mobil devine listă de definiții. Sub tabel: feronerie (Blum, Hettich) și blaturi. |
| 8 | Atelierul | foto atelier + text de proces: debitare pe CNC, cantuire, verificarea cotei pe loc înainte de producție, montaj cu echipă proprie. |
| 9 | Recenzii | 3 recenzii ca text mare serif, cu nume, tip proiect și cartier. Fără avatare. Link „Vezi recenziile pe Google". |
| 10 | CTA | bandă `--ink-2`: „Spune-ne ce ai în cap. Măsurătorile sunt gratuite în Iași." + buton. |
| 11 | Contact | formular (nume, telefon, tip proiect, mesaj) care deschide WhatsApp cu mesaj precompletat. Alături: telefon, WhatsApp, adresă atelier, program. |
| 12 | Footer | logo, nav, contact, social. Fără credit RTR și fără linkuri legale la preview. |

### `/proiecte`
Galeria completă (12 proiecte), aceleași filtre, fișe tehnice și lightbox. CTA la final.

## 7. Arhitectură

Astro static + Tailwind CSS + tokens CSS vanilla. Zero framework JS: interactivitatea se face cu
scripturi mici vanilla în componente Astro. Output static, se urcă pe Hostinger.

Date într-un strat curat, ca trecerea la proiectul real (Keystatic sau SSR) să fie schimbare de sursă,
nu rescriere:

```
src/
  data/
    site.ts          nume, oraș, telefon, WhatsApp, adresă, program, social (placeholder-e marcate)
    services.ts      categoriile de servicii
    projects.ts      proiecte cu fișă tehnică + categorie + imagini
    process.ts       cei 6 pași
    materials.ts     rândurile tabelului
    reviews.ts       recenzii
  components/
    Header.astro, MobileNav.astro, Footer.astro
    Hero.astro, Positioning.astro, Services.astro
    ProjectGrid.astro, ProjectCard.astro, Lightbox.astro
    Process.astro, Materials.astro, Workshop.astro
    Reviews.astro, CtaBand.astro, ContactForm.astro
    ui/Button.astro, ui/SectionHeading.astro, ui/SpecList.astro
  layouts/Base.astro
  pages/index.astro, pages/proiecte.astro
  styles/tokens.css, styles/global.css
  scripts/filter.ts, scripts/lightbox.ts, scripts/whatsapp.ts, scripts/reveal.ts
  assets/images/
```

Fiecare componentă primește date prin props din `src/data`, nu are text hardcodat.

## 8. Comportament

- Filtrare portofoliu: butoane cu `aria-pressed`, ascund/arată carduri după `data-category`, fără reload.
- Lightbox: `<dialog>` nativ, navigare cu săgeți și Esc, focus returnat la declanșator.
- Formular: validare HTML nativă; la submit compune textul și deschide `https://wa.me/<nr>?text=...`.
  Fără backend la preview.
- Drawer mobil: focus trap, Esc închide, `body` fără scroll cât e deschis.
- Header: clasă `is-scrolled` după 24px.
- Fără JS, tot conținutul rămâne vizibil și lizibil.

## 9. Conținut placeholder

- Oraș: Iași. Cartiere folosite în fișe: Copou, Tătărași, Păcurari, Bucium, Nicolina, Valea Lupului.
- Telefon, WhatsApp, adresă, program, cifre: placeholder-e în `src/data/site.ts`, marcate cu comentariu
  `PLACEHOLDER`, de înlocuit cu datele clientului.
- Poze: **generate cu Higgsfield** (`gpt_image_2_5`), buget maxim **50 de credite**. Decizie a lui Mario
  din 2026-09-20, care înlocuiește regula inițială de a folosi doar fotografie de stoc.
  Costuri verificate: 1k low 1 credit, 2k medium 1.5, 2k high 3, 4k high 4.5.
  Repartiție: hero 4k high, restul 2k medium, rezervă pentru re-generări.
  Optimizate apoi prin `astro:assets` (AVIF/WebP, dimensiuni explicite, lazy sub fold).

  Constrângeri de prompt, obligatorii pe fiecare imagine:
  - fără oameni, fără text, fără logo-uri, fără firme lizibile
  - „real photograph, not a render"; fără estetică de randare 3D sau de agenție imobiliară
  - obiectiv 35mm sau 50mm, la înălțimea ochiului; fără ultrawide
  - low key: tonuri de grafit, negru mat, nuc, stejar, alamă, ca să stea pe `#0C0C0C`
  - grain fin, reflexii imperfecte, o singură sursă dominantă de lumină

  Fiecare imagine trece printr-o **poartă vizuală**: o inspectez cu Read înainte s-o pun în proiect și o
  resping dacă are: geometrie imposibilă, mânere sau balamale care nu se leagă, sertare fără logică,
  text mâzgălit, simetrie nefiresc de perfectă, plastic lucios, sau look de randare. Respinsele se
  regenerează din rezerva de credite. Dacă un subiect nu iese bun în 2 încercări, se renunță la el și se
  schimbă compoziția paginii, nu se acceptă o imagine slabă.
- Logo: recreat ca SVG (wordmark LOX + arc alamă + MOBILA) pornind de la imaginea clientului; dacă nu iese
  fidel, se folosește crop PNG din imaginea primită și se cere clientului sursa vectorială.

## 10. Calitate și verificare

- HTML semantic, un singur `h1`, landmark-uri, alt text, focus vizibil în alamă, contrast AA.
- Verificare vizuală cu Playwright la 360, 768, 1280 și 1440x700 (ecran scurt). Nicio suprapunere
  între header și hero, niciun overflow orizontal.
- `npm run build` fără erori și fără warning-uri înainte de a declara gata.
- Trecere finală pe lista anti-AI din Regula #1.

## 11. În afara scopului la preview

Keyword research și SEO on-page, schema LocalBusiness, sitemap, cookie banner, pagini legale, credit RTR,
pagini pe serviciu și pe oraș, blog, CMS, trimitere pe email prin Resend. Toate intră la dezvoltare,
după ce clientul acceptă.
