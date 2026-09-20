import { getImage } from 'astro:assets';
import { resolveImage } from './images';
import type { Project } from '../data/types';

export interface LightboxImage {
  src: string;
  alt: string;
}

export function projectAlt(project: Project): string {
  return `${project.title}, ${project.district}`;
}

/** URL-urile pentru lightbox (cover + galerie), pre-optimizate la build. */
export async function buildLightboxImages(project: Project): Promise<LightboxImage[]> {
  const alt = projectAlt(project);

  return Promise.all(
    [project.cover, ...project.gallery].map(async (file, i) => {
      const optimized = await getImage({
        src: resolveImage('projects', file),
        width: 1600,
        format: 'webp',
      });
      return { src: optimized.src, alt: i === 0 ? alt : `${alt}, detaliu` };
    }),
  );
}
