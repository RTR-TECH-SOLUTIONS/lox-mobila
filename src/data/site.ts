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
    { label: 'Acasă', href: '/' },
    {
      label: 'Mobilier',
      href: '/mobilier',
      children: [
        { label: 'Bucătării', href: '/mobilier/bucatarii' },
        { label: 'Dressing', href: '/mobilier/dressing' },
        { label: 'Dormitor', href: '/mobilier/dormitor' },
        { label: 'Living', href: '/mobilier/living' },
      ],
    },
    { label: 'Servicii', href: '/servicii' },
    { label: 'Materiale', href: '/materiale' },
    { label: 'Despre noi', href: '/cine-suntem' },
    { label: 'Contact', href: '/contact' },
  ],

  googleReviewsUrl: '#', // PLACEHOLDER
  googleRating: { score: '4,9', count: 38 }, // PLACEHOLDER: nota si numarul reale din profilul Google
};
