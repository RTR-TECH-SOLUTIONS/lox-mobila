import { CONTENT_FILES, CONTENT_SCHEMAS, parseContent, type Content, type ContentKey, type Issue } from '@site/content/schema';
import type { FileChange, Repo } from './github';

export class ValidationError extends Error {
  constructor(public issues: Issue[]) {
    super(issues.map((i) => `${i.path}: ${i.message}`).join('; '));
  }
}

/** Datele validate, sau ValidationError cu erorile pe campuri. */
export function check<T>(result: { ok: true; data: T } | { ok: false; issues: Issue[] }): T {
  if (!result.ok) throw new ValidationError(result.issues);
  return result.data;
}

export const serialize = (data: unknown): string => `${JSON.stringify(data, null, 2)}\n`;

// Citirile din GitHub se tin 30 de secunde; propriile salvari actualizeaza cache-ul imediat.
const TTL = 30_000;
const cache = new Map<ContentKey, { at: number; value: unknown }>();

export function clearContentCache(): void {
  cache.clear();
}

export async function readContent<K extends ContentKey>(repo: Repo, key: K): Promise<Content[K]> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as Content[K];
  const value = check(parseContent(CONTENT_SCHEMAS[key], JSON.parse(await repo.readText(CONTENT_FILES[key])))) as Content[K];
  cache.set(key, { at: Date.now(), value });
  return value;
}

export async function saveContent<K extends ContentKey>(
  repo: Repo,
  key: K,
  data: unknown,
  opts: { message: string; author: { name: string; email: string }; files?: FileChange[]; deletes?: string[] },
): Promise<string> {
  const value = check(parseContent(CONTENT_SCHEMAS[key], data)) as Content[K];
  const sha = await repo.commit({
    message: opts.message,
    author: opts.author,
    files: [{ path: CONTENT_FILES[key], content: serialize(value) }, ...(opts.files ?? [])],
    deletes: opts.deletes ?? [],
  });
  cache.set(key, { at: Date.now(), value });
  return sha;
}
