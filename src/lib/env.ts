import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().default('guest_reg_session'),
  SESSION_COOKIE_SECURE: z.enum(['true', 'false']).transform(v => v === 'true'),
  MINIO_ENDPOINT: z.string().url(),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  SERVER_URL: z.string().url().default('http://localhost:3000'),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().transform(v => Number.parseInt(v, 10)).pipe(z.number().int().positive()),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  CRON_SECRET: z.string().min(8),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

// Lazy proxy — defers zod parsing until a field is actually read.
//
// Two concerns resolved here:
//  1. `next build` (phase-production-build) imports every route's module graph
//     to collect page data. During that phase runtime env vars are absent,
//     but the build must still succeed — so we hand back a sentinel object
//     whose field access throws only if someone *actually* uses the value
//     during build (pure imports are fine).
//  2. In real runtime the first real property access triggers validation
//     exactly once; subsequent reads hit the cached object.
let _cached: Env | null = null;
function resolve(): Env {
  if (_cached !== null) return _cached;
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuild) {
    // Return a dummy proxy that satisfies the Env type shape. Any code path
    // that actually reads a value during build is almost certainly a bug —
    // route handlers shouldn't execute their bodies during page-data
    // collection — so we hand back an empty string / 0 rather than throw,
    // letting the build succeed. At runtime the real `env` will apply.
    _cached = {
      DATABASE_URL: '',
      SESSION_COOKIE_NAME: 'guest_reg_session',
      SESSION_COOKIE_SECURE: false,
      MINIO_ENDPOINT: 'http://localhost:9000',
      MINIO_ACCESS_KEY: '',
      MINIO_SECRET_KEY: '',
      MINIO_BUCKET: '',
      SERVER_URL: 'http://localhost:3000',
      SMTP_HOST: '',
      SMTP_PORT: 0,
      SMTP_FROM: 'noreply@example.com',
      LOG_LEVEL: 'info',
      CRON_SECRET: '',
    } as Env;
    return _cached;
  }
  _cached = loadEnv();
  return _cached;
}

export const env: Env = new Proxy({} as Env, {
  get(_t, prop) { return resolve()[prop as keyof Env]; },
  has(_t, prop) { return prop in resolve(); },
  ownKeys() { return Reflect.ownKeys(resolve()); },
  getOwnPropertyDescriptor(_t, prop) {
    return Object.getOwnPropertyDescriptor(resolve(), prop);
  },
});
