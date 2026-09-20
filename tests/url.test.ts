import { describe, it, expect } from 'vitest';
import { url } from '../src/lib/url';

describe('url', () => {
  it('leaves external and hash links untouched', () => {
    expect(url('https://wa.me/40740000000')).toBe('https://wa.me/40740000000');
    expect(url('tel:+40740000000')).toBe('tel:+40740000000');
    expect(url('#contact')).toBe('#contact');
  });

  it('prefixes internal paths with the configured base', () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    expect(url('/proiecte')).toBe(`${base}/proiecte`);
    expect(url('/#contact')).toBe(`${base}/#contact`);
  });

  it('never returns an empty href for the root', () => {
    expect(url('/')).not.toBe('');
  });
});
