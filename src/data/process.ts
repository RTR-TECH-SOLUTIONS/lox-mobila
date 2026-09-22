import type { ProcessStep } from './types';

export const processSteps: ProcessStep[] = [
  {
    n: '01',
    title: 'Discuția',
    duration: '20 de minute',
    days: [0, 1],
    text: 'Ne suni sau ne scrii pe WhatsApp. Ne spui ce încăpere, ce îți dorești și cam ce buget ai. Îți spunem sincer dacă se leagă.',
  },
  {
    n: '02',
    title: 'Măsurătorile',
    duration: 'gratuit în Iași',
    days: [1, 4],
    text: 'Venim cu laserul și măsurăm tot: pereți, prize, țevi, abateri de la vertical. Peretele drept există doar în planuri.',
  },
  {
    n: '03',
    title: 'Schița și prețul',
    duration: '2-3 zile',
    days: [4, 7],
    text: 'Primești o schiță cotată și un preț defalcat pe corpuri, materiale și feronerie. Vezi exact pe ce se duc banii.',
  },
  {
    n: '04',
    title: 'Proiectul 3D',
    duration: '3-5 zile',
    days: [7, 12],
    text: 'După avans, modelăm totul 3D. Alegi culorile pe mostre fizice, la lumina din casa ta, nu de pe ecran.',
  },
  {
    n: '05',
    title: 'Execuția',
    duration: '2-6 săptămâni',
    days: [12, 40],
    text: 'Debităm pe CNC, cantuim și asamblăm de probă în atelier. Nimic nu pleacă la tine fără să fi fost montat o dată la noi.',
  },
  {
    n: '06',
    title: 'Montajul',
    duration: '1-3 zile',
    days: [40, 42],
    text: 'Montăm cu echipa noastră, nu cu subcontractori. Reglăm fiecare ușă, facem curat și îți predăm mobila gata de folosit.',
  },
];
