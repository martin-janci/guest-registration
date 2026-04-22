import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startPg } from '../setup/pg-container.js';
import { startMinio, type StartedMinio } from '../setup/minio-container.js';
import path from 'node:path';

let pg: Awaited<ReturnType<typeof startPg>>;
let minio: StartedMinio;

beforeAll(async () => {
  pg = await startPg();
  minio = await startMinio();
  // DATABASE_URL is set by startPg; MINIO_* env vars set by startMinio.
}, 120_000);

afterAll(async () => {
  await pg.prisma.$disconnect();
  await pg.container.stop();
  await minio.container.stop();
});

describe('legacy-import', () => {
  it('imports the mini dump + uploads tarball with zero discrepancies', async () => {
    const { run } = await import('@/modules/legacy-import/index.js');

    const dump = path.resolve('prisma/seed-legacy-mini.sql');
    const tar = path.resolve('tests/fixtures/legacy-uploads.tar');
    const result = await run({ dumpPath: dump, uploadsPath: tar, dryRun: false });

    expect(result.discrepancies).toEqual([]);
    expect(result.counts).toEqual({
      users: 2,
      properties: 2,
      calendars: 2,
      trips: 3,
      registrations: 2,
      guests: 3,
      invoices: 2,
      invoiceItems: 4,
      housekeepingTasks: 2,
      housekeepingPhotos: 1,
    });
    expect(result.uploaded).toBe(3);

    // Spot-checks
    const users = await pg.prisma.user.findMany({ orderBy: { id: 'asc' } });
    expect(users[0]!.username).toBe('admin');
    expect(users[0]!.role).toBe('ADMIN');

    const alice = await pg.prisma.guest.findFirst({ where: { firstName: 'Alice' } });
    expect(alice!.documentImageKey).toMatch(
      /properties\/\d+\/guests\/\d+\/registration_1_alice\.jpg$/,
    );
    // Legacy fields preserved: dateOfBirth + nationality on Guest,
    // gdprConsent copied from parent Registration (mini dump sets it true).
    expect(alice!.dateOfBirth?.toISOString().slice(0, 10)).toBe('1985-03-14');
    expect(alice!.nationality).toBe('SK');
    expect(alice!.gdprConsent).toBe(true);

    const inv1 = await pg.prisma.invoice.findFirst({
      where: { invoiceNumber: '2026-0001' },
      include: { items: true },
    });
    expect(inv1!.items).toHaveLength(2);
    expect(Number(inv1!.totalAmount)).toBe(120);

    const archived = await pg.prisma.property.findFirst({
      where: { name: 'Villa B (archived)' },
    });
    expect(archived!.deletedAt).not.toBeNull();
  }, 120_000);
});
