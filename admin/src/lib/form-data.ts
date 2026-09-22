type Node = Record<string | number, unknown>;

/** Perechile nume/valoare dintr-un formular devin obiect: „hours.0.days” -> { hours: [{ days }] }. */
export function buildObject(entries: Iterable<[string, unknown]>): Record<string, unknown> {
  const root: Node = {};
  for (const [name, value] of entries) setPath(root, name.split('.'), value);
  return compact(root) as Record<string, unknown>;
}

function setPath(node: Node, keys: string[], value: unknown): void {
  let cur: Node = node;
  keys.forEach((k, i) => {
    const key = /^\d+$/.test(k) ? Number(k) : k;
    if (i === keys.length - 1) {
      cur[key] = value;
      return;
    }
    cur[key] ??= /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[key] as Node;
  });
}

// Randurile sterse lasa goluri in liste; le inchidem.
function compact(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((v) => v !== undefined).map(compact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, compact(v)]));
  }
  return value;
}

export const toLines = (s: string): string[] =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const toParagraphs = (s: string): string[] =>
  s
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
