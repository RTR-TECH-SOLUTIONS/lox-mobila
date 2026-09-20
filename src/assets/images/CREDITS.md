# Credite imagini — LOX Mobila (preview)

**Imagini generate cu AI, NU fotografii reale ale clientului.** De înlocuit cu fotografii proprii
(proiecte finalizate, atelier, echipă) la trecerea de la preview la proiectul real. Pana atunci
servesc doar pentru a arăta direcția de design într-un demo de prezentare.

- Model: `gpt_image_2_5` (Higgsfield)
- Setări: `resolution: 2k`, `quality: medium` (1.5 credite/imagine), aspect ratio 4:3 sau 16:9 după caz
- Dată generare: 2026-09-20
- Prompt: schelet fix (vezi `docs/superpowers/plans/2026-09-20-lox-mobila-preview.md`, Task 3) +
  subiect specific per imagine; 35mm f/4 pentru cadre de ansamblu, 50mm f/2.8 pentru cadre de detaliu
- Poartă vizuală: toate cele 19 imagini noi inspectate manual (Read) și acceptate din prima generare;
  nicio regenerare nu a fost necesară.

## Imagini noi generate (19, Task 3)

| Fișier | Job ID | AR | Obiectiv |
|---|---|---|---|
| `services/bucatarie.jpg` | `5c5dc82f-daf1-4fa0-9c94-af4bc2ee8fb6` | 4:3 | 35mm f/4 |
| `services/dressing.jpg` | `4055d24c-3f85-4545-a91e-ed929170e953` | 4:3 | 35mm f/4 |
| `services/living.jpg` | `e45cd5fb-7378-4bb2-a27f-6e416ccdafca` | 4:3 | 35mm f/4 |
| `services/dormitor.jpg` | `45d517f4-9247-4a16-b393-56dc68b99eec` | 4:3 | 35mm f/4 |
| `services/baie.jpg` | `7bd356e7-6801-4994-8364-dad437613f28` | 4:3 | 35mm f/4 |
| `services/comercial.jpg` | `511e6f47-b66c-49f1-9708-fdeb3a66e3c4` | 4:3 | 35mm f/4 |
| `projects/bucatarie-copou-02.jpg` | `fa36cd92-d189-4453-b3f3-a3a1f58d80e0` | 4:3 | 50mm f/2.8 (detaliu) |
| `projects/dressing-tatarasi-02.jpg` | `7045989a-6871-450b-bca8-78460e1818ca` | 4:3 | 50mm f/2.8 (detaliu) |
| `projects/living-bucium-01.jpg` | `a2c325eb-d461-4eee-9fac-9ec88cdf278f` | 4:3 | 35mm f/4 |
| `projects/bucatarie-valea-lupului-01.jpg` | `442e0d20-8392-463f-9522-caad7f539acb` | 16:9 | 35mm f/4 |
| `projects/bucatarie-valea-lupului-02.jpg` | `33597713-4313-4b3e-8a90-1326a99cb587` | 4:3 | 50mm f/2.8 (detaliu) |
| `projects/dormitor-pacurari-01.jpg` | `5852b51e-0d09-413c-8490-e5fefb5341c2` | 4:3 | 35mm f/4 |
| `projects/dressing-copou-01.jpg` | `b9915a78-7366-4b7e-a858-5404a17a809d` | 4:3 | 35mm f/4 |
| `projects/bucatarie-nicolina-01.jpg` | `6e4464b3-e99b-48e3-b9cc-4f65e720ab17` | 4:3 | 35mm f/4 |
| `projects/living-tatarasi-01.jpg` | `a24504a1-c0f1-4a43-9ec0-5ae795a33756` | 4:3 | 35mm f/4 |
| `projects/dormitor-bucium-01.jpg` | `f5faa9db-9cdb-45d4-a669-dd648ac633ba` | 4:3 | 35mm f/4 |
| `projects/bucatarie-pacurari-01.jpg` | `8e4db2d1-6638-469d-837e-287357a31717` | 16:9 | 35mm f/4 |
| `projects/dressing-nicolina-01.jpg` | `a7afa3fd-794b-4a09-a1db-845603ed2da6` | 4:3 | 35mm f/4 |
| `projects/living-valea-lupului-01.jpg` | `0894eb4d-266c-4745-896d-543865654884` | 4:3 | 50mm f/2.8 (detaliu) |

## Imagini refolosite din testul de calitate (Task 3, deja generate 2026-09-20)

Job ID-urile nu au fost păstrate din sesiunea de test; fișierele sursă sunt în `refs/test/`.

| Fișier | Sursă test | AR |
|---|---|---|
| `hero/hero.jpg` | `t0-kitchen-medium.png` | 16:9 |
| `projects/bucatarie-copou-01.jpg` | `t1-kitchen-high.png` | 16:9 |
| `projects/dressing-tatarasi-01.jpg` | `t2-dressing-medium.png` | 4:3 |
| `workshop/atelier.jpg` | `t3-workshop-medium.png` | 4:3 (nu 4:5, vezi nota de layout din plan) |

## Credite consumate

| Poziție | Credite |
|---|---|
| Test de calitate (sesiune anterioară) | 7.5 |
| 19 imagini noi (Task 3, `2k` / `medium`, 1.5 credite/buc) | 28.5 |
| Regenerări | 0 (toate acceptate din prima) |
| **Total consumat** | **36** |
| Plafon aprobat | 50 |
| Rămas din plafonul aprobat | 14 |
