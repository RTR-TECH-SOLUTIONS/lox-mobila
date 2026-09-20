import { describe, it, expect } from 'vitest';
import { normalizeNumber, buildMessage, buildWhatsAppUrl } from '../src/lib/whatsapp';

const req = {
  name: 'Ana Pop',
  phone: '0740 111 222',
  projectType: 'Bucătărie',
  message: 'Apartament nou, 3,2 m de perete.',
};

describe('normalizeNumber', () => {
  it('converts local 07xx to 407xx', () => {
    expect(normalizeNumber('0740 000 000')).toBe('40740000000');
  });

  it('strips + and spaces', () => {
    expect(normalizeNumber('+40 740 000 000')).toBe('40740000000');
  });

  it('handles 0040 prefix', () => {
    expect(normalizeNumber('0040740000000')).toBe('40740000000');
  });
});

describe('buildMessage', () => {
  it('includes all fields on separate lines', () => {
    expect(buildMessage(req)).toBe(
      'Bună ziua, aș dori o ofertă.\n\nNume: Ana Pop\nTelefon: 0740 111 222\nProiect: Bucătărie\n\nApartament nou, 3,2 m de perete.',
    );
  });

  it('omits the details block when message is empty', () => {
    expect(buildMessage({ ...req, message: '   ' })).toBe(
      'Bună ziua, aș dori o ofertă.\n\nNume: Ana Pop\nTelefon: 0740 111 222\nProiect: Bucătărie',
    );
  });

  it('trims inputs', () => {
    expect(buildMessage({ ...req, name: '  Ana Pop  ' })).toContain('Nume: Ana Pop\n');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds an encoded wa.me url', () => {
    const url = buildWhatsAppUrl('0740 000 000', req);
    expect(url.startsWith('https://wa.me/40740000000?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1]!)).toBe(buildMessage(req));
  });
});
