import type { Service } from './types';
import { pagePhotos } from '../lib/content';

// Pozele placilor se schimba din admin: src/content/page-photos.json.
export const services: Service[] = [
  {
    slug: 'bucatarii',
    title: 'Bucătării',
    size: 'lg',
    image: pagePhotos.categories.bucatarii,
    line: 'Corpuri calculate pe electrocasnicele tale, nu invers. Blat, fronturi și feronerie alese împreună, pe mostre.',
  },
  {
    slug: 'dressing',
    title: 'Dressinguri',
    size: 'md',
    image: pagePhotos.categories.dressing,
    line: 'Din perete în perete și până în tavan, fără plinte de umplutură.',
  },
  {
    slug: 'living',
    title: 'Living',
    size: 'md',
    image: pagePhotos.categories.living,
    line: 'Comode TV, biblioteci și placări de perete cu cablurile ascunse din proiect.',
  },
  {
    slug: 'dormitor',
    title: 'Dormitor',
    size: 'md',
    image: pagePhotos.categories.dormitor,
    line: 'Paturi cu ladă, noptiere suspendate, tăblii tapițate pe dimensiunea saltelei.',
  },
  {
    slug: 'bai',
    title: 'Băi',
    size: 'sm',
    image: pagePhotos.categories.bai,
    line: 'Măști de lavoar din MDF hidrofug, vopsit în câmp electrostatic.',
  },
  {
    slug: 'comercial',
    title: 'Spații comerciale',
    size: 'sm',
    image: pagePhotos.categories.comercial,
    line: 'Recepții, cabinete și magazine, cu termen ferm în contract.',
  },
];
