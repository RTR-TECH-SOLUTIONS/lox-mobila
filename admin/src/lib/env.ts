import { existsSync } from 'node:fs';
import { HASH_FORMAT } from './password.mjs';

export interface AdminUser {
  email: string;
  name: string;
  /** scrypt:<sare>:<hash>, generat cu `npm run user` (sau scrypt$<sare>$<hash>, formatul vechi). */
  hash: string;
}

export interface AdminEnv {
  githubToken: string;
  repo: { owner: string; name: string };
  branch: string;
  /** Mod de test: adminul scrie intr-un clone local, fara GitHub. */
  localRepoDir?: string;
  sessionSecret: string;
  users: AdminUser[];
  siteUrl: string;
  adminOrigin: string;
}

export function readEnv(source: Record<string, string | undefined>): AdminEnv {
  const need = (key: string): string => {
    const value = source[key]?.trim();
    if (!value) throw new Error(`Lipseste variabila de mediu ${key}`);
    return value;
  };

  const localRepoDir = source.LOCAL_REPO_DIR?.trim() || undefined;
  const [owner, name] = need('GITHUB_REPO').split('/');
  if (!owner || !name) throw new Error('GITHUB_REPO trebuie sa fie de forma owner/repo');

  const sessionSecret = need('SESSION_SECRET');
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET trebuie sa aiba cel putin 32 de caractere');

  let users: unknown;
  try {
    users = JSON.parse(need('ADMIN_USERS'));
  } catch {
    throw new Error('ADMIN_USERS nu e JSON valid');
  }
  if (!Array.isArray(users)) throw new Error('ADMIN_USERS trebuie sa fie o lista');
  users.forEach(checkUser);

  return {
    githubToken: localRepoDir ? (source.GITHUB_TOKEN ?? '') : need('GITHUB_TOKEN'),
    repo: { owner, name },
    branch: source.GITHUB_BRANCH?.trim() || 'main',
    localRepoDir,
    sessionSecret,
    users: users as AdminUser[],
    siteUrl: need('PUBLIC_SITE_URL').replace(/\/$/, ''),
    adminOrigin: need('ADMIN_ORIGIN').replace(/\/$/, ''),
  };
}

/** Un cont stricat opreste pornirea (si /health), in loc sa lase pe toata lumea fara login. */
function checkUser(value: unknown, index: number): void {
  const u = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const bad =
    typeof u.email !== 'string' || !u.email.includes('@')
      ? 'email'
      : typeof u.name !== 'string' || !u.name.trim()
        ? 'name'
        : typeof u.hash !== 'string' || !HASH_FORMAT.test(u.hash)
          ? 'hash'
          : null;
  if (bad) throw new Error(`ADMIN_USERS: contul ${index + 1} nu e valid (${bad})`);
}

let cached: AdminEnv | undefined;

/** Configurarea curenta. Local se citeste din admin/.env (sau din fisierul numit in ADMIN_ENV_FILE). */
export function env(): AdminEnv {
  if (!cached) {
    const file = process.env.ADMIN_ENV_FILE ?? '.env';
    if (existsSync(file)) process.loadEnvFile(file);
    cached = readEnv(process.env);
  }
  return cached;
}
