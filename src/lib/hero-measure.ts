/**
 * Conversia pozitiei cursorului in cote reale, pentru firele de par din hero.
 *
 * Reperele vin din masurarea fotografiei `hero/hero.jpg`: frontul cotat se intinde
 * intre 13,39% si 68,82% din latime, iar de la plinta (67,76%) pana in varful
 * corpurilor suspendate (11,25%) sunt 2220 mm. Reperele au fost detectate din imagine
 * prin maximele de gradient, nu citite din ochi.
 */
export interface HeroScale {
  /** fractiunile din latime intre care se intinde frontul cotat */
  spanX: readonly [number, number];
  /** latimea reala a frontului, in mm */
  widthMm: number;
  /** fractiunile din inaltime: [varful corpurilor, podea] */
  spanY: readonly [number, number];
  /** inaltimea reala de la podea pana in varful corpurilor, in mm */
  heightMm: number;
}

export const HERO_SCALE: HeroScale = {
  spanX: [0.1339, 0.6882],
  widthMm: 3850,
  spanY: [0.1125, 0.6776],
  heightMm: 2220,
};

export interface Measurement {
  x: number;
  y: number;
}

/**
 * `fx` si `fy` sunt fractiuni din latimea si inaltimea hero-ului (0..1).
 * X se masoara de la capatul din stanga al frontului, Y in sus de la podea.
 */
export function toMillimetres(fx: number, fy: number, scale: HeroScale = HERO_SCALE): Measurement {
  const [x0, x1] = scale.spanX;
  const [yTop, yFloor] = scale.spanY;

  // X extrapoleaza dincolo de front: cursorul poate iesi din zona cotata.
  const x = ((fx - x0) / (x1 - x0)) * scale.widthMm;

  // Y urca de la podea; sub podea nu exista cota, deci se opreste la 0.
  const y = Math.max(0, ((yFloor - fy) / (yFloor - yTop)) * scale.heightMm);

  return { x, y };
}

/** Rotunjeste la 10 mm si desparte miile cu spatiu ingust, ca pe un desen de executie. */
export function formatMm(value: number): string {
  const rounded = Math.round(value / 10) * 10;
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
