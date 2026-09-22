import type { SiteData } from './types';
import { contact, stats } from '../lib/content';
import { phoneHref } from '../content/schema';

export const site: SiteData = {
  name: 'LOX Mobila',
  tagline: 'Idei. Design. Precizie.',
  city: 'Iași',
  county: 'județul Iași',
  domain: 'loxmobila.ro',

  // Contactul, programul, cifrele si nota Google se editeaza din admin:
  // src/content/contact.json si src/content/stats.json.
  ...contact,
  phoneHref: phoneHref(contact.phoneDisplay),
  ...stats,

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
};
