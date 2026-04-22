import { Client } from 'pg';
import { prisma } from '@/db/client';
import { env } from '@/lib/env';
import { loadDumpIntoStaging, dropStaging } from './stage.js';
import {
  mapUser,
  mapProperty,
  mapCalendar,
  mapTrip,
  mapRegistration,
  mapGuest,
  mapInvoice,
  mapInvoiceItem,
  mapHousekeeping,
} from './transform.js';
import { uploadFromTarball } from './upload.js';
// TODO(T4): import { verify } from './verify.js';

export interface ImportOptions {
  dumpPath: string;
  uploadsPath: string;
  dryRun: boolean;
}

export interface ImportResult {
  counts: Record<string, number>;
  uploaded: number;
  discrepancies: string[];
  durationMs: number;
}

const STAGING = `legacy_import_${Date.now()}`;

export async function run(opts: ImportOptions): Promise<ImportResult> {
  const started = Date.now();
  const pg = new Client({ connectionString: env.DATABASE_URL });
  await pg.connect();

  try {
    await loadDumpIntoStaging(pg, opts.dumpPath, STAGING);

    // Helper: query staging schema rows
    const q = async <T>(sql: string): Promise<T[]> => {
      await pg.query(`SET search_path TO "${STAGING}"`);
      const res = await pg.query(sql);
      await pg.query('RESET search_path');
      return res.rows as T[];
    };

    // 1. Users
    const legacyUsers = await q<any>('SELECT * FROM guest_reg_user ORDER BY id');
    const userIdMap = new Map<number, number>();
    for (const row of legacyUsers) {
      const created = await prisma.user.create({ data: mapUser(row) });
      userIdMap.set(row.id as number, created.id);
    }

    // 2. Properties (amenity → property)
    const legacyAmenities = await q<any>('SELECT * FROM guest_reg_amenity ORDER BY id');
    const propertyIdMap = new Map<number, number>();
    for (const row of legacyAmenities) {
      const ownerId = userIdMap.get(row.admin_id as number) ?? userIdMap.values().next().value!;
      const created = await prisma.property.create({ data: mapProperty(row, ownerId) });
      propertyIdMap.set(row.id as number, created.id);
    }

    // 3. Calendars
    const legacyCals = await q<any>('SELECT * FROM guest_reg_calendar ORDER BY id');
    for (const row of legacyCals) {
      const pid = propertyIdMap.get(row.amenity_id as number)!;
      await prisma.calendar.create({ data: mapCalendar(row, pid) });
    }

    // 4. Trips  (legacy has no max_guests column — mapper defaults to 1)
    const legacyTrips = await q<any>('SELECT * FROM guest_reg_trip ORDER BY id');
    const tripIdMap = new Map<number, number>();
    for (const row of legacyTrips) {
      const pid = propertyIdMap.get(row.amenity_id as number)!;
      const aid = userIdMap.get(row.admin_id as number)!;
      const created = await prisma.trip.create({ data: mapTrip(row, pid, aid) });
      tripIdMap.set(row.id as number, created.id);
    }

    // 5. Registrations
    //    Legacy table has no email column — derive from trip.external_guest_name,
    //    then first guest's document info, then a stable placeholder.
    const legacyRegs = await q<any>('SELECT * FROM guest_reg_registration ORDER BY id');
    const regIdMap = new Map<number, number>();

    for (const row of legacyRegs) {
      const tid = tripIdMap.get(row.trip_id as number)!;

      // Derive email if not present on the row itself
      if (!row.email) {
        const trip = legacyTrips.find((t: any) => t.id === row.trip_id);
        if (trip?.external_guest_name) {
          // Build a slug from the guest name: "John Smith" → john.smith@imported.local
          const slug = (trip.external_guest_name as string)
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9.]/g, '');
          row.email = `${slug}@imported.local`;
        } else {
          row.email = `imported-${row.id as number}@imported.local`;
        }
      }

      const created = await prisma.registration.create({
        data: mapRegistration(row, tid),
      });
      regIdMap.set(row.id as number, created.id);
    }

    // 6. Guests (+ collect document-image upload needs)
    const legacyGuests = await q<any>('SELECT * FROM guest_reg_guest ORDER BY id');
    const guestKeyNeeds = new Map<string, { guestId: number; propertyId: number }>();

    for (const row of legacyGuests) {
      const rid = regIdMap.get(row.registration_id as number)!;
      const created = await prisma.guest.create({ data: mapGuest(row, rid) });

      if (row.document_image) {
        const reg = legacyRegs.find((r: any) => r.id === row.registration_id)!;
        const trip = legacyTrips.find((t: any) => t.id === reg.trip_id)!;
        const pid = propertyIdMap.get(trip.amenity_id as number)!;
        guestKeyNeeds.set(row.document_image as string, {
          guestId: created.id,
          propertyId: pid,
        });
      }
    }

    // 7. Invoices + Items
    const legacyInvoices = await q<any>('SELECT * FROM guest_reg_invoice ORDER BY id');
    const invoiceIdMap = new Map<number, number>();

    for (const row of legacyInvoices) {
      const aid = userIdMap.get(row.admin_id as number)!;
      const created = await prisma.invoice.create({ data: mapInvoice(row, aid) });
      invoiceIdMap.set(row.id as number, created.id);
    }

    const legacyItems = await q<any>(
      'SELECT * FROM guest_reg_invoice_item ORDER BY id',
    );
    for (const row of legacyItems) {
      const invId = invoiceIdMap.get(row.invoice_id as number)!;
      await prisma.invoiceItem.create({ data: mapInvoiceItem(row, invId) });
    }

    // 8. Housekeeping tasks (+ collect photo upload needs)
    //    housekeeperId is NOT NULL in schema — skip rows where legacy housekeeper_id is NULL.
    const legacyHK = await q<any>('SELECT * FROM guest_reg_housekeeping ORDER BY id');
    const hkIdMap = new Map<number, number>();
    const hkPhotoNeeds = new Map<string, { taskId: number; propertyId: number }>();
    let skippedHK = 0;

    for (const row of legacyHK) {
      const legacyHkId = row.housekeeper_id as number | null;
      if (!legacyHkId) {
        console.warn(
          `[import] Skipping housekeeping row id=${row.id as number}: housekeeper_id is NULL`,
        );
        skippedHK++;
        continue;
      }
      const hkUserId = userIdMap.get(legacyHkId);
      if (!hkUserId) {
        console.warn(
          `[import] Skipping housekeeping row id=${row.id as number}: housekeeper user ${legacyHkId} not mapped`,
        );
        skippedHK++;
        continue;
      }

      const tid = tripIdMap.get(row.trip_id as number)!;
      const created = await prisma.housekeepingTask.create({
        data: mapHousekeeping(row, tid, hkUserId),
      });
      hkIdMap.set(row.id as number, created.id);
    }

    if (skippedHK > 0) {
      console.warn(`[import] Skipped ${skippedHK} housekeeping row(s) due to NULL housekeeper_id`);
    }

    // 9. Housekeeping photos — collect upload needs
    const legacyPhotos = await q<any>(
      'SELECT * FROM guest_reg_housekeeping_photo ORDER BY id',
    );
    for (const row of legacyPhotos) {
      const taskId = hkIdMap.get(row.housekeeping_id as number);
      if (!taskId) continue; // parent HK row was skipped
      const hk = legacyHK.find((h: any) => h.id === row.housekeeping_id)!;
      const pid = propertyIdMap.get(hk.amenity_id as number)!;
      hkPhotoNeeds.set(row.file_path as string, { taskId, propertyId: pid });
    }

    // 10. Upload files (skip in dry-run mode)
    const legacyFilenameToKey = new Map<string, string>();
    if (!opts.dryRun) {
      const uploaded = await uploadFromTarball(opts.uploadsPath, (filename) => {
        if (guestKeyNeeds.has(filename)) {
          const { guestId, propertyId } = guestKeyNeeds.get(filename)!;
          return `properties/${propertyId}/guests/${guestId}/${filename}`;
        }
        if (hkPhotoNeeds.has(filename)) {
          const { taskId, propertyId } = hkPhotoNeeds.get(filename)!;
          return `properties/${propertyId}/housekeeping/${taskId}/${filename}`;
        }
        return null;
      });
      for (const [legacy, key] of uploaded) legacyFilenameToKey.set(legacy, key);

      // Backfill documentImageKey on Guest rows
      for (const [filename, { guestId }] of guestKeyNeeds) {
        const key = legacyFilenameToKey.get(filename);
        if (key) {
          await prisma.guest.update({
            where: { id: guestId },
            data: { documentImageKey: key },
          });
        }
      }

      // Create HousekeepingPhoto rows for uploaded photos
      for (const [filename, { taskId }] of hkPhotoNeeds) {
        const key = legacyFilenameToKey.get(filename);
        if (key) {
          await prisma.housekeepingPhoto.create({
            data: { task: { connect: { id: taskId } }, storageKey: key },
          });
        }
      }
    }

    // TODO(T4): const discrepancies = await verify();
    const discrepancies: string[] = [];

    return {
      counts: {
        users: legacyUsers.length,
        properties: legacyAmenities.length,
        calendars: legacyCals.length,
        trips: legacyTrips.length,
        registrations: legacyRegs.length,
        guests: legacyGuests.length,
        invoices: legacyInvoices.length,
        invoiceItems: legacyItems.length,
        housekeepingTasks: legacyHK.length - skippedHK,
        housekeepingPhotos: legacyPhotos.length,
      },
      uploaded: legacyFilenameToKey.size,
      discrepancies,
      durationMs: Date.now() - started,
    };
  } finally {
    await dropStaging(pg, STAGING);
    await pg.end();
  }
}
