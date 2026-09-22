import type { ImageMetadata } from 'astro';

type Folder = 'hero-led' | 'services' | 'projects' | 'workshop';

// `_raw` tine originalele dinainte de `scripts/regrade.py`. Glob-ul e eager,
// deci fara excludere Astro le-ar emite si pe ele in build.
const files = import.meta.glob<{ default: ImageMetadata }>(
  ['/src/assets/images/**/*.{jpg,jpeg,png,webp}', '!/src/assets/images/_raw/**'],
  { eager: true },
);

// Pana primim pozele clientului, pozele de continut sunt placeholdere gri
// (scripts/placeholders.py). Heroul si banda de contact raman fotografii: sunt efectul de lumina.
// Pe false revin fotografiile.
const PLACEHOLDERS = false;
const PLACEHOLDER_FOLDERS: Folder[] = ['projects', 'services', 'workshop'];

export function resolveImage(folder: Folder, file: string): ImageMetadata {
  const dir = PLACEHOLDERS && PLACEHOLDER_FOLDERS.includes(folder) ? `placeholder/${folder}` : folder;
  const key = `/src/assets/images/${dir}/${file}`;
  const mod = files[key];
  if (!mod) throw new Error(`Missing image: ${key}`);
  return mod.default;
}
