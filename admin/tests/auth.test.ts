import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { LoginLimiter, findUser, hashPassword, readSession, signSession, verifyPassword } from '../src/lib/auth';

const SECRET = 's'.repeat(40);
const users = [{ email: 'atelier@loxmobila.ro', name: 'Atelier', hash: hashPassword('parola-lunga-1') }];

describe('passwords', () => {
  it('verifies the right password and rejects a wrong one', () => {
    const stored = hashPassword('parola-lunga-1');
    expect(stored).toMatch(/^scrypt:[\w-]+:[\w-]+$/);
    expect(verifyPassword('parola-lunga-1', stored)).toBe(true);
    expect(verifyPassword('parola-lunga-2', stored)).toBe(false);
    expect(verifyPassword('orice', 'stricat')).toBe(false);
    expect(verifyPassword('orice', 'scrypt::')).toBe(false);
  });

  it('still accepts hashes in the old scrypt$ format', () => {
    const old = hashPassword('parola-lunga-1').split(':').join('$');
    expect(old).toMatch(/^scrypt\$[\w-]+\$[\w-]+$/);
    expect(verifyPassword('parola-lunga-1', old)).toBe(true);
    expect(verifyPassword('parola-lunga-2', old)).toBe(false);
  });

  it('accepts hashes made by `npm run user`', () => {
    const line = execFileSync('node', ['scripts/user.mjs', 'a@b.ro', 'Ana', 'parola-de-test'], { encoding: 'utf8' });
    const { hash } = JSON.parse(line) as { hash: string };
    expect(hash.includes('$')).toBe(false);
    expect(verifyPassword('parola-de-test', hash)).toBe(true);
  });

  it('refuses to make an account for an email without @', () => {
    expect(() => execFileSync('node', ['scripts/user.mjs', 'atelier', 'Ana', 'parola-de-test'], { stdio: 'pipe' })).toThrow();
  });

  it('finds users by email regardless of case', () => {
    expect(findUser(users, ' Atelier@LoxMobila.ro ', 'parola-lunga-1')?.name).toBe('Atelier');
    expect(findUser(users, 'atelier@loxmobila.ro', 'gresit')).toBeNull();
    expect(findUser(users, 'nimeni@loxmobila.ro', 'parola-lunga-1')).toBeNull();
  });
});

describe('sessions', () => {
  const now = 1_700_000_000_000;

  it('reads back a signed session', () => {
    expect(readSession(signSession('atelier@loxmobila.ro', SECRET, now), SECRET, users, now)?.email).toBe('atelier@loxmobila.ro');
  });

  it('rejects a tampered, expired, foreign or missing token', () => {
    const token = signSession('atelier@loxmobila.ro', SECRET, now);
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ e: 'atelier@loxmobila.ro', x: now * 2 })).toString('base64url');
    expect(readSession(`${forged}.${sig}`, SECRET, users, now)).toBeNull();
    expect(readSession(`${payload}.${sig}`, SECRET, users, now + 31 * 864e5)).toBeNull();
    expect(readSession(token, 'alt-secret'.repeat(4), users, now)).toBeNull();
    expect(readSession(token, SECRET, [], now)).toBeNull();
    expect(readSession(undefined, SECRET, users, now)).toBeNull();
  });
});

describe('LoginLimiter', () => {
  it('blocks after 5 failures for 15 minutes, then lets the user try again', () => {
    const l = new LoginLimiter();
    const t = 1_000_000;
    for (let i = 0; i < 4; i++) l.fail('k', t);
    expect(l.blocked('k', t)).toBe(false);
    l.fail('k', t);
    expect(l.blocked('k', t + 60_000)).toBe(true);
    expect(l.blocked('k', t + 15 * 60_000 + 1)).toBe(false);
  });

  it('forgets failures after a successful login', () => {
    const l = new LoginLimiter();
    for (let i = 0; i < 5; i++) l.fail('k', 0);
    l.succeed('k');
    expect(l.blocked('k', 1)).toBe(false);
  });

  it('forgets expired keys instead of keeping them forever', () => {
    const l = new LoginLimiter();
    for (let i = 0; i < 50; i++) l.fail(`k${i}`, 0);
    expect(l.size).toBe(50);
    l.fail('nou', 15 * 60_000 + 1);
    expect(l.size).toBe(1);
  });
});
