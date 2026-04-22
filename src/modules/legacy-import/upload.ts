import { createReadStream } from 'node:fs';
import { extract } from 'tar';
import { minio, ensureBucket } from '@/modules/storage/client';
import { env } from '@/lib/env';

/**
 * Reads a tarball at `tarPath`, calls `keyFor` on each entry filename.
 * If `keyFor` returns a storage key (non-null), the entry's bytes are uploaded
 * to MinIO under that key.
 *
 * Returns a map of legacy filename → storage key for every entry that was uploaded.
 */
export async function uploadFromTarball(
  tarPath: string,
  keyFor: (legacyFilename: string) => string | null,
): Promise<Map<string, string>> {
  await ensureBucket();
  const result = new Map<string, string>();
  const uploadPromises: Promise<void>[] = [];

  await new Promise<void>((resolve, reject) => {
    const parser = extract({ cwd: '/tmp' });

    parser.on('entry', (entry: NodeJS.ReadableStream & { path: string; resume(): void }) => {
      const legacyName = entry.path.replace(/^\.\//, '');
      const key = keyFor(legacyName);
      if (!key) {
        entry.resume();
        return;
      }

      const chunks: Buffer[] = [];
      entry.on('data', (c: Buffer) => chunks.push(c));
      entry.on('end', () => {
        const buf = Buffer.concat(chunks);
        const upload = minio
          .putObject(env.MINIO_BUCKET, key, buf, buf.byteLength, {
            'Content-Type': 'image/jpeg',
          })
          .then(() => {
            result.set(legacyName, key);
          });
        uploadPromises.push(upload);
      });
      entry.on('error', reject);
    });

    parser.on('finish', resolve);
    parser.on('error', reject);
    createReadStream(tarPath).pipe(parser);
  });

  // Wait for all in-flight putObject calls that were kicked off during parsing.
  await Promise.all(uploadPromises);

  return result;
}
