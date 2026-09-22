import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AdminUser } from './env';
import { HASH_FORMAT, hashPassword } from './password.mjs';

export { hashPassword };

export function verifyPassword(password: string, stored: string): boolean {
  const [, salt, hash] = HASH_FORMAT.exec(stored) ?? [];
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  if (!expected.length) return false;
  const actual = scryptSync(password, Buffer.from(salt, 'base64url'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Verificam o parola si cand emailul nu exista, ca timpul de raspuns sa nu arate ce conturi exista.
const DUMMY_HASH = hashPassword('cont-inexistent', Buffer.alloc(16));

export function findUser(users: AdminUser[], email: string, password: string): AdminUser | null {
  const wanted = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === wanted);
  const ok = verifyPassword(password, user?.hash ?? DUMMY_HASH);
  return user && ok ? user : null;
}

export const SESSION_COOKIE = 'lox_admin';
export const SESSION_DAYS = 30;

const mac = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function signSession(email: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ e: email, x: now + SESSION_DAYS * 864e5 })).toString('base64url');
  return `${payload}.${mac(payload, secret)}`;
}

export function readSession(
  token: string | undefined,
  secret: string,
  users: AdminUser[],
  now = Date.now(),
): AdminUser | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const good = Buffer.from(mac(payload, secret));
  const given = Buffer.from(sig);
  if (good.length !== given.length || !timingSafeEqual(good, given)) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { e?: unknown; x?: unknown };
    if (typeof e !== 'string' || typeof x !== 'number' || x < now) return null;
    return users.find((u) => u.email === e) ?? null;
  } catch {
    return null;
  }
}

/** 5 incercari gresite pe aceeasi cheie (email si IP) blocheaza login-ul 15 minute. */
export class LoginLimiter {
  private fails = new Map<string, { n: number; until: number }>();

  constructor(
    private max = 5,
    private windowMs = 15 * 60_000,
  ) {}

  blocked(key: string, now = Date.now()): boolean {
    const f = this.fails.get(key);
    return !!f && f.n >= this.max && f.until > now;
  }

  fail(key: string, now = Date.now()): void {
    // Uita cheile expirate, ca harta sa nu creasca la nesfarsit.
    for (const [k, v] of this.fails) {
      if (v.until <= now) this.fails.delete(k);
    }
    const f = this.fails.get(key);
    if (!f || f.until <= now) this.fails.set(key, { n: 1, until: now + this.windowMs });
    else this.fails.set(key, { n: f.n + 1, until: now + this.windowMs });
  }

  succeed(key: string): void {
    this.fails.delete(key);
  }

  get size(): number {
    return this.fails.size;
  }
}

export const limiter = new LoginLimiter();
