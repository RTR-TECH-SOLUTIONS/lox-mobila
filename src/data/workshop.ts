import type { WorkshopService } from './types';
import { pagePhotos, workshop } from '../lib/content';

// Textele, randurile de pret si nota se editeaza din admin: src/content/workshop.json.
// Titlul, ancora si coloanele raman aici: dupa ele se leaga meniul si subsolul.
export const workshopServices: WorkshopService[] = [
  {
    id: 'debitare',
    title: 'Debitare, cantuire și găurire',
    columns: ['Serviciu', 'Unitate', 'Preț'],
    image: pagePhotos.debitare,
    ...workshop.cutting,
  },
  {
    id: 'feronerie',
    title: 'Distribuție feronerie',
    columns: ['Produs', 'Unitate', 'Preț'],
    image: pagePhotos.feronerie,
    ...workshop.hardware,
  },
];
