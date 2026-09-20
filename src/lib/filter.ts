export const ALL = 'toate';

export function matchesFilter(category: string, active: string): boolean {
  return active === ALL || category === active;
}
