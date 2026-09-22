import type { z } from 'zod';
import {
  CONTENT_FILES,
  categoriesSchema,
  contactSchema,
  formatIssues,
  pagePhotosSchema,
  projectsSchema,
  reviewsSchema,
  statsSchema,
  themeSchema,
} from '../content/schema';
import projectsJson from '../content/projects.json';
import reviewsJson from '../content/reviews.json';
import categoriesJson from '../content/categories.json';
import contactJson from '../content/contact.json';
import statsJson from '../content/stats.json';
import pagePhotosJson from '../content/page-photos.json';
import themeJson from '../content/theme.json';

/** Valideaza un fisier de continut; o greseala opreste build-ul cu calea si campul exact. */
export function load<S extends z.ZodType>(file: string, schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const lines = formatIssues(result.error).map((i) => `  ${i.path || '(radacina)'}: ${i.message}`);
    throw new Error(`${file} nu e valid:\n${lines.join('\n')}`);
  }
  return result.data;
}

export const reviews = load(CONTENT_FILES.reviews, reviewsSchema, reviewsJson);
export const categories = load(CONTENT_FILES.categories, categoriesSchema, categoriesJson);
export const contact = load(CONTENT_FILES.contact, contactSchema, contactJson);
export const stats = load(CONTENT_FILES.stats, statsSchema, statsJson);
export const pagePhotos = load(CONTENT_FILES.pagePhotos, pagePhotosSchema, pagePhotosJson);
export const projects = load(CONTENT_FILES.projects, projectsSchema, projectsJson);
export const theme = load(CONTENT_FILES.theme, themeSchema, themeJson);
