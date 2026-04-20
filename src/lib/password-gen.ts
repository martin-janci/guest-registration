import crypto from 'node:crypto';

// URL-safe alphabet without visually ambiguous chars (0/O, 1/l/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Generate a random password. Default length 14 (≈ 82 bits of entropy). */
export function generateRandomPassword(length = 14): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}
