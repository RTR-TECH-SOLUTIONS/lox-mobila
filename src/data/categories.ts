import type { ProjectCategory } from './types';

export interface CategoryPage {
  key: ProjectCategory;
  label: string;
  /** Titlul paginii de categorie, ca „Mobilă bucătărie la comandă” la Mobili Design. */
  title: string;
  lead: string;
  /** Textul de sub catalog: titlu, paragrafe si o lista. */
  body: { heading: string; paragraphs: string[]; list?: string[] }[];
}

export const categoryPages: CategoryPage[] = [
  {
    key: 'bucatarii',
    label: 'Bucătării',
    title: 'Bucătării la comandă',
    lead: 'Corpuri calculate pe electrocasnicele tale, nu invers.',
    body: [
      {
        heading: 'Bucătării la comandă în Iași, făcute pe cotele casei tale',
        paragraphs: [
          'Măsurăm cu laserul tot ce contează într-o bucătărie: pereții, prizele, țevile și abaterile de la vertical. Corpurile se desenează pe electrocasnicele pe care le ai sau pe care le cumperi, iar blatul, fronturile și feroneria le alegem împreună, pe mostre.',
        ],
      },
      {
        heading: 'Ce tipuri de bucătării facem',
        paragraphs: [],
        list: ['Bucătării în L și în U', 'Bucătării cu insulă', 'Bucătării liniare, pentru garsoniere și apartamente mici', 'Bucătării deschise spre living'],
      },
      {
        heading: 'De ce o bucătărie din atelierul LOX',
        paragraphs: [],
        list: ['Feronerie Blum: Legrabox, Tandembox, Aventos', 'Blaturi din quartz, granit, compozit sau postforming', 'Montaj de probă în atelier înainte de livrare', 'Montaj cu echipa noastră, fără subcontractori'],
      },
    ],
  },
  {
    key: 'dressing',
    label: 'Dressing',
    title: 'Dressinguri la comandă',
    lead: 'Din perete în perete și până în tavan, fără plinte de umplutură.',
    body: [
      {
        heading: 'Dressinguri la comandă în Iași',
        paragraphs: [
          'Un dressing bun folosește fiecare centimetru al nișei. Îl desenăm pe cotele reale ale peretelui, cu uși glisante sau batante, sau complet deschis, cu iluminare LED pe senzor unde are sens.',
        ],
      },
      {
        heading: 'Ce facem',
        paragraphs: [],
        list: ['Dressinguri pe nișă, din perete în perete', 'Camere walk-in, fără uși', 'Dulapuri de hol cu cuier și banchetă', 'Sisteme de glisare Hettich și sertare cu amortizare'],
      },
    ],
  },
  {
    key: 'dormitor',
    label: 'Dormitor',
    title: 'Dormitoare la comandă',
    lead: 'Paturi cu ladă, noptiere suspendate, tăblii tapițate pe dimensiunea saltelei.',
    body: [
      {
        heading: 'Mobilier de dormitor la comandă în Iași',
        paragraphs: [
          'Patul, noptierele și dulapul se desenează împreună, ca să aibă aceleași materiale și aceeași linie. Pentru camerele de copii facem paturi etajate cu birou și rotunjim toate muchiile.',
        ],
      },
      {
        heading: 'Ce facem',
        paragraphs: [],
        list: ['Paturi cu ladă și ridicare pe amortizoare', 'Tăblii tapițate', 'Noptiere suspendate', 'Camere de copil cu pat etajat și birou'],
      },
    ],
  },
  {
    key: 'living',
    label: 'Living',
    title: 'Mobilier de living la comandă',
    lead: 'Comode TV, biblioteci și placări de perete cu cablurile ascunse din proiect.',
    body: [
      {
        heading: 'Mobilier de living la comandă în Iași',
        paragraphs: [
          'Peretele de TV, biblioteca și comoda se proiectează cu traseul cablurilor gândit de la început. Rafturile lungi le dimensionăm să nu facă săgeată, iar piesele suspendate le prindem pe șină ascunsă.',
        ],
      },
      {
        heading: 'Ce facem',
        paragraphs: [],
        list: ['Pereți TV cu bibliotecă', 'Biblioteci până în tavan, cu scară pe șină', 'Comode TV suspendate', 'Placări de perete din furnir sau MDF vopsit'],
      },
    ],
  },
];
