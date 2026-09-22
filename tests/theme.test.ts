import { describe, it, expect } from 'vitest';
import {
  LIGHT_THEME,
  ORIGINAL_THEME,
  contrast,
  deriveTheme,
  parseHex,
  schemeOf,
  themeCss,
  themeWarnings,
} from '../src/lib/theme';

const close = (a: string, b: string, tol = 5) => {
  const x = parseHex(a);
  const y = parseHex(b);
  return x.every((v, i) => Math.abs(v - y[i]) <= tol);
};

describe('deriveTheme', () => {
  it('reproduces the current palette from the three original colors', () => {
    const { scheme, vars } = deriveTheme(ORIGINAL_THEME);
    expect(scheme).toBe('dark');
    const current: Record<string, string> = {
      '--color-ink': '#0C0C0C',
      '--color-ink-2': '#141414',
      '--color-ink-3': '#1E1E1E',
      '--color-line': '#2A2A2A',
      '--color-deep': '#080808',
      '--color-bone': '#F2EFEA',
      '--color-bone-2': '#A8A39B',
      '--color-brass': '#B7966B',
      '--color-brass-hi': '#C9AA80',
      '--photo-brass-hi': '#C9AA80',
    };
    for (const [name, value] of Object.entries(current)) {
      expect(close(vars[name], value), `${name}: ${vars[name]} fata de ${value}`).toBe(true);
    }
    expect(vars['--color-on-accent']).toBe('#0C0C0C');
    expect(vars['--shadow-rgb']).toBe('0 0 0');
    expect(vars['--shadow-k']).toBe('1');
  });

  it('switches to the light scheme on a light background', () => {
    expect(schemeOf('#F5F2ED')).toBe('light');
    expect(schemeOf('#0C0C0C')).toBe('dark');
    const { vars } = deriveTheme(LIGHT_THEME);
    expect(vars['--shadow-k']).toBe('0.3');
    expect(vars['--color-on-accent']).toBe('#FFFFFF');
  });
});

describe('contrast and warnings', () => {
  it('measures WCAG contrast', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });

  it('the light preset passes AA for text and accent', () => {
    expect(themeWarnings(LIGHT_THEME)).toEqual([]);
    expect(contrast(LIGHT_THEME.text, LIGHT_THEME.background)).toBeGreaterThanOrEqual(7);
    expect(contrast(LIGHT_THEME.accent, LIGHT_THEME.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('warns about text and accent that are hard to see', () => {
    const w = themeWarnings({ background: '#FFFFFF', text: '#CCCCCC', accent: '#EEEEEE' });
    expect(w.map((x) => x.field)).toEqual(['text', 'accent']);
  });
});

describe('themeCss', () => {
  it('writes color-scheme and every variable on :root', () => {
    const css = themeCss(ORIGINAL_THEME);
    expect(css.startsWith(':root{color-scheme:dark;')).toBe(true);
    expect(css).toContain('--color-ink:#0C0C0C');
    expect(css).toContain('--shadow-rgb:0 0 0');
  });
});
