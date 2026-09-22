import { describe, it, expect } from 'vitest';
import { readEnv } from '../src/lib/env';

const base = {
  GITHUB_TOKEN: 'token',
  GITHUB_REPO: 'RTR-TECH-SOLUTIONS/lox-mobila',
  SESSION_SECRET: 'x'.repeat(32),
  ADMIN_USERS: '[{"email":"atelier@loxmobila.ro","name":"Atelier","hash":"scrypt:a:b"}]',
  PUBLIC_SITE_URL: 'https://rtr-tech-solutions.github.io/lox-mobila/',
  ADMIN_ORIGIN: 'https://lox-admin.rtrsolutions.ro/',
};

describe('readEnv', () => {
  it('reads the production configuration', () => {
    const e = readEnv(base);
    expect(e.repo).toEqual({ owner: 'RTR-TECH-SOLUTIONS', name: 'lox-mobila' });
    expect(e.branch).toBe('main');
    expect(e.siteUrl).toBe('https://rtr-tech-solutions.github.io/lox-mobila');
    expect(e.adminOrigin).toBe('https://lox-admin.rtrsolutions.ro');
    expect(e.users[0].name).toBe('Atelier');
  });

  it('names the missing variable', () => {
    expect(() => readEnv({ ...base, GITHUB_TOKEN: '' })).toThrow('GITHUB_TOKEN');
  });

  it('does not need a GitHub token in local mode', () => {
    const e = readEnv({ ...base, GITHUB_TOKEN: undefined, LOCAL_REPO_DIR: '/tmp/lox-local' });
    expect(e.localRepoDir).toBe('/tmp/lox-local');
  });

  it('rejects a short session secret and broken user JSON', () => {
    expect(() => readEnv({ ...base, SESSION_SECRET: 'scurt' })).toThrow('SESSION_SECRET');
    expect(() => readEnv({ ...base, ADMIN_USERS: '[' })).toThrow('ADMIN_USERS');
  });

  const users = (...list: unknown[]) => ({ ...base, ADMIN_USERS: JSON.stringify(list) });
  const good = { email: 'atelier@loxmobila.ro', name: 'Atelier', hash: 'scrypt:a:b' };

  it('accepts both the new and the old hash format', () => {
    expect(readEnv(users(good, { ...good, email: 'b@loxmobila.ro', hash: 'scrypt$a$b' })).users).toHaveLength(2);
  });

  it('names the account and the field that are not valid', () => {
    // Coolify inlocuieste „$sare” cu text gol daca valoarea nu e marcata literal.
    expect(() => readEnv(users(good, { ...good, hash: 'scrypt' }))).toThrow('ADMIN_USERS: contul 2 nu e valid (hash)');
    expect(() => readEnv(users({ ...good, hash: 'scrypt:a' }))).toThrow('ADMIN_USERS: contul 1 nu e valid (hash)');
    expect(() => readEnv(users({ name: 'Atelier', hash: 'scrypt:a:b' }))).toThrow('ADMIN_USERS: contul 1 nu e valid (email)');
    expect(() => readEnv(users({ ...good, email: 'atelier' }))).toThrow('ADMIN_USERS: contul 1 nu e valid (email)');
    expect(() => readEnv(users({ ...good, name: ' ' }))).toThrow('ADMIN_USERS: contul 1 nu e valid (name)');
    expect(() => readEnv(users('atelier@loxmobila.ro'))).toThrow('ADMIN_USERS: contul 1 nu e valid (email)');
  });
});
