import type { ProjectCategory } from './types';
import { CATEGORY_LABELS } from './types';
import { categories } from '../lib/content';

export interface CategoryPage {
  key: ProjectCategory;
  label: string;
  /** Titlul paginii de categorie, ca „Mobilă bucătărie la comandă” la Mobili Design. */
  title: string;
  lead: string;
  /** Textul de sub catalog: titlu, paragrafe si o lista. */
  body: { heading: string; paragraphs: string[]; list?: string[] }[];
}

// Textele paginilor de categorie se editeaza din admin: src/content/categories.json.
export const categoryPages: CategoryPage[] = categories.map((c) => ({ ...c, label: CATEGORY_LABELS[c.key] }));
