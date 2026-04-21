import { Client } from 'minio';
import { env } from '@/lib/env';

const url = new URL(env.MINIO_ENDPOINT);

const globalForMinio = globalThis as unknown as { minio?: Client };

export const minio =
  globalForMinio.minio ??
  new Client({
    endPoint: url.hostname,
    port: url.port ? Number.parseInt(url.port, 10) : url.protocol === 'https:' ? 443 : 80,
    useSSL: url.protocol === 'https:',
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForMinio.minio = minio;

export async function ensureBucket(): Promise<void> {
  const exists = await minio.bucketExists(env.MINIO_BUCKET);
  if (!exists) {
    await minio.makeBucket(env.MINIO_BUCKET);
  }
}
