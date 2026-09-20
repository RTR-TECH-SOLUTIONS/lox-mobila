import { describe, it, expect } from 'vitest';
import { HERO_SCALE, toMillimetres, formatMm } from '../src/lib/hero-measure';

const THIN = '\u2009'; // spatiu ingust intre mii, ca pe un desen de executie

describe('formatMm', () => {
  it('groups thousands with a thin space', () => {
    expect(formatMm(1280)).toBe(`1${THIN}280`);
    expect(formatMm(612)).toBe('610');
    expect(formatMm(0)).toBe('0');
  });

  it('rounds to the nearest 10 mm', () => {
    expect(formatMm(1287)).toBe(`1${THIN}290`);
    expect(formatMm(1284.4)).toBe(`1${THIN}280`);
  });

  it('groups millions too', () => {
    expect(formatMm(1234560)).toBe(`1${THIN}234${THIN}560`);
  });
});

describe('toMillimetres', () => {
  it('maps the left edge of the cabinet run to 0', () => {
    const { x } = toMillimetres(HERO_SCALE.spanX[0], 0.5);
    expect(x).toBeCloseTo(0, 5);
  });

  it('maps the right edge of the run to the full width', () => {
    const { x } = toMillimetres(HERO_SCALE.spanX[1], 0.5);
    expect(x).toBeCloseTo(HERO_SCALE.widthMm, 5);
  });

  it('measures height up from the floor, not down from the top', () => {
    const floor = toMillimetres(0.5, HERO_SCALE.spanY[1]);
    const top = toMillimetres(0.5, HERO_SCALE.spanY[0]);
    expect(floor.y).toBeCloseTo(0, 5);
    expect(top.y).toBeCloseTo(HERO_SCALE.heightMm, 5);
  });

  it('never reports a negative height below the floor', () => {
    expect(toMillimetres(0.5, 0.95).y).toBe(0);
  });

  it('extrapolates past the run instead of clamping x', () => {
    const { x } = toMillimetres(1, 0.5);
    expect(x).toBeGreaterThan(HERO_SCALE.widthMm);
  });
});
