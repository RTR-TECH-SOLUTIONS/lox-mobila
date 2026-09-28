import type { ProjectCategory } from './types';
import { processSteps } from './process';

/**
 * Titlul, descrierea si H1-ul fiecarei pagini, construite pe cate un keyword local confirmat de Mario
 * (28.09.2026). Stau in cod, nu in admin: textele le schimba clientul, keywordurile nu trebuie sa alunece.
 */
export interface PageSeo {
  keyword: string;
  title: string;
  description: string;
  h1: string;
}

const BRAND = 'LOX Mobila';

const step = (title: string) => processSteps.find((s) => s.title === title)?.duration ?? '';

export const seo = {
  home: {
    keyword: 'mobilă la comandă Iași',
    title: `Mobilă la comandă Iași | ${BRAND}`,
    description:
      'Mobilă la comandă în Iași: bucătării, dressinguri, living și dormitor, măsurate gratuit, proiectate 3D și făcute în atelierul nostru. Cere o ofertă.',
    h1: 'Mobilă la comandă în Iași, din atelierul nostru.',
  },
  servicii: {
    // Titlul tine doua keyworduri: „debitare și cantuire PAL” si „feronerie mobilă Iași”.
    keyword: 'debitare și cantuire PAL',
    title: `Debitare și cantuire PAL, feronerie mobilă Iași | ${BRAND}`,
    description:
      'Debitare și cantuire PAL și MDF în Iași, găurire pentru balamale și feronerie de mobilă: balamale, glisiere, mânere. Trimite lista de piese pe WhatsApp.',
    h1: 'Mobilă la comandă, debitare și feronerie în Iași',
  },
  materiale: {
    keyword: 'PAL sau MDF pentru bucătărie',
    title: `PAL sau MDF pentru bucătărie? Materiale comparate | ${BRAND}`,
    description:
      'PAL sau MDF pentru bucătărie? Comparăm PAL melaminat, MDF infoliat, MDF vopsit și furnir: cum arată, cum rezistă la umezeală și unde le folosim.',
    h1: 'PAL, MDF sau furnir: ce alegi',
  },
  etape: {
    keyword: 'cât durează o bucătărie la comandă',
    title: `Cât durează o bucătărie la comandă: etapele | ${BRAND}`,
    description:
      `Cât durează o bucătărie la comandă: măsurători gratuite în Iași, schiță în ${step('Schița și prețul')}, ` +
      `proiect 3D în ${step('Proiectul 3D')}, execuție în ${step('Execuția')}, montaj în ${step('Montajul')}.`,
    h1: 'Etapele lucrării și cât durează fiecare',
  },
} satisfies Record<string, PageSeo>;

/** Paginile de categorie. Titlul din admin ramane pe butoane si in formular; aici e ce vede Google. */
export const categorySeo: Record<ProjectCategory, PageSeo> = {
  bucatarii: {
    keyword: 'bucătării la comandă Iași',
    title: `Bucătării la comandă Iași | ${BRAND}`,
    description:
      'Bucătării la comandă în Iași, în L, în U sau cu insulă, pe cotele casei tale. Feronerie Blum, blat la alegere, măsurători gratuite și montaj cu echipa noastră.',
    h1: 'Bucătării la comandă în Iași',
  },
  dressing: {
    keyword: 'dressing la comandă Iași',
    title: `Dressing la comandă Iași | ${BRAND}`,
    description:
      'Dressing la comandă în Iași, din perete în perete și până în tavan: uși glisante sau batante, walk-in, iluminare LED. Măsurători gratuite și proiect 3D.',
    h1: 'Dressing la comandă în Iași',
  },
  dormitor: {
    keyword: 'mobilă dormitor la comandă Iași',
    title: `Mobilă dormitor la comandă Iași | ${BRAND}`,
    description:
      'Mobilă de dormitor la comandă în Iași: paturi cu ladă, tăblii tapițate, noptiere suspendate și dulapuri pe aceeași linie. Măsurători gratuite în Iași.',
    h1: 'Mobilă de dormitor la comandă în Iași',
  },
  living: {
    keyword: 'mobilă living la comandă Iași',
    title: `Mobilă living la comandă Iași | ${BRAND}`,
    description:
      'Mobilă de living la comandă în Iași: comode TV, biblioteci și placări de perete, cu cablurile ascunse din proiect. Măsurători gratuite și proiect 3D.',
    h1: 'Mobilă de living la comandă în Iași',
  },
};
