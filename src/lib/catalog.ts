import type { Project } from '../data/types';

/** Materialele de fronturi/carcasa gasite in fisa unui proiect, pentru filtrul din catalog. */
const MATERIALS: [RegExp, string][] = [
  [/MDF vopsit/i, 'MDF vopsit'],
  [/MDF infoliat/i, 'MDF infoliat'],
  [/PAL/, 'PAL melaminat'],
  [/Furnir/i, 'Furnir natural'],
];

export function projectMaterials(p: Project): string[] {
  const text = p.specs.map((s) => s.value).join(' ');
  return MATERIALS.filter(([re]) => re.test(text)).map(([, name]) => name);
}

export const allMaterials = MATERIALS.map(([, name]) => name);

/** Numar la plural corect in romana: 1 lucrare, 2 lucrări, 20 de lucrări. */
export function worksLabel(n: number): string {
  if (n === 1) return '1 lucrare';
  return n % 100 >= 20 || n % 100 === 0 ? `${n} de lucrări` : `${n} lucrări`;
}

/**
 * Proiectele din tab-ul unei categorii pe prima pagina: intai cele bifate „Pe prima pagina”,
 * apoi restul, in ordinea din admin.
 */
export function homeProjects(all: Project[], category: string, n = 3): Project[] {
  const inCategory = all.filter((p) => p.category === category);
  return [...inCategory.filter((p) => p.featured), ...inCategory.filter((p) => !p.featured)].slice(0, n);
}
