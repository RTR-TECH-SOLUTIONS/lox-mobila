export type ProjectCategory = 'bucatarii' | 'dressing' | 'dormitor' | 'living';

export interface SiteData {
  name: string;
  tagline: string;
  city: string;
  county: string;
  domain: string;
  phoneDisplay: string;
  phoneHref: string;
  whatsappNumber: string;
  email: string;
  address: string;
  mapsUrl: string;
  hours: { days: string; time: string }[];
  social: { label: string; href: string }[];
  stats: { value: string; label: string }[];
  /** `n` = cifra romana a sectiunii, aceeasi pe prima pagina si pe pagina ei. */
  nav: { label: string; href: string; children?: { label: string; href: string }[] }[];
  googleReviewsUrl: string;
  googleRating: { score: string; count: number };
}

export interface Service {
  slug: string;
  title: string;
  line: string;
  image: string;
  size: 'lg' | 'md' | 'sm';
}

export interface ProjectSpec {
  label: string;
  value: string;
}

export interface Project {
  slug: string;
  title: string;
  category: ProjectCategory;
  weeks: number;
  cover: string;
  gallery: string[];
  specs: ProjectSpec[];
  featured: boolean;
}

export interface ProcessStep {
  n: string;
  title: string;
  text: string;
  duration: string;
  /** Zilele din graficul unei bucatarii obisnuite (0-42), [inceput, sfarsit]. */
  days: [number, number];
}

export interface MaterialRow {
  name: string;
  look: string;
  moisture: string;
  bestFor: string;
  price: 1 | 2 | 3 | 4;
}

export interface Review {
  author: string;
  project: string;
  text: string;
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  bucatarii: 'Bucătării',
  dressing: 'Dressing',
  dormitor: 'Dormitor',
  living: 'Living',
};
