// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Domeniul clientului. Se poate suprascrie la build (preview, teste) cu PUBLIC_SITE_URL.
const site = process.env.PUBLIC_SITE_URL || 'https://loxmobila.ro';

// Gol pe domeniul propriu. A ramas pentru gazduirea in subfolder (GitHub Pages).
const base = process.env.PUBLIC_BASE_PATH ?? '';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
