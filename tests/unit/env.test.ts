import { describe, it, expect } from 'vitest';
import { loadEnv } from '@/lib/env';

describe('loadEnv', () => {
  it('parses a valid env object', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://u:p@h:5432/db',
      SESSION_COOKIE_NAME: 'guest_reg_session',
      SESSION_COOKIE_SECURE: 'false',
      MINIO_ENDPOINT: 'http://localhost:9000',
      MINIO_ACCESS_KEY: 'a',
      MINIO_SECRET_KEY: 'b',
      MINIO_BUCKET: 'guest-registration',
      SMTP_HOST: 'smtp',
      SMTP_PORT: '587',
      SMTP_FROM: 'noreply@example.com',
      LOG_LEVEL: 'info',
    });
    expect(env.DATABASE_URL).toBe('postgresql://u:p@h:5432/db');
    expect(env.SESSION_COOKIE_SECURE).toBe(false);
    expect(env.SMTP_PORT).toBe(587);
  });

  it('rejects missing required keys', () => {
    expect(() => loadEnv({ DATABASE_URL: '' } as Record<string, string>)).toThrow();
  });
});
