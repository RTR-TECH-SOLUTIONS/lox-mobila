import type { ImageMetadata } from 'astro';

type Folder = 'hero-led' | 'services' | 'projects' | 'workshop';

// `_raw` tine originalele dinainte de `scripts/regrade.py`. Glob-ul e eager,
// deci fara excludere Astro le-ar emite si pe ele in build.
const files = import.meta.glob<{ default: ImageMetadata }>(
  ['/src/assets/images/**/*.{jpg,jpeg,png,webp}', '!/src/assets/images/_raw/**'],
  { eager: true },
);

export function resolveImage(folder: Folder, file: string): ImageMetadata {
  const key = `/src/assets/images/${folder}/${file}`;
  const mod = files[key];
  if (!mod) throw new Error(`Missing image: ${key}`);
  return mod.default;
}
