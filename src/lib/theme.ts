/**
 * Culorile site-ului din cele 3 alese in admin: fundal, text, accent. Restul nuantelor se
 * calculeaza de aici, ca orice combinatie sa ramana coerenta. Fara dependinte: ruleaza la build,
 * in admin pe server si in browser, la previzualizare.
 */

export interface ThemeColors {
  background: string;
  text: string;
  accent: string;
}

export type Scheme = 'dark' | 'light';

export interface ThemeWarning {
  field: 'text' | 'accent';
  message: string;
}

export const ORIGINAL_THEME: ThemeColors = { background: '#0C0C0C', text: '#F2EFEA', accent: '#B7966B' };
export const LIGHT_THEME: ThemeColors = { background: '#F5F2ED', text: '#151412', accent: '#86643A' };

type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Culoare invalida: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex(rgb: Rgb): string {
  const part = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0');
  return `#${rgb.map(part).join('')}`.toUpperCase();
}

/** `a` amestecat cu `t` din `b`: t = 0 da `a`, t = 1 da `b`. */
export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrastul WCAG intre doua culori, de la 1 la 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function schemeOf(background: string): Scheme {
  return contrast(background, '#FFFFFF') > contrast(background, '#000000') ? 'dark' : 'light';
}

function toHsl([r, g, b]: Rgb): Rgb {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function fromHsl([h, s, l]: Rgb): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** Accentul pentru hover: mai deschis si putin mai saturat pe fundal inchis, mai inchis pe fundal deschis. */
export function accentHi(accent: string, scheme: Scheme): string {
  const [h, s, l] = toHsl(parseHex(accent));
  return toHex(
    fromHsl(scheme === 'dark' ? [h, Math.min(1, s * 1.16), Math.min(1, l + 0.076)] : [h, s, Math.max(0, l - 0.08)]),
  );
}

/** Textul de pe butoanele pline: negru sau alb, care se citeste mai bine pe accent. */
export function onAccent(accent: string): string {
  return contrast(accent, '#0C0C0C') >= contrast(accent, '#FFFFFF') ? '#0C0C0C' : '#FFFFFF';
}

export function deriveTheme(c: ThemeColors): { scheme: Scheme; vars: Record<string, string> } {
  const scheme = schemeOf(c.background);
  const dark = scheme === 'dark';
  return {
    scheme,
    vars: {
      '--color-ink': c.background.toUpperCase(),
      '--color-ink-2': mix(c.background, c.text, 0.035),
      '--color-ink-3': mix(c.background, c.text, 0.08),
      '--color-line': mix(c.background, c.text, 0.13),
      '--color-deep': dark ? mix(c.background, '#000000', 0.35) : mix(c.background, c.text, 0.05),
      '--color-bone': c.text.toUpperCase(),
      '--color-bone-2': mix(c.text, c.background, 0.34),
      '--color-brass': c.accent.toUpperCase(),
      '--color-brass-hi': accentHi(c.accent, scheme),
      '--color-on-accent': onAccent(c.accent),
      '--photo-brass-hi': accentHi(c.accent, 'dark'),
      '--shadow-rgb': dark ? '0 0 0' : '38 30 20',
      '--shadow-k': dark ? '1' : '0.3',
    },
  };
}

export function themeCss(c: ThemeColors): string {
  const { scheme, vars } = deriveTheme(c);
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `:root{color-scheme:${scheme};${body}}`;
}

export function themeWarnings(c: ThemeColors): ThemeWarning[] {
  const out: ThemeWarning[] = [];
  if (contrast(c.text, c.background) < 4.5) out.push({ field: 'text', message: 'Textul se citește greu pe fundalul ăsta.' });
  if (contrast(c.accent, c.background) < 3) {
    out.push({ field: 'accent', message: 'Butoanele și linkurile se văd slab pe fundalul ăsta.' });
  }
  return out;
}
