# LOX Mobila 🪑

A website for a made-to-measure furniture workshop in Iași, Romania. It also has an admin panel so the workshop can edit its own content.

🔗 **Live:** [loxmobila.ro](https://loxmobila.ro)

![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## About
LOX Mobila makes custom kitchens, wardrobes, and living-room and bedroom furniture. This repo has two apps: the public site and the admin panel. The site text is in Romanian.

## Features
- Pages for the catalogue, projects, workshop services, contact and legal info
- Animated hero where the LED lights switch on one by one
- Project grid with category filters
- Quote form that opens a ready-made WhatsApp message
- Local SEO for every page
- Admin panel to edit projects, photos, texts, contact details and colors

## Tech stack
- **Frontend:** Astro, TypeScript, Tailwind CSS
- **Admin:** Astro (server-side) with Node, `sharp` for images
- **Content:** JSON files checked with Zod
- **Testing:** Vitest and Playwright
- **Hosting:** Docker, Coolify, GitHub Actions

## Run it locally
```bash
npm install
npm run dev
```
For the admin panel, go into `admin/`, copy `.env.example` to `.env` and fill in your own keys. Then run `npm install` and `npm run dev` there too.

---
Made by **Mario Rotaru** · [RTR Tech Solutions](https://rtrsolutions.ro)
