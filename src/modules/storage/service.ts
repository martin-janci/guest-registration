import type { Readable } from 'node:stream';
import { minio, ensureBucket } from './client';
import { env } from '@/lib/env';
import { uploadFileValidation } from './schema';

export async function uploadFile(key: string, file: File): Promise<void> {
  const validated = uploadFileValidation.parse(file);
  await ensureBucket();
  const buffer = Buffer.from(await validated.arrayBuffer());
  await minio.putObject(env.MINIO_BUCKET, key, buffer, buffer.byteLength, {
    'Content-Type': validated.type,
    'Content-Disposition': `inline; filename="${encodeURIComponent(validated.name)}"`,
  });
}

export async function getSignedUrl(key: string, ttlSeconds = 600): Promise<string> {
  return minio.presignedGetObject(env.MINIO_BUCKET, key, ttlSeconds);
}

export async function getObjectStream(key: string): Promise<{
  stream: Readable;
  contentType: string;
  contentLength: number;
}> {
  const stat = await minio.statObject(env.MINIO_BUCKET, key);
  const stream = await minio.getObject(env.MINIO_BUCKET, key);
  return {
    stream,
    contentType: stat.metaData?.['content-type'] ?? 'application/octet-stream',
    contentLength: stat.size,
  };
}

export async function deleteFile(key: string): Promise<void> {
  await minio.removeObject(env.MINIO_BUCKET, key);
}
