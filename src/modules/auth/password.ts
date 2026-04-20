import { hash, verify } from '@node-rs/argon2';

const OPTIONS = {
  memoryCost: 19_456,  // 19 MiB, OWASP recommendation
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  return verify(hashed, plain);
}
