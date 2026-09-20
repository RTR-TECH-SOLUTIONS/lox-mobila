# LOX Mobila

Preview de prezentare pentru LOX Mobila, firmă de mobilă la comandă din Iași.

Astro static, Tailwind CSS, fără framework JS. Tot conținutul stă în `src/data/`.

## Comenzi

```bash
npm install
npm run dev       # server local pe :4321
npm test          # teste Vitest
npx astro check   # verificare de tipuri
npm run build     # build static in dist/
```

## De știut

- **Datele clientului sunt încă placeholder.** Telefon, WhatsApp, adresă, program, cifre
  și linkul de recenzii Google se află toate în `src/data/site.ts`, marcate `PLACEHOLDER`.
- **Fotografiile sunt generate**, nu sunt lucrări ale firmei. Vezi `src/assets/images/CREDITS.md`.
  Se înlocuiesc cu poze reale înainte de lansare.
- Formularul de contact deschide WhatsApp cu mesajul precompletat; nu există backend.
- Fiind fază de preview, lipsesc intenționat: SEO fin, schema LocalBusiness, banner de
  cookie-uri și paginile legale.

## Deploy

Push pe `main` declanșează build și publicare pe GitHub Pages
(`.github/workflows/deploy.yml`). `PUBLIC_BASE_PATH` este setat automat de workflow,
pentru ca site-ul să funcționeze din subfolderul repo-ului.
