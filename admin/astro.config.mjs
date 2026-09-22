// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Adminul foloseste schema si calculul temei din site: `@site` = ../src.
const siteSrc = fileURLToPath(new URL('../src', import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone', bodySizeLimit: 200 * 1024 * 1024 }),
  // Originea cererilor o verifica middleware-ul fata de ADMIN_ORIGIN, ca sa mearga si in spatele proxy-ului din Coolify.
  security: { checkOrigin: false },
  server: { port: 4400 },
  vite: {
    resolve: { alias: { '@site': siteSrc } },
    // scripturile din browser importa src/lib/theme.ts, din afara folderului adminului
    server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  },
});
