import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startMinio, type StartedMinio } from '../setup/minio-container.js';

let ctx: StartedMinio;

beforeAll(async () => { ctx = await startMinio(); }, 120_000);
afterAll(async () => { await ctx.container.stop(); });

describe('storage service', () => {
  it('round-trips: uploadFile -> getSignedUrl -> getObjectStream -> deleteFile', async () => {
    const storage = await import('@/modules/storage/service');

    const content = 'hello world';
    const file = new File([content], 'hello.txt', { type: 'image/jpeg' });
    await storage.uploadFile('test/key.jpg', file);

    const url = await storage.getSignedUrl('test/key.jpg', 60);
    expect(url).toMatch(/^http/);
    expect(url).toContain('X-Amz-Signature');

    const { stream, contentLength } = await storage.getObjectStream('test/key.jpg');
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(c as Buffer);
    const body = Buffer.concat(chunks).toString('utf8');
    expect(body).toBe(content);
    expect(contentLength).toBe(content.length);

    await storage.deleteFile('test/key.jpg');
    await expect(storage.getObjectStream('test/key.jpg')).rejects.toThrow();
  });
});
