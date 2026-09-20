# PROMPT: LOX Mobila, runda de design „să arate bombă"

Lucrezi pe preview-ul de pitch LOX Mobila (mobilă la comandă, Iași), în
`/Users/mariorotaru/Desktop/RTR TECH SOLUTIONS/website/lox mobila`. Site-ul există și funcționează.
Sarcina ta NU e să-l reconstruiești, ci să-l duci de la „corect și curat" la „memorabil".
Prioritatea zero este hero-ul.

## 1. Ce există (citește înainte să atingi ceva)

- Spec: `docs/superpowers/specs/2026-09-20-lox-mobila-preview-design.md`
- Stack: Astro 7 static, Tailwind 4, JS vanilla (7,6 KB total), fără framework UI. `npm run dev` pe :4321.
- Tokens: `src/styles/tokens.css`. Paletă extrasă din logo: ink `#0C0C0C`, ink-2 `#141414`,
  ink-3 `#1E1E1E`, line `#2A2A2A`, bone `#F2EFEA`, bone-2 `#A8A39B`, brass `#B7966B`. Un singur accent.
- Fonturi: Fraunces Variable (titluri), Inter Variable (body), self-hosted.
- Conținut: totul în `src/data/*.ts`. Niciun text hardcodat în componente dacă există în date.
- Animații existente: `src/scripts/{reveal,motion,showcase,cursor,filter}.ts`. Reveal-urile au trei
  variante (`data-reveal`, `data-reveal="clip"`, `.reveal-title`). Galeria de proiecte e fixată
  orizontal pe desktop și carusel nativ pe mobil.
- Imagini: 23 generate cu Higgsfield `gpt_image_2_5` (2k medium, 1,5 credite). Rețeta și scheletul de
  prompt sunt în memoria `higgsfield-imagini-site`. Logoul e PNG cu alfa în `src/assets/brand/`.
- Teste: `npm test` (22), `npx astro check`, `npm run build`. Toate trec acum și trebuie să treacă la final.

## 2. Reguli care nu se negociază

- Regula #1 din CLAUDE.md global: să NU pară făcut de AI. Fără emoji, gradient mesh, carduri flotante,
  grile de carduri identice rotunjite, iconițe în cerc, eyebrow uppercase deasupra titlurilor, avatare,
  poze cu oameni, copy generic. Em-dash maximum unul pe secțiune.
- Limbajul vizual e **fișa de atelier / releveul cu cote**. Orice element nou trebuie să vină din lumea
  asta (linii de cotă, cifre în mm, hârtie de plan, laser de măsurat), nu din lumea landing-urilor.
- Un singur accent (alamă). Radius 10px pe UI, 4px pe imagini. Fără verde WhatsApp.
- Fiecare animație: oprită la `prefers-reduced-motion`, iar fără JS conținutul rămâne vizibil.
  Capcană deja întâlnită: un element tăiat complet cu `clip-path` nu e văzut de IntersectionObserver.
- Buget JS total: maximum 15 KB. Fără GSAP, fără Lenis, fără biblioteci de animație.
- Buget Higgsfield: au rămas **14 credite** din plafonul de 50. Nu-l depăși. Doar imagini, **niciun
  video** în runda asta. Repartiția e la punctul 4. Fiecare generare se inspectează cu Read înainte
  să intre în proiect.
- Fără `git init`, commit sau push. Preview, deci fără SEO fin și fără pachet legal.
- Header fix: nimic nu are voie să intre sub el. Verifică la 360x740, 768x1024, 1280x800, 1440x700, 1440x900.

## 3. Review sincer al stării actuale

Ce e bun și rămâne: structura paginii, fișele tehnice pe proiecte, tabelul de materiale, rândurile
de proces cu linie de cotă, galeria orizontală fixată, formularul WhatsApp, copy-ul.

Ce ține site-ul pe loc:

**A. Hero-ul e corect, dar oricine îl putea face.** Poză întunecată full-bleed, titlu jos-stânga,
două butoane. Animația de intrare e plăcută, dar nu spune nimic despre LOX. Promisiunea din titlu
(„pe milimetrul tău") nu se vede nicăieri în imagine. E cea mai mare ocazie ratată de pe pagină.

**B. Monotonie tonală.** Toate secțiunile sunt negre și toate cele 23 de imagini sunt low-key, în
aceeași gamă. După trei ecrane ochiul nu mai distinge nimic. Lipsește un contrapunct luminos.

**C. Secțiunea de poziționare e cea mai slabă.** Un paragraf și trei cifre într-un gol mare.
Arată a umplutură între hero și servicii.

**D. Arcul de alamă din logo nu e folosit nicăieri.** E singurul semn grafic propriu al brandului și
stă doar în header, la 34px. Site-ul n-are un motiv recurent.

**E. Procesul și materialele sunt doar text.** Bune ca limbaj, dar două secțiuni la rând fără nicio
imagine sau desen. Materialele descriu texturi pe care nu le arată.

**F. Finalul paginii se stinge.** Recenziile, banda CTA și footerul sunt toate text pe negru, fără
niciun moment vizual. Pagina n-are un final.

**G. Detalii.** Etichetele `.label` (0,78rem, bone-2) sunt la limita lizibilității. Butonul din header
e greu și nu se retrage la scroll. Pe mobil, semnalele din hero cad pe trei rânduri. Nu există imagine
OG, deci linkul trimis clientului pe WhatsApp apare fără preview. Nu există pagină 404.
Textul de pe cardurile de servicii stă pe zone de imagine cu contrast variabil.

## 4. Planul

### P0. Hero: „Din cotă în realitate"

Ideea: hero-ul arată exact ce face firma. Începe ca releveu desenat și devine fotografia.

1. **Desenul.** Un SVG inline, trasat peste fotografia de hero (`src/assets/images/hero/hero.jpg`),
   care urmează muchiile mari ale bucătăriei: linia corpurilor suspendate, blatul, coloana cuptorului,
   fereastra, plinta. Linii de 1px în alamă. Trei sau patru linii de cotă cu săgeți de capăt și valori
   în mm, în stilul `.label` cu cifre tabulare (`3 420`, `2 680`, `600`). Coordonatele se stabilesc
   măsurând pe imagine, nu din ochi: deschide poza, notează pozițiile muchiilor în procente.
2. **Secvența de intrare** (sub 2,4s în total, fotografia se încarcă `eager` în paralel, LCP-ul nu are
   voie să aștepte animația):
   - 0 la 1,1s: pe fundal ink, liniile se desenează cu `stroke-dashoffset`, cotele apar la capăt.
   - 0,9 la 2,0s: o linie verticală de alamă („laserul") traversează ecranul de la stânga la dreapta,
     iar fotografia se dezvăluie în urma ei prin `clip-path`.
   - după: desenul scade la opacitate mică, rămân vii doar două cote. Titlul urcă linie cu linie
     (animația există deja, se păstrează).
3. **Titlul.** Același text, dar „milimetrul" în Fraunces italic, iar sub cuvânt o mică acoladă de
   cotă cu `1 mm`. Scara de display mai mare: până la `clamp(2.75rem, 1.2rem + 6.4vw, 7rem)`.
4. **Interacțiunea-semnătură (doar desktop, pointer fin):** două fire de păr în alamă, unul orizontal
   și unul vertical, urmăresc cursorul peste hero, cu un afișaj mic lângă intersecție:
   `X 1 284 · Y 0 612` în mm, calculat din poziția cursorului raportată la lățimea reală din cote.
   E jucăuș, precis și imposibil de confundat cu un template. Dispare când cursorul e peste butoane.
5. **Fallback-uri.** Mobil: fotografia plus desenul static la opacitate mică, fără fire de păr.
   Reduced motion și fără JS: fotografia și cotele statice, totul vizibil din prima.
6. **Loc pregătit pentru video, fără video acum.** Clientul va trimite ulterior filmări reale din
   atelier. Nu genera niciun video. Construiește `.hero__media` astfel încât un `<video>` cu `poster`
   să poată înlocui mai târziu fotografia fără refactor (același container, aceeași secvență de dezvăluire).
7. **Punct de control.** După hero, oprește-te și arată-i lui Mario capturi din 3 momente ale secvenței
   plus starea finală, la 1440x900 și 360x740. Continui cu restul doar după ce confirmă direcția.

### P0. Ritm tonal

- **O secțiune „pe hârtie".** Materialele trec pe fundal bone `#F2EFEA` cu text ink: tabelul devine
  literalmente fișa tehnică tipărită. Adaugă tokens pentru tema inversă, verifică contrastul AA
  (alamă pe bone NU trece pentru text mic: pe hârtie accentul rămâne pe linii, textul e ink).
  Tranziția dintre negru și hârtie se face cu o muchie dreaptă, fără gradient.
- **Mostre reale de material.** Patru texturi macro (PAL melaminat, MDF infoliat, MDF vopsit mat,
  furnir de stejar), generate la `1k low` = 1 credit bucata, **4 credite** în total. Intră în tabel ca
  mostre dreptunghiulare de 96x64, cu colț de 2px, ca într-un mostrar.
- **Imagini mai deschise, gratis.** Nu genera altele. Regradează cu Pillow 4-5 dintre cele existente
  (curbă pe tonurile medii, +10-15% expunere, fără să arzi luminile) acolo unde imaginea stă mică:
  cardurile `md` de la servicii și coperțile din `/proiecte`. Compară înainte/după cu Read.

Buget: 4 credite pe texturi. Din restul de 10 ai voie la maximum 4 imagini noi, mai luminoase
(lumină de zi, 2k medium, 1,5 credite), doar dacă regradarea nu rezolvă monotonia. Ce rămâne, rămâne necheltuit.

### P0. Poziționarea, refăcută ca ruletă

Paragraful devine o declarație mare în Fraunces (2-3 rânduri, un cuvânt în italic). Cele trei cifre se
așază pe o **riglă orizontală**: o linie de alamă cu gradații din 10 în 10, pe care cifrele stau ca
repere cotate. La scroll rigla se desenează de la stânga, iar cifrele numără (numărătoarea există).

### P0. Arcul de alamă ca motiv

Redesenează arcul din logo ca path SVG (curbă simplă, groasă la mijloc, ascuțită la capete) și
folosește-l de trei ori, nu mai mult: mare, traversând banda CTA, desenat la scroll; în footer, peste
un wordmark LOX supradimensionat, tăiat de marginea de jos a paginii; pe pagina 404.

### P1. Finisaje pe ce există

- **Galeria de proiecte:** panourile care nu sunt curente scad la 55% luminozitate; titlul și fișa
  panoului curent intră eșalonat când devine curent; drag cu mouse-ul; săgeți stânga/dreapta din tastatură.
- **Proces:** o linie verticală de alamă care se umple pe măsură ce derulezi prin cei șase pași. Pe
  desktop, în stânga, un desen tehnic sticky care se schimbă per pas (laser, schiță cotată, corp 3D în
  axonometrie, placă pe CNC, corp asamblat, ușă reglată). Desene liniare de 1px, fără cercuri, fără umplere.
- **Header:** se ascunde la scroll în jos, reapare la scroll în sus; butonul se micșorează după hero.
- **Servicii:** la hover imaginea se luminează și apare numărul de ordine; asigură contrast constant
  sub text (bandă ink cu opacitate fixă, nu gradient dependent de poză).
- **Imagine OG** 1200x630 din hero, cu logoul, plus `og:title` și `og:description`. Contează la pitch.
- **Pagina 404** cu arcul și un singur link înapoi.

### P2. Dacă mai e timp

- Recenzii: una mare, evidențiată, celelalte două mici; sumar „5,0 · 47 de recenzii pe Google" marcat `PLACEHOLDER`.
- Atelier: o bandă de trei detalii decupate din aceeași fotografie (gratis), sub imaginea mare.
- Micro-interacțiuni: sublinierea linkurilor se desenează la hover; butonul primar se umple cu o
  baleiere de la stânga; select cu săgeată proprie; stare de confirmare după trimiterea formularului.
- Tipografie: `.label` la 0,8125rem; axa `opsz` a lui Fraunces la titlurile mari; tracking negativ
  ușor mai strâns pe display; tokens pentru durate și easing, ca animațiile să aibă același ritm.
- Mobil: semnalele din hero pe un singur rând derulabil sau reduse la două.

## 5. Cum lucrezi

1. Citește spec-ul și componentele pe care le atingi. Respectă stilul codului existent.
2. Hero întâi, apoi punctul de control cu Mario. Apoi P0 în ordinea de mai sus, apoi P1, apoi P2.
3. După fiecare secțiune: captură Playwright, te uiți efectiv la ea, corectezi. Nu te baza pe cod.
   Pentru animații, capturează stări intermediare (`setTimeout` + screenshot), nu doar finalul.
4. Logica pură nouă (de exemplu conversia poziției cursorului în mm) stă în `src/lib/` și are test Vitest.
5. La final rulezi `npm test`, `npx astro check`, `npm run build`, verifici matricea de ecrane,
   reduced motion, fără JS, focus vizibil, contrast AA inclusiv pe secțiunea de hârtie, și raportezi
   dimensiunea JS.

## 6. Gata înseamnă

- Hero-ul poate fi descris într-o frază de cineva care l-a văzut o singură dată („ăla cu laserul care
  măsoară bucătăria").
- Pagina are cel puțin un moment luminos și un final vizual, nu se stinge în text pe negru.
- Arcul de alamă apare ca motiv, de maximum trei ori.
- Nicio regulă din secțiunea 2 încălcată, toate verificările din secțiunea 5 trecute, bugetul de
  14 credite nedepășit, niciun video generat, iar consumul raportat.
- Lista de placeholder-e de cerut clientului e actualizată cu ce ai adăugat.
