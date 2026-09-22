import { z } from 'zod';

/**
 * Schema continutului editabil din admin. O folosesc si site-ul (la build), si adminul (inainte de
 * commit), ca un fisier acceptat de admin sa treaca sigur si de build. Nu importa nimic din restul
 * site-ului: fisierul intra in imaginea Docker a adminului.
 */

export const CATEGORY_KEYS = ['bucatarii', 'dressing', 'dormitor', 'living'] as const;
export type ProjectCategory = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  bucatarii: 'Bucătării',
  dressing: 'Dressing',
  dormitor: 'Dormitor',
  living: 'Living',
};

/** Placile de categorii de pe prima pagina, in ordinea afisarii. */
export const PAGE_PHOTO_KEYS = ['bucatarii', 'dressing', 'living', 'dormitor', 'bai', 'comercial'] as const;
export type PagePhotoKey = (typeof PAGE_PHOTO_KEYS)[number];

/** Caile din repo, aceleasi pentru site si admin. */
export const CONTENT_FILES = {
  projects: 'src/content/projects.json',
  reviews: 'src/content/reviews.json',
  categories: 'src/content/categories.json',
  contact: 'src/content/contact.json',
  stats: 'src/content/stats.json',
  pagePhotos: 'src/content/page-photos.json',
  theme: 'src/content/theme.json',
} as const;
export type ContentKey = keyof typeof CONTENT_FILES;

export const IMAGE_DIRS = {
  projects: 'src/assets/images/projects',
  services: 'src/assets/images/services',
  workshop: 'src/assets/images/workshop',
} as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROJECT_PHOTO = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]{2,16}\.(?:jpg|jpeg|png|webp)$/;
const PAGE_PHOTO = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|jpeg|png|webp)$/;

/** Tastaturile vechi scriu ş și ţ cu sedilă; le trecem pe cele corecte, cu virgulă. */
export const fixDiacritics = (s: string): string =>
  s.replace(/ş/g, 'ș').replace(/Ş/g, 'Ș').replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț');

const required = (max: number) =>
  z
    .string({ error: 'Câmpul e obligatoriu.' })
    .trim()
    .min(1, 'Câmpul e obligatoriu.')
    .max(max, `Cel mult ${max} de caractere.`)
    .transform(fixDiacritics);

const link = z
  .string({ error: 'Câmpul e obligatoriu.' })
  .trim()
  .refine((v) => v === '#' || /^https?:\/\/\S+$/.test(v), 'Linkul trebuie să înceapă cu https://');

/** „0740 000 000", „+40 740 000 000" sau „40740000000" devin „40740000000". */
export function toWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('40')) return digits;
  if (digits.startsWith('0')) return `4${digits}`;
  return digits;
}

/** Linkul tel: din numarul afisat: „0740 000 000" devine „tel:+40740000000". */
export function phoneHref(display: string): string {
  return `tel:+${toWhatsapp(display)}`;
}

const PHONE_MESSAGE = 'Numărul trebuie să aibă 10 cifre, de forma 0740 000 000.';

export const projectSchema = z.object({
  slug: z.string().regex(SLUG, 'Adresa paginii poate avea doar litere mici, cifre și cratime.'),
  title: required(80),
  category: z.enum(CATEGORY_KEYS, { error: 'Alege o categorie.' }),
  weeks: z
    .number({ error: 'Scrie durata ca număr de săptămâni.' })
    .int('Durata e un număr întreg de săptămâni.')
    .min(1, 'Minimum o săptămână.')
    .max(52, 'Maximum 52 de săptămâni.'),
  featured: z.boolean(),
  description: z
    .string()
    .trim()
    .max(1200, 'Cel mult 1200 de caractere.')
    .optional()
    .transform((v) => (v ? fixDiacritics(v) : undefined)),
  specs: z
    .array(z.object({ label: required(40), value: required(120) }))
    .min(1, 'Adaugă cel puțin o specificație.')
    .max(12, 'Cel mult 12 specificații.'),
  photos: z
    .array(z.string().regex(PROJECT_PHOTO, 'Cale de poză invalidă.'))
    .min(1, 'Proiectul are nevoie de cel puțin o poză.')
    .max(24, 'Cel mult 24 de poze pe proiect.'),
});

export const projectsSchema = z.array(projectSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((p, i) => {
    if (seen.has(p.slug)) {
      ctx.addIssue({ code: 'custom', path: [i, 'slug'], message: `Adresa „${p.slug}” e folosită de două proiecte.` });
    }
    seen.add(p.slug);
    p.photos.forEach((f, j) => {
      if (!f.startsWith(`${p.slug}/`)) {
        ctx.addIssue({ code: 'custom', path: [i, 'photos', j], message: `Poza ${f} nu e în folderul proiectului.` });
      }
    });
  });
});

export const reviewSchema = z.object({ author: required(60), project: required(80), text: required(600) });
export const reviewsSchema = z.array(reviewSchema).max(20, 'Cel mult 20 de recenzii.');

export const categoryPageSchema = z.object({
  key: z.enum(CATEGORY_KEYS),
  title: required(80),
  lead: required(200),
  body: z
    .array(
      z.object({
        heading: required(120),
        paragraphs: z.array(required(1500)),
        list: z
          .array(required(160))
          .optional()
          .transform((v) => (v && v.length ? v : undefined)),
      }),
    )
    .max(8, 'Cel mult 8 blocuri de text.'),
});

export const categoriesSchema = z.array(categoryPageSchema).superRefine((list, ctx) => {
  for (const key of CATEGORY_KEYS) {
    if (list.filter((c) => c.key === key).length !== 1) {
      ctx.addIssue({ code: 'custom', path: [], message: `Categoria ${CATEGORY_LABELS[key]} trebuie să apară o singură dată.` });
    }
  }
});

export const contactSchema = z.object({
  phoneDisplay: z
    .string({ error: 'Câmpul e obligatoriu.' })
    .trim()
    .refine((v) => /^40\d{9}$/.test(toWhatsapp(v)), PHONE_MESSAGE),
  whatsappNumber: z
    .string({ error: 'Câmpul e obligatoriu.' })
    .transform(toWhatsapp)
    .pipe(z.string().regex(/^40\d{9}$/, PHONE_MESSAGE)),
  email: z.email({ error: 'Adresa de email nu e validă.' }),
  address: required(120),
  mapsUrl: link,
  hours: z
    .array(z.object({ days: required(40), time: required(40) }))
    .min(1, 'Adaugă cel puțin un rând de program.')
    .max(7, 'Cel mult 7 rânduri de program.'),
  social: z.array(z.object({ label: required(30), href: link })).max(6, 'Cel mult 6 rețele.'),
  googleReviewsUrl: link,
});

export const statsSchema = z.object({
  stats: z.array(z.object({ value: required(12), label: required(60) })).length(3, 'Sunt exact 3 cifre.'),
  googleRating: z.object({
    score: z.string().trim().regex(/^[1-5](?:[.,]\d)?$/, 'Nota se scrie ca 4,9.'),
    count: z
      .number({ error: 'Scrie numărul de recenzii.' })
      .int('Numărul de recenzii e întreg.')
      .min(0, 'Numărul de recenzii nu poate fi negativ.'),
  }),
});

const pagePhoto = z.string().regex(PAGE_PHOTO, 'Nume de poză invalid.');

export const pagePhotosSchema = z.object({
  categories: z.object({
    bucatarii: pagePhoto,
    dressing: pagePhoto,
    living: pagePhoto,
    dormitor: pagePhoto,
    bai: pagePhoto,
    comercial: pagePhoto,
  }),
  atelier: pagePhoto,
});

const hex = z
  .string({ error: 'Alege o culoare.' })
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Culoarea se scrie ca #RRGGBB.')
  .transform((v) => v.toUpperCase());

export const themeSchema = z.object({ background: hex, text: hex, accent: hex });

export const CONTENT_SCHEMAS = {
  projects: projectsSchema,
  reviews: reviewsSchema,
  categories: categoriesSchema,
  contact: contactSchema,
  stats: statsSchema,
  pagePhotos: pagePhotosSchema,
  theme: themeSchema,
} as const;

export type Project = z.output<typeof projectSchema>;
export type Review = z.output<typeof reviewSchema>;
export type CategoryPageContent = z.output<typeof categoryPageSchema>;
export type Contact = z.output<typeof contactSchema>;
export type Stats = z.output<typeof statsSchema>;
export type PagePhotos = z.output<typeof pagePhotosSchema>;
export type Theme = z.output<typeof themeSchema>;
export type Content = { [K in ContentKey]: z.output<(typeof CONTENT_SCHEMAS)[K]> };

/** Erorile in forma „cale.camp: mesaj", pentru build si pentru formularele adminului. */
export function formatIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }));
}
