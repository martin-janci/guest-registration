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
        minio
          .putObject(env.MINIO_BUCKET, key, buf, buf.byteLength, {
            'Content-Type': 'image/jpeg',
          })
          .then(() => {
            result.set(legacyName, key);
          })
          .catch(reject);
      });
      entry.on('error', reject);
    });

    parser.on('finish', resolve);
    parser.on('error', reject);
    createReadStream(tarPath).pipe(parser);
  });

  return result;
}
