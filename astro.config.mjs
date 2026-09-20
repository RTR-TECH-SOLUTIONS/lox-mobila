// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Pe GitHub Pages site-ul sta in subfolderul repo-ului. Local `base` ramane gol,
// ca dev si preview sa mearga la radacina.
const base = process.env.PUBLIC_BASE_PATH ?? '';

export default defineConfig({
  site: 'https://rtr-tech-solutions.github.io',
  base,
  trailingSlash: 'ignore',
  vite: { plugins: [tailwindcss()] },
});
