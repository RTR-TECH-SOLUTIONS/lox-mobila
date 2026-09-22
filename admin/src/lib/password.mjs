import { randomBytes, scryptSync } from 'node:crypto';

/**
 * Hash de parola in formatul „scrypt$<sare>$<hash>", in base64url.
 * @param {string} password
 * @param {Buffer} [salt]
 * @returns {string}
 */
export function hashPassword(password, salt = randomBytes(16)) {
  return `scrypt$${salt.toString('base64url')}$${scryptSync(password, salt, 64).toString('base64url')}`;
}
