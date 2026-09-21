import type { SiteData } from './types';

export const site: SiteData = {
  name: 'LOX Mobila',
  tagline: 'Idei. Design. Precizie.',
  city: 'Iași',
  county: 'județul Iași',
  domain: 'loxmobila.ro',

  // PLACEHOLDER: datele reale se cer clientului
  phoneDisplay: '0740 000 000',
  phoneHref: 'tel:+40740000000',
  whatsappNumber: '40740000000',
  email: 'contact@loxmobila.ro',
  address: 'Șos. Păcurari nr. 00, Iași',
  mapsUrl: 'https://maps.google.com/?q=Iasi',

  hours: [
    { days: 'Luni - Vineri', time: '08:00 - 17:00' }, // PLACEHOLDER
    { days: 'Sâmbătă', time: 'doar cu programare' }, // PLACEHOLDER
  ],

  social: [
    { label: 'Facebook', href: '#' }, // PLACEHOLDER
    { label: 'Instagram', href: '#' }, // PLACEHOLDER
  ],

  stats: [
    { value: '12', label: 'ani de atelier' }, // PLACEHOLDER
    { value: '340+', label: 'proiecte montate' }, // PLACEHOLDER
    { value: '2 mm', label: 'toleranța la care lucrăm' },
  ],

  nav: [
    { label: 'Cine suntem', href: '/cine-suntem', n: 'I' },
    { label: 'Ce construim', href: '/ce-construim', n: 'II' },
    { label: 'Proiecte', href: '/proiecte', n: 'III' },
    { label: 'Etapele lucrării', href: '/etape', n: 'IV' },
    { label: 'Materiale', href: '/materiale', n: 'V' },
    { label: 'Contact', href: '/contact', n: 'VII' },
  ],

  googleReviewsUrl: '#', // PLACEHOLDER
};
