import type { ImageMetadata } from 'astro';

type Folder = 'hero' | 'services' | 'projects' | 'workshop';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

export function resolveImage(folder: Folder, file: string): ImageMetadata {
  const key = `/src/assets/images/${folder}/${file}`;
  const mod = files[key];
  if (!mod) throw new Error(`Missing image: ${key}`);
  return mod.default;
}
