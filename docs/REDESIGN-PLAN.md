# LOX Mobila: plan de redesign de la zero

Data: 2026-09-21
Faza: preview de pitch (fără SEO fin, fără pachet legal, fără credit RTR)
Stare: decizii finale în secțiunea 11, hero validat. Urmează faza 1 în codul real


> **Secțiunea 11 are prioritate peste tot restul.** Direcția luminoasă din secțiunile 3 și 10 a fost
> abandonată: site-ul rămâne negru cu auriu.

---

## 1. De ce arată ciudat acum (diagnostic)

Am pus versiunea curentă lângă șase site-uri din nișă, toate capturate la 1440 px, cap-coadă
(`refs/redesign/*-sheet1.jpg`). Problemele nu sunt de detaliu, sunt de fundație:

1. **Negru pe negru.** Fundal `#0C0C0C`, fotografii întunecate (luminozitate mediană 48 din 255,
   chiar și după regrade), text gri. Mobila, adică produsul, nu se vede. Niciun site bun din nișă
   nu face asta: toți vând cu fotografii luminoase pe fundal deschis.
2. **Prea mult text, prea mic.** 1 046 de cuvinte pe prima pagină, 11 500 px înălțime. Tandem Casa
   spune tot în cam 150 de cuvinte. Fișele tehnice de sub fiecare proiect, tabelul de materiale și
   lista de etape sunt trei blocuri de text mărunt unul după altul.
3. **Conceptul „fișă de atelier" a mâncat site-ul.** Laser, fire de păr cu cote, desen tehnic peste
   hero, rigle, acolade, cifre, etichete uppercase. Fiecare în parte are sens, toate la un loc
   dau senzația de „ciudat". Un client care vrea o bucătărie vrea să vadă bucătării.
4. **Imaginile se simt generate.** Toate au aceeași lumină de seară și aceeași paletă maro-negru,
   deci par același interior fotografiat de 23 de ori.

Concluzie: nu se repară cu runda 3 de retușuri. Se schimbă fundația: lumină, fotografie, densitate.

## 2. Ce am analizat

| Site | Ce e | Ce iau | Ce evit |
|---|---|---|---|
| dekodoc.ro (modelul clientului) | atelier Timișoara | **structura**: servicii, portofoliu cu filtre, 6 pași, materiale, recenzii Google, formular cu estimare | Inter bold peste tot, roșu + verde WhatsApp, badge-uri pill, grile de carduri cu iconițe, 8 „de ce noi" identice, titluri de 3 rânduri umplute cu orașe. Arată a template de AI |
| tandemcasa.ro | premium București | foto edge-to-edge alternată cu o singură frază centrată; bandă de categorii sub hero; butoane outline subțiri; fundal alb cald + footer negru | H1 de 20 px, prea șters pentru un atelier local |
| reformcph.com | Danemarca | hero împărțit în două fotografii; rând de 4 acțiuni simple; titluri mici, poza face treaba; o singură bandă colorată pe pagină | catalog de colecții (LOX nu are) |
| devolkitchens.co.uk | UK | serif clasic pe tot site-ul; grilă **asimetrică** 2 mari + 3 mici; legenda stă **sub** poză, nu peste ea | meniu uriaș |
| plainenglishdesign.co.uk | UK | pagina de start are 2 100 px: hero, o frază, 6 poze, gata. Încredere prin reținere | text peste poze, greu de citit |
| technestudio.ro | Tulcea | rând cu logourile furnizorilor (Blum, Egger, Häfele): dovadă reală, ieftină | același look de template ca dekodoc |
| kuxa.ro | București | „Află cât a costat această bucătărie": prețul real pe proiect convinge | densitate de magazin |

**Numitorul comun al celor bune:** fundal deschis și cald, fotografie mare și luminoasă, foarte
puțin text, un singur accent, butoane discrete, footer închis. Zero efecte.

## 3. Direcția nouă: „showroom luminos, atelier în detalii"

- **Fotografia vinde, nu efectele.** Fiecare ecran are o poză mare, luminoasă, în care se vede mobila.
- **Fundal bone** (`#F2EFEA`, culoarea deschisă din logo), text ink, **alamă** ca unic accent. Negrul logoului rămâne în
  două locuri: bara de sus peste hero și blocul final contact + footer. Așa logoul stă pe fundalul
  pentru care a fost desenat, fără să întunece tot site-ul.
- **Atelierul rămâne în copy și în detalii mici**, nu în decor: „cant ABS 2 mm", „Blum Legrabox",
  durata pe proiect, cifrele romane la secțiuni. Dispar laserul, firele de păr, desenul tehnic,
  riglele, acolada de sub titlu, parallaxul, galeria cu pin, cursorul custom.
- **Structura rămâne cea din dekodoc** (cerința clientului), comprimată: 7 secțiuni scurte pe prima
  pagină, restul pe pagini proprii.
- Regula de la Mario rămâne: **titluri scurte și seci, cifre romane, nimic spus de două ori.**

### Tokens (confirmat de Mario 2026-09-21: aceleași culori, inversate)

Paleta rămâne **exact cea din logo**, fără nicio culoare nouă. Se schimbă doar rolurile: bone devine
fundalul, ink devine textul.

| Token | Valoare | Rol nou |
|---|---|---|
| `--color-bone` | `#F2EFEA` | fundal de bază |
| `--color-ink` | `#0C0C0C` | text, header peste hero, bloc final contact + footer |
| `--color-brass` | `#B7966B` | accentul: buton principal (plin, text ink, 7,1:1), linii, cifre romane mari |
| `--color-brass-hi` | `#C9AA80` | hover pe buton |
| `--color-bone-2` | `#A8A39B` | text secundar **doar pe zonele ink** |
| `--color-line` | `#2A2A2A` | linii **doar pe zonele ink** |

Nuanțe derivate, tot din ink, nu culori noi:
- text secundar pe bone: ink la 68% opacitate (6,5:1)
- linii pe bone: ink la 14% opacitate
- fundal alternat: ink la 4% opacitate peste bone

Restricție de contrast: alama pe bone are 2,4:1, deci **nu se folosește pentru text** pe fundal
deschis. Pe bone alama apare ca suprafață (buton), linie sau cifră decorativă mare, niciodată ca
text de citit. Pe zonele ink rămâne ca acum.

### Tipografie

Se alege la checkpoint-ul 1 din trei perechi, pe o pagină de probă cu titlul real și un paragraf real:
A. Fraunces (fără WONK, fără italic jucăuș) + Inter. B. Newsreader + Inter. C. EB Garamond + Inter.
Recomandarea mea: **B**, e sobră, are diacritice bune și nu mai are nota „ciudată" a lui Fraunces.
Scară: display `clamp(2.5rem, 5.2vw, 4.5rem)`, h2 `clamp(1.75rem, 3vw, 2.5rem)`, body 1.0625rem /
1.65, text mic minimum 0.875rem. Uppercase cu tracking rămâne doar în legendele de sub poze.

## 4. Structura

### Prima pagină (țintă: sub 6 500 px la 1440, sub 450 de cuvinte)

| # | Secțiune | Conținut | Model |
|---|---|---|---|
| 0 | Hero | o fotografie luminoasă pe tot ecranul, titlul existent, o frază, **un** buton „Cere ofertă" + link „Vezi proiectele". Textul e vizibil din prima clipă, fără intro | Tandem |
| — | Bandă de categorii | Bucătării · Dressinguri · Living · Dormitor · Băi · Spații comerciale, linkuri spre `/proiecte` filtrat | Tandem |
| I | Cine suntem | o frază mare (claim-ul existent), poza atelierului, 3 cifre pe un rând. Paragrafele lungi se mută pe `/atelier` | Tandem |
| II | Ce construim | grilă asimetrică 2 mari + 4 mici, **legenda sub poză**, fără text peste imagine | deVOL |
| III | Proiecte | 4 proiecte mari, fiecare cu o singură linie: tip · cartier · durată. Fișa completă se deschide în lightbox și pe `/proiecte` | deVOL + KUXA |
| IV | Etapele lucrării | 6 pași pe un singur ecran: număr, nume, durată. Descrierea pe `/atelier` | dekodoc, fără carduri |
| V | Materiale | rând cu furnizorii (Egger, Blum, Hettich) + link spre tabelul complet de pe `/atelier` | Téchne |
| VI | Recenzii | 3 citate scurte + link Google | dekodoc, fără stele și avatare |
| VII | Contact | bloc ink: formular spre WhatsApp, telefon, adresă, program. Se continuă cu footerul | Tandem |

### Celelalte pagini

- `/proiecte`: grila cu filtre (există), cu fișa tehnică la fiecare proiect.
- `/atelier` (nouă): textul lung din „Cine suntem", cele 6 etape cu descriere, tabelul de materiale.
  Tot conținutul e deja scris, doar se mută de pe prima pagină.

Meniu: Cine suntem · Ce construim · Proiecte · Atelier · Contact + telefon + „Cere ofertă".

## 5. Imagini (decizia cea mai importantă)

Pozele actuale sunt gândite pentru un site negru și nu pot fi „luminate" până la nivelul Tandem fără
să se distrugă. Un site luminos cere poze luminoase. Variante:

- **A (recomandat): set nou generat**, ~14 imagini: 1 hero, 6 categorii, 6 proiecte, 1 atelier.
  Lumină de zi, fronturi deschise și lemn cald, unghiuri și apartamente **diferite** între ele, ca să
  nu mai pară același interior. Costă credite Higgsfield, deci pornesc doar cu OK-ul tău, după o
  probă de 2 imagini.
- **B: poze reale de la client.** Cel mai bun rezultat, dar blochează preview-ul până le trimite.
- **C: păstrăm pozele actuale** pe fundal deschis. Nu recomand: vor arăta ca niște găuri negre în pagină.

Criteriu măsurabil: luminozitate mediană a fiecărei poze ≥ 110 din 255 (acum: 40 până la 51).

## 6. Ce păstrez și ce șterg din cod

**Păstrez** (funcționează și e testat): Astro + Tailwind, `src/data/*` (tot copy-ul), `lib/images.ts`,
`lib/url.ts`, filtrul de proiecte, lightbox-ul, formularul spre WhatsApp, meniul mobil, cele 33 de
teste, deploy-ul pe GitHub Pages.

**Șterg:** `HeroBlueprint.astro`, `ProjectShowcase.astro` (galeria cu pin), `scripts/hero.ts`,
`cursor.ts`, `showcase.ts`, `motion.ts` (parallax, countup), `scripts/regrade.py` și `_raw/` dacă
alegem imagini noi, tema `.theme-paper` (devine tema de bază), toate animațiile de intro.

**Mișcare rămasă:** fade de 200 ms la apariția secțiunilor, zoom 1.02 la hover pe poze, atât.
Țintă JS: sub 6 KB (acum 9,1 KB).

**Logo:** varianta albă rămâne pe zonele ink. Pentru header-ul de pe fundal deschis (după scroll)
fac o variantă ink din PNG-ul existent, cu arcul de alamă păstrat. Sursa vectorială tot lipsește
de la client.

## 7. Fazele de lucru

Fiecare fază se închide cu capturi reale la 360×740, 768×1024, 1280×800, 1440×700, 1440×900.

| Fază | Ce iese | Checkpoint cu Mario |
|---|---|---|
| 0. Decizii | răspunsurile din secțiunea 9 | **da** |
| 1. Fundație | tokens noi, pagină de probă cu cele 3 perechi de fonturi, header + hero noi cu o imagine de probă | **da: aleg fontul și validez heroul** |
| 2. Imagini | probă de 2, apoi setul complet, optimizat prin `astro:assets` | **da, după probă** |
| 3. Prima pagină | secțiunile I până la VII + footer | **da: capturi desktop + mobil** |
| 4. Pagini | `/atelier` nouă, `/proiecte` pe tema nouă, lightbox | nu |
| 5. Curățenie + QA | cod mort șters, teste, `astro check`, build, contrast măsurat, tastatură, reduced motion, fără JS | nu |
| 6. Livrare | commit + push **doar la cererea ta** | da |

## 8. Criterii de „gata" (măsurabile)

- Prima pagină: sub 6 500 px la 1440, sub 450 de cuvinte, 7 secțiuni.
- Fotografia ocupă peste jumătate din suprafața paginii; nicio poză sub 110 luminozitate mediană.
- Niciun text peste fotografie în afară de hero.
- Un singur buton plin pe ecran. O singură culoare de accent. Zero verde, zero roșu.
- Contrast AA măsurat pe pixeli reali, inclusiv textul din hero.
- Nimic sub header-ul fix, nicio suprapunere, niciun scroll orizontal la cele 5 rezoluții.
- Titlul, fraza și butonul din hero vizibile la prima randare, fără animație de așteptat.
- Conținut complet fără JS și cu `prefers-reduced-motion`.
- Testul final: pus lângă Tandem și deVOL, nu lângă dekodoc, și să nu pară mai slab.

## 9. Ce am nevoie de la tine înainte să pornesc

1. ~~Direcția luminoasă~~ **Confirmat:** da, cu aceleași culori.
2. **Imagini:** varianta A (set nou generat, cu credite), B sau C?
3. **Pagina `/atelier`:** mut acolo textul lung, etapele detaliate și tabelul de materiale, ca prima
   pagină să rămână scurtă?

## 10. Decizii luate (2026-09-21)

- **Font:** B, Newsreader pe titluri + Inter pe text.
- **Culori:** rămân negru `#0C0C0C` și auriu/alamă `#B7966B`, cu bone `#F2EFEA` (paleta logoului).
  **Fundal: bone peste tot, inclusiv hero și footer. Nicio secțiune neagră.** Mario: „nu vreau să
  fie negru", apoi „nu vreau să rămână tot pe partea asta negru". Negrul `#0C0C0C` rămâne doar
  culoarea textului și a logoului; auriul pe butonul principal, cifrele romane și linii.
  - Hero împărțit: titlul, fraza și butonul pe bone în stânga, fotografia în dreapta (pe mobil
    fotografia vine sub text). Nu mai e text peste poză, deci nici gradient negru.
  - Footer pe bone, separat de pagină printr-o linie de 1 px.
  - Logoul: variantă cu literele în ink și arcul auriu păstrat, generată din PNG-ul existent.
- **Imagini:** pozele actuale rămân, fiindcă tonul lor negru-auriu e intenționat.
- **Câte o pagină pentru fiecare secțiune, pe prima pagină doar câte o bucată din fiecare.**

  | Pe prima pagină | Ce se vede | Duce la |
  |---|---|---|
  | Hero | titlu, o frază, „Cere ofertă" | `/contact` |
  | I. Cine suntem | claim-ul într-o frază + o poză a atelierului | `/cine-suntem` |
  | II. Ce construim | 3 categorii (bucătării, dressinguri, living) | `/ce-construim` (toate 6) |
  | III. Proiecte | 3 proiecte, doar poză + nume + cartier | `/proiecte` (toate 12, cu fișe) |
  | IV. Etapele lucrării | cele 6 nume de etape pe un rând, fără descrieri | `/etape` |
  | V. Materiale | o frază + furnizorii (Egger, Blum, Hettich) | `/materiale` (tabelul complet) |
  | VI. Recenzii | un singur citat | `/contact` |
  | VII. Contact | telefon, WhatsApp, „Cere ofertă" | `/contact` (formularul) |

  Fiecare bucată are un link „Vezi tot" spre pagina ei. Formularul complet stă doar pe `/contact`.
  Meniul duce spre pagini, nu spre ancore. Țintă prima pagină: sub 250 de cuvinte.

## 11. Decizii finale (2026-09-21, înlocuiesc secțiunile 3 și 10 unde se contrazic)

Mario: „nu vreau să fie cream nimic, vreau să fie negru asta cu auriu care e și acum, dar să-l faci
puțin să arate diferit" și „în hero vreau ceva bombă".

**Paletă:** exact cea de acum, fundal negru `#0C0C0C`, auriu `#B7966B`, text bone `#F2EFEA`. Nicio
secțiune crem.

**Ce îl face să arate diferit față de versiunea respinsă** (tot pe negru):
- Newsreader în loc de Fraunces: titluri mai sobre, fără italicul „ciudat" și fără acolada de cotă.
- Prima pagină doar cu câte o bucată din fiecare secțiune (tabelul din secțiunea 10 rămâne valabil),
  deci de 4 ori mai puțin text.
- Poze mari cu legenda **sub** ele, nu peste. Fără gradienți negri pe carduri.
- Dispar toate decorurile de „fișă": laser, fire de păr, desen tehnic, rigle, cotele din hero,
  galeria cu pin, parallax, cursorul custom.
- Auriul folosit mai curajos, dar tot rar: butonul principal, cifrele romane, câte o linie subțire.
- Zone alternate negru `#0C0C0C` / `#141414` ca să se vadă ritmul secțiunilor.

**Hero: LED-urile mobilei se aprind pe rând (ales de Mario după două iterații):**
- Clipul video Kling a fost respins („nu arată fancy"). În locul lui: o singură imagine Higgsfield
  (`refs/redesign/video/led-a.png`, bucătărie noaptea cu 7 zone LED), despărțită în cod în straturi
  de lumină aditive (`mix-blend-mode: plus-lighter`) peste o bază stinsă. ~460 KB în total.
- Ordinea: rafturile din stânga unul câte unul cu pâlpâire (0,3 / 0,56 / 0,82 s), banda de sub
  corpuri stânga-dreapta (1,15 s), profilul vertical de sus în jos (1,7 s), plintele (2,15 s), banda
  de sub insulă stânga-dreapta (2,35 s), restul camerei (2,8 s).
- **Textul apare abia după ce s-a aprins tot** (3,9 s): scena se estompează ușor și titlul, fraza
  și butoanele apar **centrate** (varianta C, aleasă de Mario).
- Fără JS sau cu `prefers-reduced-motion`: bucătăria aprinsă și textul, direct.
- Prototip: `scratchpad/proba/hero-led2.html?p=C`, capturi `refs/redesign/hero-C-*.jpg`.
- Fraza de sub titlu scurtată la „Bucătării, dressinguri și mobilier la comandă în Iași."

**Imagini:** celelalte poze rămân cele actuale (au deja tonul negru-auriu). Credite Higgsfield rămase: ~29.
