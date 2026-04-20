# M3 — Trips & Calendars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin can register Airbnb ics calendars per property, import reservations on demand, and manage manual trips; every trip exposes a public registration link (with QR code) at `/register/<confirmCode>`; the dashboard's "Arriving this week" stops being fake.

**Architecture:** Extend the Prisma schema with `Calendar`, `Trip`, and `TripSource`. Add two thin domain modules (`calendars`, `trips`) that mirror the users/properties pattern, plus two pure helpers (`ics-parser` for parsing fetched ics text; `airbnb-sync` for orchestrating fetch → upsert). Sync runs only when the admin clicks "Sync now" in M3 — the in-process scheduler is M7. Registration links use a URL-safe `externalConfirmCode` generated for manual trips, or extracted from the Airbnb URL in ics DESCRIPTION. QR code is rendered server-side as SVG via `qrcode`.

**Tech Stack:** Prisma, zod, Next.js 15 Server Actions, Tailwind 4 + design tokens (from M1), `node-ical` (for ics parsing), `qrcode` (QR SVG), Vitest + Testcontainers, global `fetch` mocked in tests via `vi.stubGlobal`.

**Repo root:** `/Users/martinjanci/projects/github.com/martin-janci/guest-registration/`.
**Branch:** `m3-trips-calendars` (the controller creates it before Task 1).
**Prior state:** `m2-identity-properties` tag contains schema (User + Property + PropertyHousekeeper) + users/properties UI + authz helper + UI primitives.

---

## Scope boundaries

**In M3:**
- Prisma: `Calendar`, `Trip`, `TripSource { MANUAL, AIRBNB_ICS, WEBHOOK }`.
- `/admin/calendars` list + new + edit + delete (soft-free — calendars don't have `deletedAt`; they just cascade when a property is deleted).
- `/admin/trips` list with filters (property, source, date range, `?includePast=1`).
- `/admin/trips/new` + `/admin/trips/[id]/edit` + soft-delete-free (trips can be hard-deleted; historic data for registrations is preserved via FK `onDelete: Restrict` from `Registration.tripId` — but registrations aren't a thing until M4, so hard delete works fine in M3).
- `/admin/trips/[id]` detail with copyable registration link + QR code.
- Pure `ics-parser` (node-ical wrapper + Airbnb-specific DESCRIPTION regex).
- `airbnb-sync` service: "for this calendar, fetch ics, parse, upsert trips, update `Calendar.lastSyncedAt`, return `{ created, updated, skipped }`".
- Manual **Sync now** button on `/admin/calendars` rows and on each calendar detail.
- Dashboard `Arriving this week` table wired to real trips (replaces M1 placeholder). `Pending registrations` KPI shows `0` — real count arrives in M4.

**Out of M3 (explicit non-goals):**
- Scheduled polling (`node-cron`, `Job` table, `/api/cron/sync-airbnb`) → **M7**.
- Sending guest registration links by email → **M4**.
- Actual guest registration form at `/register/[code]` → **M4**.
- Creating housekeeping tasks when a trip is imported → **M6**.
- Invoices linked to trips → **M5**.

---

## File structure (new + modified)

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | **Modify:** add `Calendar`, `Trip`, `TripSource`. Add `Property.calendars`, `Property.trips` relations. |
| `prisma/migrations/<ts>_trips_and_calendars/` | **Create** (via `prisma migrate dev`). |
| `src/modules/calendars/schema.ts` | **Create:** zod schemas for create/update. |
| `src/modules/calendars/service.ts` | **Create:** `listCalendars`, `getCalendarById`, `createCalendar`, `updateCalendar`, `deleteCalendar`, `touchLastSynced`. |
| `src/modules/trips/schema.ts` | **Create:** zod schemas. |
| `src/modules/trips/service.ts` | **Create:** `listTrips`, `getTripById`, `createTrip`, `updateTrip`, `deleteTrip`, `upsertExternalTrip`, `getUpcomingForAdmin`. |
| `src/lib/confirm-code.ts` | **Create:** `generateConfirmCode()` — 10-char URL-safe. |
| `src/lib/qr.ts` | **Create:** `renderQrSvg(text)` — returns an inline SVG string. |
| `src/modules/ics-parser/index.ts` | **Create:** pure `parseIcs(text)` → `IcsEvent[]` and `extractAirbnbReservation(event)` → `{ confirmCode?, guestName? } | null`. |
| `src/modules/ics-parser/fixtures/` | **Create:** 2 ics fixture files (simple iCal + real-looking Airbnb ics). |
| `src/modules/airbnb-sync/index.ts` | **Create:** `syncCalendar(calendarId, { fetcher? })` → `{ created, updated, skipped, errors }`. Uses `ics-parser` + `trips.upsertExternalTrip` + `calendars.touchLastSynced`. |
| `src/app/(admin)/admin/calendars/page.tsx` | **Create:** list. |
| `src/app/(admin)/admin/calendars/new/{page,actions}.ts(x)` | **Create.** |
| `src/app/(admin)/admin/calendars/[id]/edit/{page,actions,form}.ts(x)` | **Create.** |
| `src/app/(admin)/admin/calendars/[id]/delete/route.ts` | **Create.** |
| `src/app/(admin)/admin/calendars/[id]/sync/route.ts` | **Create:** POST → runs syncCalendar, redirects back with a flash cookie. |
| `src/app/(admin)/admin/trips/page.tsx` | **Create:** list + filters. |
| `src/app/(admin)/admin/trips/new/{page,actions}.ts(x)` | **Create.** |
| `src/app/(admin)/admin/trips/[id]/page.tsx` | **Create:** detail with registration link + QR. |
| `src/app/(admin)/admin/trips/[id]/edit/{page,actions,form}.ts(x)` | **Create.** |
| `src/app/(admin)/admin/trips/[id]/delete/route.ts` | **Create.** |
| `src/app/(admin)/admin/dashboard/page.tsx` | **Modify:** replace placeholder "Arriving this week" + upcoming-trips KPI with real data. |
| `src/components/admin/copy-button.tsx` | **Create:** small client-only button that copies a string to clipboard. |
| `src/lib/flash.ts` | **Create:** helper to set/read a short-lived flash cookie for sync-result messages. |
| `tests/unit/confirm-code.test.ts` | **Create.** |
| `tests/unit/qr.test.ts` | **Create.** |
| `tests/unit/ics-parser.test.ts` | **Create.** |
| `tests/unit/calendars-schema.test.ts` | **Create.** |
| `tests/unit/trips-schema.test.ts` | **Create.** |
| `tests/integration/calendars.test.ts` | **Create.** |
| `tests/integration/trips.test.ts` | **Create.** |
| `tests/integration/airbnb-sync.test.ts` | **Create.** |

Everything follows the M2 pattern: one folder per module, schema + service colocated, route files are thin, Server Actions call service functions, zod validates on the server edge.

---

## Branch setup (do this before Task 1)

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
git checkout main && git pull --ff-only
# Or continue from m2 tip if main hasn't been merged yet:
git checkout -b m3-trips-calendars m2-identity-properties
```

---

## Task 1: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<ts>_trips_and_calendars/migration.sql`

- [ ] **Step 1: Extend `prisma/schema.prisma`**

Add these definitions (leave all existing models — User, Session, Property, PropertyHousekeeper — untouched; only append the three new enum/models and add two `relation` lines to `Property`):

```prisma
enum TripSource {
  MANUAL
  AIRBNB_ICS
  WEBHOOK
}

model Calendar {
  id              Int      @id @default(autoincrement())
  propertyId      Int
  property        Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  name            String
  icsUrl          String
  syncIntervalMin Int      @default(60)
  lastSyncedAt    DateTime?
  lastSyncError   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  trips Trip[]

  @@index([propertyId])
}

model Trip {
  id                    Int        @id @default(autoincrement())
  title                 String
  startDate             DateTime   @db.Date
  endDate               DateTime   @db.Date
  maxGuests             Int
  adminId               Int
  admin                 User       @relation("TripAdmin", fields: [adminId], references: [id])
  propertyId            Int
  property              Property   @relation("PropertyTrips", fields: [propertyId], references: [id], onDelete: Restrict)
  calendarId            Int?
  calendar              Calendar?  @relation(fields: [calendarId], references: [id], onDelete: SetNull)
  source                TripSource @default(MANUAL)
  externalReservationId String?    @unique
  externalConfirmCode   String?    @unique
  externalGuestName     String?
  externalGuestEmail    String?
  externalGuestCount    Int?
  externalSyncedAt      DateTime?
  notes                 String?
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  @@index([propertyId, startDate])
  @@index([adminId, startDate])
  @@index([calendarId])
}
```

And, inside the existing `User` model, add this relation alongside the other relations (next to `ownedProperties`):

```prisma
  trips Trip[] @relation("TripAdmin")
```

And, inside the existing `Property` model, add these two relations (next to `housekeepers`):

```prisma
  calendars Calendar[]
  trips     Trip[]     @relation("PropertyTrips")
```

- [ ] **Step 2: Run the migration**

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
npx prisma migrate dev --name trips_and_calendars
```

Expected: creates `prisma/migrations/<ts>_trips_and_calendars/migration.sql`, applies to local dev DB, regenerates Prisma Client.

- [ ] **Step 3: Inspect the SQL**

```bash
ls prisma/migrations/ | tail -1 | xargs -I{} cat prisma/migrations/{}/migration.sql
```

Confirm it contains `CREATE TYPE "TripSource"`, `CREATE TABLE "Calendar"`, `CREATE TABLE "Trip"`, plus FK constraints and the three indexes on `Trip`.

- [ ] **Step 4: Typecheck + full test suite**

```bash
npm run typecheck && npm test
```

Expected: typecheck clean; M1+M2 tests (36) still pass.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat(db): add Calendar + Trip + TripSource"
```

---

## Task 2: Install ics + qr dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install**

```bash
npm install node-ical@^0.18.0 qrcode@^1.5.4
npm install -D @types/qrcode@^1.5.5
```

Note: `node-ical` ships its own types. Only `qrcode` needs `@types/qrcode`.

- [ ] **Step 2: Verify**

```bash
node -e "console.log(require('node-ical').sync.parseICS ? 'ok' : 'missing')"
node -e "console.log(typeof require('qrcode').toString)"
```

Expected: prints `ok` and `function`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add node-ical + qrcode"
```

---

## Task 3: Confirm-code helper

**Files:**
- Create: `src/lib/confirm-code.ts`
- Create: `tests/unit/confirm-code.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/confirm-code.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateConfirmCode } from '@/lib/confirm-code';

describe('generateConfirmCode', () => {
  it('returns 10 chars by default', () => {
    expect(generateConfirmCode()).toHaveLength(10);
  });

  it('uses URL-safe alphabet (no ambiguous chars)', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateConfirmCode()).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
    }
  });

  it('is non-deterministic', () => {
    const set = new Set(Array.from({ length: 200 }, () => generateConfirmCode()));
    expect(set.size).toBe(200);
  });

  it('accepts a custom length', () => {
    expect(generateConfirmCode(20)).toHaveLength(20);
  });
});
```

- [ ] **Step 2: Run — should fail**

```bash
npm test -- tests/unit/confirm-code.test.ts
```

Expected: `Cannot find module '@/lib/confirm-code'`.

- [ ] **Step 3: Implement `src/lib/confirm-code.ts`**

```ts
import crypto from 'node:crypto';

// URL-safe alphabet with no visually ambiguous characters.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Generate a URL-safe confirm code. 10 chars = ~56 bits of entropy, plenty for our traffic. */
export function generateConfirmCode(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- tests/unit/confirm-code.test.ts
```

Expected: `✓ 4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/confirm-code.ts tests/unit/confirm-code.test.ts
git commit -m "feat(lib): generateConfirmCode (URL-safe, 10-char)"
```

---

## Task 4: QR SVG helper

**Files:**
- Create: `src/lib/qr.ts`
- Create: `tests/unit/qr.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/qr.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderQrSvg } from '@/lib/qr';

describe('renderQrSvg', () => {
  it('returns an inline SVG string with viewBox', async () => {
    const svg = await renderQrSvg('https://airbnb.rlt.sk/register/ABC123');
    expect(svg).toMatch(/^<svg\b[^>]*viewBox=/);
    expect(svg).toContain('</svg>');
  });

  it('is deterministic for the same input', async () => {
    const a = await renderQrSvg('hello');
    const b = await renderQrSvg('hello');
    expect(a).toBe(b);
  });

  it('errors on empty input', async () => {
    await expect(renderQrSvg('')).rejects.toBeDefined();
  });
});
```

- [ ] **Step 2: Run — should fail**

```bash
npm test -- tests/unit/qr.test.ts
```

- [ ] **Step 3: Implement `src/lib/qr.ts`**

```ts
import QRCode from 'qrcode';

interface Options {
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/** Render a payload as an inline SVG QR code string. */
export async function renderQrSvg(
  payload: string,
  opts: Options = {},
): Promise<string> {
  if (!payload) throw new Error('QR payload must be a non-empty string');
  return QRCode.toString(payload, {
    type: 'svg',
    margin: opts.margin ?? 1,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? 'M',
  });
}
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- tests/unit/qr.test.ts
```

Expected: `✓ 3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/qr.ts tests/unit/qr.test.ts
git commit -m "feat(lib): renderQrSvg (wraps qrcode, inline SVG)"
```

---

## Task 5: ICS parser

**Files:**
- Create: `src/modules/ics-parser/index.ts`
- Create: `src/modules/ics-parser/fixtures/simple.ics`
- Create: `src/modules/ics-parser/fixtures/airbnb.ics`
- Create: `tests/unit/ics-parser.test.ts`

- [ ] **Step 1: `src/modules/ics-parser/fixtures/simple.ics`**

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//example//test//EN
BEGIN:VEVENT
UID:example-1@test.local
DTSTAMP:20260101T120000Z
DTSTART;VALUE=DATE:20260510
DTEND;VALUE=DATE:20260513
SUMMARY:Sample reservation
END:VEVENT
END:VCALENDAR
```

- [ ] **Step 2: `src/modules/ics-parser/fixtures/airbnb.ics`**

```
BEGIN:VCALENDAR
PRODID:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:20260418T090000Z
UID:airbnb-reservation-HMABC12345@airbnb.com
DTSTART;VALUE=DATE:20260422
DTEND;VALUE=DATE:20260426
SUMMARY:Reserved
DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABC12345\nPhone Number (Last 4 Digits): 1234
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20260418T090000Z
UID:airbnb-blocked-1@airbnb.com
DTSTART;VALUE=DATE:20260501
DTEND;VALUE=DATE:20260503
SUMMARY:Not available
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20260418T090000Z
UID:airbnb-reservation-HMDEF67890@airbnb.com
DTSTART;VALUE=DATE:20260510
DTEND;VALUE=DATE:20260512
SUMMARY:Reserved (Anna Novotná)
DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMDEF67890
END:VEVENT
END:VCALENDAR
```

- [ ] **Step 3: Write the failing test**

`tests/unit/ics-parser.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseIcs, extractAirbnbReservation } from '@/modules/ics-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', '..', 'src', 'modules', 'ics-parser', 'fixtures');

describe('parseIcs', () => {
  it('returns events from a minimal ics with start, end, summary, uid', () => {
    const text = readFileSync(join(fixturesDir, 'simple.ics'), 'utf8');
    const events = parseIcs(text);
    expect(events).toHaveLength(1);
    const e = events[0]!;
    expect(e.uid).toBe('example-1@test.local');
    expect(e.startDate.toISOString().slice(0, 10)).toBe('2026-05-10');
    expect(e.endDate.toISOString().slice(0, 10)).toBe('2026-05-13');
    expect(e.summary).toBe('Sample reservation');
  });

  it('returns all VEVENTs from an Airbnb-shaped ics', () => {
    const text = readFileSync(join(fixturesDir, 'airbnb.ics'), 'utf8');
    const events = parseIcs(text);
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.summary).sort()).toEqual([
      'Not available',
      'Reserved',
      'Reserved (Anna Novotná)',
    ]);
  });

  it('returns [] on empty input', () => {
    expect(parseIcs('')).toEqual([]);
  });
});

describe('extractAirbnbReservation', () => {
  it('extracts confirmCode from the Airbnb reservation URL', () => {
    const text = readFileSync(join(fixturesDir, 'airbnb.ics'), 'utf8');
    const [a, b, c] = parseIcs(text);

    expect(extractAirbnbReservation(a!)).toEqual({ confirmCode: 'HMABC12345', guestName: null });
    expect(extractAirbnbReservation(b!)).toBeNull(); // "Not available" = blocked
    expect(extractAirbnbReservation(c!)).toEqual({ confirmCode: 'HMDEF67890', guestName: 'Anna Novotná' });
  });
});
```

- [ ] **Step 4: Run — should fail**

```bash
npm test -- tests/unit/ics-parser.test.ts
```

- [ ] **Step 5: Implement `src/modules/ics-parser/index.ts`**

```ts
import ical from 'node-ical';

export interface IcsEvent {
  uid: string;
  startDate: Date;
  endDate: Date;
  summary: string;
  description: string;
}

/** Parse raw ics text into a normalized, UID-keyed list. Empty input → []. */
export function parseIcs(text: string): IcsEvent[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const raw = ical.sync.parseICS(trimmed);
  const events: IcsEvent[] = [];
  for (const [, entry] of Object.entries(raw)) {
    if ((entry as { type?: string }).type !== 'VEVENT') continue;
    const e = entry as {
      uid?: string;
      start?: Date;
      end?: Date;
      summary?: string | { val?: string };
      description?: string | { val?: string };
    };
    if (!e.uid || !e.start || !e.end) continue;
    events.push({
      uid: e.uid,
      startDate: e.start,
      endDate: e.end,
      summary: typeof e.summary === 'string' ? e.summary : (e.summary?.val ?? ''),
      description:
        typeof e.description === 'string' ? e.description : (e.description?.val ?? ''),
    });
  }
  return events;
}

const AIRBNB_URL_RE = /https?:\/\/www\.airbnb\.[a-z.]+\/hosting\/reservations\/details\/([A-Z0-9]+)/i;
const SUMMARY_NAME_RE = /^Reserved\s*\(([^)]+)\)\s*$/i;

/**
 * Given an ics event from an Airbnb calendar, decide whether it is a real reservation
 * and extract the confirm code + guest name if available. Returns null for blocked
 * dates ("Not available") or events with no Airbnb URL in the description.
 */
export function extractAirbnbReservation(
  event: IcsEvent,
): { confirmCode: string; guestName: string | null } | null {
  if (/not available/i.test(event.summary)) return null;
  const m = event.description.match(AIRBNB_URL_RE);
  if (!m || !m[1]) return null;
  const nameMatch = event.summary.match(SUMMARY_NAME_RE);
  return {
    confirmCode: m[1],
    guestName: nameMatch?.[1] ?? null,
  };
}
```

- [ ] **Step 6: Run — should pass**

```bash
npm test -- tests/unit/ics-parser.test.ts
```

Expected: `✓ 4 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/modules/ics-parser/ tests/unit/ics-parser.test.ts
git commit -m "feat(ics-parser): parseIcs + extractAirbnbReservation + fixtures"
```

---

## Task 6: Calendars module

**Files:**
- Create: `src/modules/calendars/schema.ts`
- Create: `src/modules/calendars/service.ts`
- Create: `tests/unit/calendars-schema.test.ts`
- Create: `tests/integration/calendars.test.ts`

- [ ] **Step 1: `src/modules/calendars/schema.ts`**

```ts
import { z } from 'zod';

export const createCalendarSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  icsUrl: z.string().trim().url().max(2000),
  syncIntervalMin: z.coerce.number().int().min(5).max(1440).default(60),
});
export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;

export const updateCalendarSchema = z.object({
  name: z.string().trim().min(1).max(200),
  icsUrl: z.string().trim().url().max(2000),
  syncIntervalMin: z.coerce.number().int().min(5).max(1440),
});
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;
```

- [ ] **Step 2: `src/modules/calendars/service.ts`**

```ts
import type { Calendar, Property } from '@prisma/client';
import { prisma } from '@/db/client';
import {
  createCalendarSchema,
  updateCalendarSchema,
  type CreateCalendarInput,
  type UpdateCalendarInput,
} from './schema';

export type CalendarWithProperty = Calendar & {
  property: Pick<Property, 'id' | 'name' | 'ownerId'>;
};

export async function listCalendars(): Promise<CalendarWithProperty[]> {
  return prisma.calendar.findMany({
    where: { property: { deletedAt: null } },
    include: { property: { select: { id: true, name: true, ownerId: true } } },
    orderBy: [{ property: { name: 'asc' } }, { name: 'asc' }],
  });
}

export async function getCalendarById(id: number): Promise<CalendarWithProperty | null> {
  return prisma.calendar.findUnique({
    where: { id },
    include: { property: { select: { id: true, name: true, ownerId: true } } },
  });
}

export async function createCalendar(input: CreateCalendarInput): Promise<Calendar> {
  const data = createCalendarSchema.parse(input);
  return prisma.calendar.create({ data });
}

export async function updateCalendar(id: number, input: UpdateCalendarInput): Promise<Calendar> {
  const data = updateCalendarSchema.parse(input);
  return prisma.calendar.update({ where: { id }, data });
}

export async function deleteCalendar(id: number): Promise<void> {
  // Trips with a calendarId stay but have calendarId set to null via onDelete: SetNull.
  await prisma.calendar.delete({ where: { id } });
}

export async function touchLastSynced(
  id: number,
  patch: { lastSyncedAt: Date; lastSyncError: string | null },
): Promise<void> {
  await prisma.calendar.update({
    where: { id },
    data: { lastSyncedAt: patch.lastSyncedAt, lastSyncError: patch.lastSyncError },
  });
}
```

- [ ] **Step 3: Unit test `tests/unit/calendars-schema.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { createCalendarSchema, updateCalendarSchema } from '@/modules/calendars/schema';

describe('calendars schemas', () => {
  it('createCalendarSchema requires a URL', () => {
    expect(
      createCalendarSchema.safeParse({ propertyId: 1, name: 'x', icsUrl: 'not-a-url' }).success,
    ).toBe(false);
  });

  it('createCalendarSchema accepts a valid payload with default interval', () => {
    const r = createCalendarSchema.parse({
      propertyId: 1,
      name: 'Main',
      icsUrl: 'https://www.airbnb.com/calendar/ical/123.ics?s=abc',
    });
    expect(r.syncIntervalMin).toBe(60);
  });

  it('createCalendarSchema clamps interval bounds', () => {
    expect(
      createCalendarSchema.safeParse({
        propertyId: 1,
        name: 'x',
        icsUrl: 'https://example.com/a.ics',
        syncIntervalMin: 1,
      }).success,
    ).toBe(false);
    expect(
      createCalendarSchema.safeParse({
        propertyId: 1,
        name: 'x',
        icsUrl: 'https://example.com/a.ics',
        syncIntervalMin: 10000,
      }).success,
    ).toBe(false);
    expect(
      updateCalendarSchema.safeParse({
        name: 'x',
        icsUrl: 'https://example.com/a.ics',
        syncIntervalMin: 60,
      }).success,
    ).toBe(true);
  });
});
```

- [ ] **Step 4: Integration test `tests/integration/calendars.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.trip.deleteMany();
  await ctx.prisma.calendar.deleteMany();
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

describe('calendars service', () => {
  async function setup() {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const properties = await import('@/modules/properties/service');
    const owner = await users.createUser({
      username: 'owner',
      email: 'o@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    const prop = await properties.createProperty({
      name: 'P1',
      ownerId: owner.id,
      maxGuests: 4,
    });
    return { owner, prop };
  }

  it('creates, lists, updates, and deletes a calendar', async () => {
    const { prop } = await setup();
    const svc = await import('@/modules/calendars/service');

    const created = await svc.createCalendar({
      propertyId: prop.id,
      name: 'Airbnb',
      icsUrl: 'https://www.airbnb.com/calendar/ical/1.ics?s=x',
      syncIntervalMin: 60,
    });

    const listed = await svc.listCalendars();
    expect(listed).toHaveLength(1);
    expect(listed[0]!.property.name).toBe('P1');

    const updated = await svc.updateCalendar(created.id, {
      name: 'Airbnb (renamed)',
      icsUrl: created.icsUrl,
      syncIntervalMin: 120,
    });
    expect(updated.name).toBe('Airbnb (renamed)');

    await svc.deleteCalendar(created.id);
    expect(await svc.listCalendars()).toHaveLength(0);
  });

  it('touchLastSynced updates sync metadata', async () => {
    const { prop } = await setup();
    const svc = await import('@/modules/calendars/service');

    const cal = await svc.createCalendar({
      propertyId: prop.id,
      name: 'A',
      icsUrl: 'https://example.com/a.ics',
      syncIntervalMin: 60,
    });

    const at = new Date('2026-04-20T12:00:00Z');
    await svc.touchLastSynced(cal.id, { lastSyncedAt: at, lastSyncError: null });

    const after = await svc.getCalendarById(cal.id);
    expect(after?.lastSyncedAt?.toISOString()).toBe(at.toISOString());
    expect(after?.lastSyncError).toBeNull();

    await svc.touchLastSynced(cal.id, { lastSyncedAt: at, lastSyncError: 'HTTP 503' });
    const errored = await svc.getCalendarById(cal.id);
    expect(errored?.lastSyncError).toBe('HTTP 503');
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test -- tests/unit/calendars-schema.test.ts tests/integration/calendars.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/modules/calendars/ tests/unit/calendars-schema.test.ts tests/integration/calendars.test.ts
git commit -m "feat(calendars): service + zod schemas + tests"
```

---

## Task 7: Trips module (service + schemas + tests)

**Files:**
- Create: `src/modules/trips/schema.ts`
- Create: `src/modules/trips/service.ts`
- Create: `tests/unit/trips-schema.test.ts`
- Create: `tests/integration/trips.test.ts`

- [ ] **Step 1: `src/modules/trips/schema.ts`**

```ts
import { z } from 'zod';

export const tripSourceSchema = z.enum(['MANUAL', 'AIRBNB_ICS', 'WEBHOOK']);

const dateFromInput = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .transform((s) => new Date(`${s}T00:00:00Z`));

export const createTripSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    propertyId: z.coerce.number().int().positive(),
    startDate: dateFromInput,
    endDate: dateFromInput,
    maxGuests: z.coerce.number().int().positive().max(100),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.endDate.getTime() > v.startDate.getTime(), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startDate: dateFromInput,
    endDate: dateFromInput,
    maxGuests: z.coerce.number().int().positive().max(100),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.endDate.getTime() > v.startDate.getTime(), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const tripFiltersSchema = z.object({
  propertyId: z.coerce.number().int().positive().optional(),
  source: tripSourceSchema.optional(),
  from: dateFromInput.optional(),
  to: dateFromInput.optional(),
  includePast: z.coerce.boolean().default(false),
});
export type TripFilters = z.infer<typeof tripFiltersSchema>;
```

- [ ] **Step 2: `src/modules/trips/service.ts`**

```ts
import type { Prisma, Trip, TripSource, Property, User } from '@prisma/client';
import { prisma } from '@/db/client';
import { generateConfirmCode } from '@/lib/confirm-code';
import {
  createTripSchema,
  updateTripSchema,
  type CreateTripInput,
  type TripFilters,
  type UpdateTripInput,
} from './schema';

export type TripWithRelations = Trip & {
  property: Pick<Property, 'id' | 'name'>;
  admin: Pick<User, 'id' | 'username'>;
};

export async function listTrips(
  adminId: number,
  filters: TripFilters = { includePast: false },
): Promise<TripWithRelations[]> {
  const where: Prisma.TripWhereInput = { adminId };
  if (filters.propertyId) where.propertyId = filters.propertyId;
  if (filters.source) where.source = filters.source;
  if (filters.from || filters.to) {
    where.startDate = {};
    if (filters.from) where.startDate.gte = filters.from;
    if (filters.to) where.startDate.lte = filters.to;
  }
  if (!filters.includePast) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    where.endDate = { gte: today };
  }
  return prisma.trip.findMany({
    where,
    include: {
      property: { select: { id: true, name: true } },
      admin: { select: { id: true, username: true } },
    },
    orderBy: [{ startDate: 'asc' }],
  });
}

export async function getTripById(id: number): Promise<TripWithRelations | null> {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true } },
      admin: { select: { id: true, username: true } },
    },
  });
}

export async function createTrip(adminId: number, input: CreateTripInput): Promise<Trip> {
  const data = createTripSchema.parse(input);
  return prisma.trip.create({
    data: {
      adminId,
      title: data.title,
      propertyId: data.propertyId,
      startDate: data.startDate,
      endDate: data.endDate,
      maxGuests: data.maxGuests,
      notes: data.notes ?? null,
      source: 'MANUAL',
      externalConfirmCode: generateConfirmCode(),
    },
  });
}

export async function updateTrip(id: number, input: UpdateTripInput): Promise<Trip> {
  const data = updateTripSchema.parse(input);
  return prisma.trip.update({
    where: { id },
    data: {
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      maxGuests: data.maxGuests,
      notes: data.notes ?? null,
    },
  });
}

export async function deleteTrip(id: number): Promise<void> {
  await prisma.trip.delete({ where: { id } });
}

export interface UpsertExternalTripInput {
  adminId: number;
  propertyId: number;
  calendarId: number;
  source: TripSource; // typically AIRBNB_ICS
  externalReservationId: string;
  externalConfirmCode: string | null;
  externalGuestName: string | null;
  externalGuestCount: number | null;
  startDate: Date;
  endDate: Date;
  title: string;
  maxGuests: number;
}

/** Upsert a trip imported from an external calendar. Keyed by externalReservationId. */
export async function upsertExternalTrip(
  input: UpsertExternalTripInput,
): Promise<{ trip: Trip; created: boolean }> {
  const existing = await prisma.trip.findUnique({
    where: { externalReservationId: input.externalReservationId },
  });
  if (existing) {
    const trip = await prisma.trip.update({
      where: { id: existing.id },
      data: {
        startDate: input.startDate,
        endDate: input.endDate,
        externalGuestName: input.externalGuestName,
        externalGuestCount: input.externalGuestCount,
        externalSyncedAt: new Date(),
        title: input.title,
      },
    });
    return { trip, created: false };
  }
  const trip = await prisma.trip.create({
    data: {
      adminId: input.adminId,
      propertyId: input.propertyId,
      calendarId: input.calendarId,
      source: input.source,
      externalReservationId: input.externalReservationId,
      externalConfirmCode: input.externalConfirmCode,
      externalGuestName: input.externalGuestName,
      externalGuestCount: input.externalGuestCount,
      externalSyncedAt: new Date(),
      startDate: input.startDate,
      endDate: input.endDate,
      title: input.title,
      maxGuests: input.maxGuests,
    },
  });
  return { trip, created: true };
}

/** Trips that start within the next 7 days for a given admin. Used by the dashboard. */
export async function getUpcomingForAdmin(adminId: number): Promise<TripWithRelations[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const in7 = new Date(today);
  in7.setUTCDate(in7.getUTCDate() + 7);
  return prisma.trip.findMany({
    where: { adminId, startDate: { gte: today, lte: in7 } },
    include: {
      property: { select: { id: true, name: true } },
      admin: { select: { id: true, username: true } },
    },
    orderBy: [{ startDate: 'asc' }],
  });
}
```

- [ ] **Step 3: Unit test `tests/unit/trips-schema.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { createTripSchema, updateTripSchema, tripFiltersSchema } from '@/modules/trips/schema';

describe('trips schemas', () => {
  it('createTripSchema rejects when end <= start', () => {
    const r = createTripSchema.safeParse({
      title: 'x',
      propertyId: 1,
      startDate: '2026-05-10',
      endDate: '2026-05-10',
      maxGuests: 2,
    });
    expect(r.success).toBe(false);
  });

  it('createTripSchema accepts valid input', () => {
    const r = createTripSchema.parse({
      title: 'Anna',
      propertyId: 1,
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      maxGuests: 2,
    });
    expect(r.startDate.toISOString().slice(0, 10)).toBe('2026-05-10');
  });

  it('updateTripSchema enforces the same ordering rule', () => {
    expect(
      updateTripSchema.safeParse({
        title: 'x',
        startDate: '2026-05-10',
        endDate: '2026-05-09',
        maxGuests: 2,
      }).success,
    ).toBe(false);
  });

  it('tripFiltersSchema coerces includePast and optional dates', () => {
    const r = tripFiltersSchema.parse({ includePast: 'true', from: '2026-05-01' });
    expect(r.includePast).toBe(true);
    expect(r.from?.toISOString().slice(0, 10)).toBe('2026-05-01');
  });
});
```

- [ ] **Step 4: Integration test `tests/integration/trips.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.trip.deleteMany();
  await ctx.prisma.calendar.deleteMany();
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

async function seed() {
  process.env.DATABASE_URL = ctx.url;
  const users = await import('@/modules/users/service');
  const properties = await import('@/modules/properties/service');
  const owner = await users.createUser({
    username: 'owner',
    email: 'o@example.com',
    password: 'secretpass!',
    role: 'ADMIN',
  });
  const prop = await properties.createProperty({
    name: 'P1',
    ownerId: owner.id,
    maxGuests: 4,
  });
  return { owner, prop };
}

describe('trips service', () => {
  it('create assigns a confirm code and MANUAL source', async () => {
    const { owner, prop } = await seed();
    const svc = await import('@/modules/trips/service');

    const trip = await svc.createTrip(owner.id, {
      title: 'First stay',
      propertyId: prop.id,
      startDate: new Date('2026-05-10T00:00:00Z'),
      endDate: new Date('2026-05-12T00:00:00Z'),
      maxGuests: 2,
    });
    expect(trip.source).toBe('MANUAL');
    expect(trip.externalConfirmCode).toMatch(/^[A-Za-z0-9]{10}$/);
  });

  it('list filters by property, source, and date range; excludes past by default', async () => {
    const { owner, prop } = await seed();
    const svc = await import('@/modules/trips/service');

    const past = await svc.createTrip(owner.id, {
      title: 'Past',
      propertyId: prop.id,
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-03T00:00:00Z'),
      maxGuests: 2,
    });
    const future = await svc.createTrip(owner.id, {
      title: 'Future',
      propertyId: prop.id,
      startDate: new Date('2099-01-01T00:00:00Z'),
      endDate: new Date('2099-01-03T00:00:00Z'),
      maxGuests: 2,
    });

    const def = await svc.listTrips(owner.id);
    expect(def.map((t) => t.id)).toEqual([future.id]);

    const all = await svc.listTrips(owner.id, { includePast: true });
    expect(all.map((t) => t.id).sort()).toEqual([past.id, future.id].sort());
  });

  it('upsertExternalTrip creates then updates by externalReservationId', async () => {
    const { owner, prop } = await seed();
    const trips = await import('@/modules/trips/service');
    const calendars = await import('@/modules/calendars/service');

    const cal = await calendars.createCalendar({
      propertyId: prop.id,
      name: 'Airbnb',
      icsUrl: 'https://example.com/a.ics',
      syncIntervalMin: 60,
    });

    const first = await trips.upsertExternalTrip({
      adminId: owner.id,
      propertyId: prop.id,
      calendarId: cal.id,
      source: 'AIRBNB_ICS',
      externalReservationId: 'airbnb-HMABC@airbnb.com',
      externalConfirmCode: 'HMABC',
      externalGuestName: 'Anna',
      externalGuestCount: 2,
      startDate: new Date('2026-05-10T00:00:00Z'),
      endDate: new Date('2026-05-12T00:00:00Z'),
      title: 'Airbnb HMABC',
      maxGuests: 4,
    });
    expect(first.created).toBe(true);

    const second = await trips.upsertExternalTrip({
      ...{
        adminId: owner.id,
        propertyId: prop.id,
        calendarId: cal.id,
        source: 'AIRBNB_ICS',
        externalReservationId: 'airbnb-HMABC@airbnb.com',
        externalConfirmCode: 'HMABC',
        externalGuestName: 'Anna Novotná',
        externalGuestCount: 3,
        startDate: new Date('2026-05-10T00:00:00Z'),
        endDate: new Date('2026-05-13T00:00:00Z'),
        title: 'Airbnb HMABC (extended)',
        maxGuests: 4,
      },
    });
    expect(second.created).toBe(false);
    expect(second.trip.id).toBe(first.trip.id);
    expect(second.trip.externalGuestName).toBe('Anna Novotná');
    expect(second.trip.endDate.toISOString().slice(0, 10)).toBe('2026-05-13');
  });
});
```

- [ ] **Step 5: Run**

```bash
npm test -- tests/unit/trips-schema.test.ts tests/integration/trips.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/modules/trips/ tests/unit/trips-schema.test.ts tests/integration/trips.test.ts
git commit -m "feat(trips): service + zod schemas + tests (incl. upsertExternalTrip)"
```

---

## Task 8: Airbnb-sync module

**Files:**
- Create: `src/modules/airbnb-sync/index.ts`
- Create: `tests/integration/airbnb-sync.test.ts`

- [ ] **Step 1: Implement `src/modules/airbnb-sync/index.ts`**

```ts
import { parseIcs, extractAirbnbReservation } from '@/modules/ics-parser';
import * as calendars from '@/modules/calendars/service';
import * as trips from '@/modules/trips/service';

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  error: string | null;
}

export type IcsFetcher = (url: string) => Promise<string>;

/** Default fetcher — uses global fetch. Extracted so tests can inject a stub. */
const defaultFetcher: IcsFetcher = async (url) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};

export async function syncCalendar(
  calendarId: number,
  opts: { fetcher?: IcsFetcher } = {},
): Promise<SyncResult> {
  const fetcher = opts.fetcher ?? defaultFetcher;
  const cal = await calendars.getCalendarById(calendarId);
  if (!cal) {
    return { created: 0, updated: 0, skipped: 0, error: 'calendar not found' };
  }

  let text: string;
  try {
    text = await fetcher(cal.icsUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed';
    await calendars.touchLastSynced(cal.id, {
      lastSyncedAt: new Date(),
      lastSyncError: message,
    });
    return { created: 0, updated: 0, skipped: 0, error: message };
  }

  const events = parseIcs(text);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const ev of events) {
    const reservation = extractAirbnbReservation(ev);
    if (!reservation) {
      skipped++;
      continue;
    }
    const result = await trips.upsertExternalTrip({
      adminId: cal.property.ownerId,
      propertyId: cal.propertyId,
      calendarId: cal.id,
      source: 'AIRBNB_ICS',
      externalReservationId: ev.uid,
      externalConfirmCode: reservation.confirmCode,
      externalGuestName: reservation.guestName,
      externalGuestCount: null,
      startDate: ev.startDate,
      endDate: ev.endDate,
      title: reservation.guestName
        ? `Airbnb · ${reservation.guestName}`
        : `Airbnb · ${reservation.confirmCode}`,
      maxGuests: 8, // overridable by editing the trip manually
    });
    if (result.created) created++;
    else updated++;
  }

  await calendars.touchLastSynced(cal.id, {
    lastSyncedAt: new Date(),
    lastSyncError: null,
  });
  return { created, updated, skipped, error: null };
}
```

- [ ] **Step 2: Integration test `tests/integration/airbnb-sync.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startPg } from '../setup/pg-container.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const airbnbFixture = readFileSync(
  join(__dirname, '..', '..', 'src', 'modules', 'ics-parser', 'fixtures', 'airbnb.ics'),
  'utf8',
);

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.trip.deleteMany();
  await ctx.prisma.calendar.deleteMany();
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

async function seed() {
  process.env.DATABASE_URL = ctx.url;
  const users = await import('@/modules/users/service');
  const properties = await import('@/modules/properties/service');
  const calendars = await import('@/modules/calendars/service');
  const owner = await users.createUser({
    username: 'owner',
    email: 'o@example.com',
    password: 'secretpass!',
    role: 'ADMIN',
  });
  const prop = await properties.createProperty({
    name: 'P1',
    ownerId: owner.id,
    maxGuests: 4,
  });
  const cal = await calendars.createCalendar({
    propertyId: prop.id,
    name: 'Airbnb',
    icsUrl: 'https://www.airbnb.com/calendar/ical/1.ics?s=x',
    syncIntervalMin: 60,
  });
  return { owner, prop, cal };
}

describe('airbnb-sync syncCalendar', () => {
  it('creates trips for Reserved events and skips Not available blocks', async () => {
    const { cal } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');

    const result = await syncCalendar(cal.id, {
      fetcher: async () => airbnbFixture,
    });
    expect(result.error).toBeNull();
    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(1); // Not available

    const allTrips = await ctx.prisma.trip.findMany({ orderBy: { externalReservationId: 'asc' } });
    expect(allTrips).toHaveLength(2);
    expect(allTrips.map((t) => t.source)).toEqual(['AIRBNB_ICS', 'AIRBNB_ICS']);
    expect(allTrips[0]!.externalConfirmCode).toBe('HMABC12345');

    const cals = await import('@/modules/calendars/service');
    const after = await cals.getCalendarById(cal.id);
    expect(after?.lastSyncedAt).not.toBeNull();
    expect(after?.lastSyncError).toBeNull();
  });

  it('is idempotent — running twice gives 0 created, N updated', async () => {
    const { cal } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');
    await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    const second = await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(2);
  });

  it('records lastSyncError when the fetch fails', async () => {
    const { cal } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');
    const failing: () => Promise<string> = async () => {
      throw new Error('HTTP 503');
    };
    const result = await syncCalendar(cal.id, { fetcher: failing });
    expect(result.error).toBe('HTTP 503');
    const cals = await import('@/modules/calendars/service');
    const after = await cals.getCalendarById(cal.id);
    expect(after?.lastSyncError).toBe('HTTP 503');
  });
});
```

- [ ] **Step 3: Run**

```bash
npm test -- tests/integration/airbnb-sync.test.ts
```

Expected: `✓ 3 passed`.

- [ ] **Step 4: Commit**

```bash
git add src/modules/airbnb-sync/ tests/integration/airbnb-sync.test.ts
git commit -m "feat(airbnb-sync): syncCalendar with fetcher injection + integration tests"
```

---

## Task 9: Flash-message helper

A minimal cookie-based flash so sync routes can redirect back with a result banner.

**Files:**
- Create: `src/lib/flash.ts`

- [ ] **Step 1: Implement**

```ts
import { cookies } from 'next/headers';

const COOKIE = 'gr_flash';

export interface FlashPayload {
  kind: 'success' | 'error';
  message: string;
}

export async function setFlash(payload: FlashPayload): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, JSON.stringify(payload), {
    path: '/',
    maxAge: 30,
    sameSite: 'lax',
  });
}

export async function popFlash(): Promise<FlashPayload | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    c.delete(COOKIE);
    const parsed = JSON.parse(raw) as FlashPayload;
    if (parsed && (parsed.kind === 'success' || parsed.kind === 'error') && typeof parsed.message === 'string') {
      return parsed;
    }
  } catch {
    // Ignore malformed flash cookies.
  }
  return null;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/flash.ts
git commit -m "feat(lib): cookie-based flash message helper"
```

---

## Task 10: /admin/calendars pages + sync route

**Files:**
- Create: `src/app/(admin)/admin/calendars/page.tsx`
- Create: `src/app/(admin)/admin/calendars/new/page.tsx`
- Create: `src/app/(admin)/admin/calendars/new/actions.ts`
- Create: `src/app/(admin)/admin/calendars/[id]/edit/page.tsx`
- Create: `src/app/(admin)/admin/calendars/[id]/edit/actions.ts`
- Create: `src/app/(admin)/admin/calendars/[id]/edit/form.tsx`
- Create: `src/app/(admin)/admin/calendars/[id]/delete/route.ts`
- Create: `src/app/(admin)/admin/calendars/[id]/sync/route.ts`

- [ ] **Step 1: List page `.../calendars/page.tsx`**

```tsx
import Link from 'next/link';
import { Calendar as CalIcon, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listCalendars } from '@/modules/calendars/service';
import { popFlash } from '@/lib/flash';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

function formatWhen(d: Date | null): string {
  if (!d) return 'never';
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export default async function CalendarsPage() {
  await requireAdmin();
  const rows = await listCalendars();
  const flash = await popFlash();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Calendars</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Airbnb ics feeds. Import runs when you click Sync.
          </p>
        </div>
        <Link href="/admin/calendars/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New calendar</Button>
        </Link>
      </header>

      {flash && (
        <p
          className={
            flash.kind === 'success'
              ? 'rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700'
              : 'rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700'
          }
        >
          {flash.message}
        </p>
      )}

      <DataTable
        rowKey={(c) => c.id}
        rows={rows}
        columns={[
          { key: 'property', header: 'Property', render: (c) => (
            <Link href={`/admin/properties/${c.property.id}`} className="font-medium text-fg hover:text-accent-700">
              {c.property.name}
            </Link>
          ) },
          { key: 'name', header: 'Name', render: (c) => <span className="text-fg">{c.name}</span> },
          { key: 'lastSync', header: 'Last sync', render: (c) => (
            c.lastSyncError
              ? <Pill tone="danger">{c.lastSyncError}</Pill>
              : <span className="text-fg-muted text-xs">{formatWhen(c.lastSyncedAt)}</span>
          ) },
          { key: 'interval', header: 'Interval', align: 'right', render: (c) => (
            <span className="tabular-nums text-fg">{c.syncIntervalMin} min</span>
          ) },
          { key: 'actions', header: '', align: 'right', render: (c) => (
            <div className="flex items-center justify-end gap-3">
              <form action={`/admin/calendars/${c.id}/sync`} method="post">
                <button type="submit" className="text-sm font-medium text-accent-600 hover:text-accent-700">
                  Sync now
                </button>
              </form>
              <Link href={`/admin/calendars/${c.id}/edit`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
                Edit
              </Link>
            </div>
          ) },
        ]}
        emptyState={
          <>
            <CalIcon className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No calendars yet. <Link href="/admin/calendars/new" className="text-accent-600">Add one</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Create action `.../new/actions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { createCalendar } from '@/modules/calendars/service';
import { createCalendarSchema } from '@/modules/calendars/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createCalendarAction(
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();
  const parsed = createCalendarSchema.safeParse({
    propertyId: formData.get('propertyId'),
    name: formData.get('name'),
    icsUrl: formData.get('icsUrl'),
    syncIntervalMin: formData.get('syncIntervalMin') || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }
  await createCalendar(parsed.data);
  revalidatePath('/admin/calendars');
  redirect('/admin/calendars');
}
```

- [ ] **Step 3: New page `.../new/page.tsx`**

```tsx
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { NewCalendarForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewCalendarPage() {
  await requireAdmin();
  const props = await listProperties();

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">New calendar</h1>
          <p className="mt-1 text-sm text-fg-muted">Paste an Airbnb or other iCal URL.</p>
        </div>
        <Link href="/admin/calendars" className="text-sm text-accent-600 hover:text-accent-700">
          Back
        </Link>
      </header>

      <NewCalendarForm properties={props.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
```

Split the form into a client component alongside: `src/app/(admin)/admin/calendars/new/form.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { createCalendarAction } from './actions';

interface Props {
  properties: Array<{ id: number; name: string }>;
}

export function NewCalendarForm({ properties }: Props) {
  const [state, action, pending] = useActionState(createCalendarAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="propertyId" label="Property" required error={fe.propertyId}>
        <Select id="propertyId" name="propertyId" required defaultValue="">
          <option value="" disabled>Choose a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <FormField id="name" label="Name" required error={fe.name} description="e.g. 'Airbnb — Tatranská Perla 2B'.">
        <Input id="name" name="name" required />
      </FormField>

      <FormField id="icsUrl" label="iCal URL" required error={fe.icsUrl}>
        <Input id="icsUrl" name="icsUrl" type="url" inputMode="url" required placeholder="https://www.airbnb.com/calendar/ical/…" />
      </FormField>

      <FormField id="syncIntervalMin" label="Sync interval (minutes)" description="Used when scheduled sync is enabled (M7)." error={fe.syncIntervalMin}>
        <Input id="syncIntervalMin" name="syncIntervalMin" type="number" min={5} max={1440} defaultValue={60} />
      </FormField>

      <div className="mt-2 flex items-center justify-end gap-3">
        <Link href="/admin/calendars"><Button variant="ghost" type="button">Cancel</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create calendar'}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Edit action `.../[id]/edit/actions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { updateCalendar } from '@/modules/calendars/service';
import { updateCalendarSchema } from '@/modules/calendars/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function updateCalendarAction(
  id: number,
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();
  const parsed = updateCalendarSchema.safeParse({
    name: formData.get('name'),
    icsUrl: formData.get('icsUrl'),
    syncIntervalMin: formData.get('syncIntervalMin'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }
  await updateCalendar(id, parsed.data);
  revalidatePath('/admin/calendars');
  redirect('/admin/calendars');
}
```

- [ ] **Step 5: Edit form `.../[id]/edit/form.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { updateCalendarAction } from './actions';

interface Props {
  id: number;
  initial: { name: string; icsUrl: string; syncIntervalMin: number };
}

export function EditCalendarForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updateCalendarAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        <FormField id="name" label="Name" required error={fe.name}>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </FormField>
        <FormField id="icsUrl" label="iCal URL" required error={fe.icsUrl}>
          <Input id="icsUrl" name="icsUrl" type="url" defaultValue={initial.icsUrl} required />
        </FormField>
        <FormField id="syncIntervalMin" label="Sync interval (minutes)" error={fe.syncIntervalMin}>
          <Input id="syncIntervalMin" name="syncIntervalMin" type="number" min={5} max={1440} defaultValue={initial.syncIntervalMin} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href="/admin/calendars"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>

      <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
        <h2 className="text-sm font-semibold text-danger-700">Delete calendar</h2>
        <p className="mt-1 text-xs text-danger-700/80">
          Imported trips keep their data but lose the link to this calendar.
        </p>
        <form
          action={`/admin/calendars/${id}/delete`}
          method="post"
          className="mt-5 flex justify-end"
          onSubmit={(e) => { if (!confirm('Delete this calendar?')) e.preventDefault(); }}
        >
          <Button type="submit" variant="danger">Delete</Button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Edit page `.../[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getCalendarById } from '@/modules/calendars/service';
import { EditCalendarForm } from './form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCalendarPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const cal = await getCalendarById(id);
  if (!cal) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit calendar</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {cal.property.name} · {cal.name}
          </p>
        </div>
        <Link href="/admin/calendars" className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>

      <EditCalendarForm
        id={cal.id}
        initial={{ name: cal.name, icsUrl: cal.icsUrl, syncIntervalMin: cal.syncIntervalMin }}
      />
    </div>
  );
}
```

- [ ] **Step 7: Delete route `.../[id]/delete/route.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { deleteCalendar } from '@/modules/calendars/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await deleteCalendar(id);
  revalidatePath('/admin/calendars');
  return NextResponse.redirect(new URL('/admin/calendars', req.url), 303);
}
```

- [ ] **Step 8: Sync route `.../[id]/sync/route.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { syncCalendar } from '@/modules/airbnb-sync';
import { setFlash } from '@/lib/flash';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await syncCalendar(id);
  if (r.error) {
    await setFlash({ kind: 'error', message: `Sync failed: ${r.error}` });
  } else {
    await setFlash({
      kind: 'success',
      message: `Sync complete — ${r.created} created, ${r.updated} updated, ${r.skipped} skipped.`,
    });
  }
  revalidatePath('/admin/calendars');
  return NextResponse.redirect(new URL('/admin/calendars', req.url), 303);
}
```

- [ ] **Step 9: Typecheck + build**

```bash
npm run typecheck && npm run build 2>&1 | tail -20
```

Expected: passes; new routes listed.

- [ ] **Step 10: Commit**

```bash
git add 'src/app/(admin)/admin/calendars/'
git commit -m "feat(admin): calendars list + new + edit + delete + manual sync"
```

---

## Task 11: /admin/trips list with filters

**Files:**
- Create: `src/app/(admin)/admin/trips/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from 'next/link';
import { Plane, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listTrips } from '@/modules/trips/service';
import { tripFiltersSchema } from '@/modules/trips/schema';
import { listProperties } from '@/modules/properties/service';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function pillToneForSource(s: string) {
  if (s === 'AIRBNB_ICS') return 'info' as const;
  if (s === 'WEBHOOK') return 'accent' as const;
  return 'neutral' as const;
}

export default async function TripsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const parsed = tripFiltersSchema.safeParse({
    propertyId: sp.propertyId ?? undefined,
    source: sp.source ?? undefined,
    from: sp.from ?? undefined,
    to: sp.to ?? undefined,
    includePast: sp.includePast === '1' ? 'true' : 'false',
  });
  const filters = parsed.success ? parsed.data : { includePast: false };

  const [trips, properties] = await Promise.all([
    listTrips(admin.id, filters),
    listProperties(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Trips</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Reservations — manual and imported from Airbnb.
          </p>
        </div>
        <Link href="/admin/trips/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New trip</Button>
        </Link>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Property</label>
          <Select name="propertyId" defaultValue={sp.propertyId?.toString() ?? ''}>
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Source</label>
          <Select name="source" defaultValue={sp.source?.toString() ?? ''}>
            <option value="">All</option>
            <option value="MANUAL">Manual</option>
            <option value="AIRBNB_ICS">Airbnb</option>
            <option value="WEBHOOK">Webhook</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">From</label>
          <Input name="from" type="date" defaultValue={sp.from?.toString() ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">To</label>
          <Input name="to" type="date" defaultValue={sp.to?.toString() ?? ''} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="includePast" value="1" defaultChecked={sp.includePast === '1'} className="h-4 w-4 rounded border-border accent-accent-500" />
          Include past
        </label>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      <DataTable
        rowKey={(t) => t.id}
        rows={trips}
        columns={[
          { key: 'title', header: 'Title', render: (t) => (
            <Link href={`/admin/trips/${t.id}`} className="font-medium text-fg hover:text-accent-700">
              {t.title}
            </Link>
          ) },
          { key: 'property', header: 'Property', render: (t) => <span className="text-fg-muted">{t.property.name}</span> },
          { key: 'dates', header: 'Dates', render: (t) => (
            <span className="text-fg">{fmtDate(t.startDate)} → {fmtDate(t.endDate)}</span>
          ) },
          { key: 'source', header: 'Source', render: (t) => <Pill tone={pillToneForSource(t.source)}>{t.source.toLowerCase()}</Pill> },
          { key: 'guest', header: 'Guest', render: (t) => (
            <span className="text-fg-muted">{t.externalGuestName ?? '—'}</span>
          ) },
          { key: 'actions', header: '', align: 'right', render: (t) => (
            <Link href={`/admin/trips/${t.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Open
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <Plane className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No trips match these filters. <Link href="/admin/trips/new" className="text-accent-600">Add manually</Link> or sync a calendar.
            </p>
          </>
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
npm run typecheck && npm run build 2>&1 | tail -15
```

Expected: passes; `/admin/trips` listed.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(admin)/admin/trips/page.tsx'
git commit -m "feat(admin): trips list with property/source/date filters"
```

---

## Task 12: /admin/trips/new + action

**Files:**
- Create: `src/app/(admin)/admin/trips/new/page.tsx`
- Create: `src/app/(admin)/admin/trips/new/actions.ts`
- Create: `src/app/(admin)/admin/trips/new/form.tsx`

- [ ] **Step 1: Action**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { createTrip } from '@/modules/trips/service';
import { createTripSchema } from '@/modules/trips/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createTripAction(
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  const admin = await requireAdmin();
  const parsed = createTripSchema.safeParse({
    title: formData.get('title'),
    propertyId: formData.get('propertyId'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    maxGuests: formData.get('maxGuests'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }
  const trip = await createTrip(admin.id, parsed.data);
  revalidatePath('/admin/trips');
  redirect(`/admin/trips/${trip.id}`);
}
```

- [ ] **Step 2: Form**

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { createTripAction } from './actions';

interface Props {
  properties: Array<{ id: number; name: string; maxGuests: number | null }>;
}

export function NewTripForm({ properties }: Props) {
  const [state, action, pending] = useActionState(createTripAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="title" label="Title" required error={fe.title} description="What you'll call this trip internally.">
        <Input id="title" name="title" required />
      </FormField>

      <FormField id="propertyId" label="Property" required error={fe.propertyId}>
        <Select id="propertyId" name="propertyId" required defaultValue="">
          <option value="" disabled>Choose a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="startDate" label="Start date" required error={fe.startDate}>
          <Input id="startDate" name="startDate" type="date" required />
        </FormField>
        <FormField id="endDate" label="End date" required error={fe.endDate}>
          <Input id="endDate" name="endDate" type="date" required />
        </FormField>
      </div>

      <FormField id="maxGuests" label="Max guests" required error={fe.maxGuests}>
        <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={2} required />
      </FormField>

      <FormField id="notes" label="Notes" description="Optional admin notes." error={fe.notes}>
        <Textarea id="notes" name="notes" rows={3} />
      </FormField>

      <div className="mt-2 flex items-center justify-end gap-3">
        <Link href="/admin/trips"><Button variant="ghost" type="button">Cancel</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create trip'}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Page**

```tsx
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { NewTripForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewTripPage() {
  await requireAdmin();
  const props = await listProperties();

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">New trip</h1>
          <p className="mt-1 text-sm text-fg-muted">A manual reservation (not imported from Airbnb).</p>
        </div>
        <Link href="/admin/trips" className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>

      <NewTripForm properties={props.map((p) => ({ id: p.id, name: p.name, maxGuests: p.maxGuests }))} />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(admin)/admin/trips/new/'
git commit -m "feat(admin): /admin/trips/new (manual trip creation)"
```

---

## Task 13: Copy-button primitive

**Files:**
- Create: `src/components/admin/copy-button.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = 'Copy', className }: Props) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-fg hover:bg-surface-hover',
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
      {copied ? 'Copied' : label}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/copy-button.tsx
git commit -m "feat(admin): CopyButton primitive"
```

---

## Task 14: /admin/trips/[id] detail + edit + delete

**Files:**
- Create: `src/app/(admin)/admin/trips/[id]/page.tsx`
- Create: `src/app/(admin)/admin/trips/[id]/edit/page.tsx`
- Create: `src/app/(admin)/admin/trips/[id]/edit/actions.ts`
- Create: `src/app/(admin)/admin/trips/[id]/edit/form.tsx`
- Create: `src/app/(admin)/admin/trips/[id]/delete/route.ts`

- [ ] **Step 1: Detail page with registration link + QR**

`src/app/(admin)/admin/trips/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getTripById } from '@/modules/trips/service';
import { renderQrSvg } from '@/lib/qr';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { CopyButton } from '@/components/admin/copy-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function baseUrl(): string {
  // SERVER_URL is not part of the zod-validated `env` module (which is the M1 subset).
  // Reading process.env directly here is acceptable: this is a presentation concern
  // (building public URLs for copy/QR) and falls back to localhost in dev.
  const url = process.env.SERVER_URL ?? 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

export default async function TripDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const trip = await getTripById(id);
  if (!trip) notFound();

  const confirmCode = trip.externalConfirmCode;
  const registrationUrl = confirmCode ? `${baseUrl()}/register/${confirmCode}` : null;
  const qrSvg = registrationUrl ? await renderQrSvg(registrationUrl) : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{trip.title}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {trip.property.name} · {trip.startDate.toISOString().slice(0, 10)} → {trip.endDate.toISOString().slice(0, 10)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/trips/${trip.id}/edit`}><Button variant="secondary">Edit</Button></Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-fg-muted">Source</dt>
          <dd><Pill tone={trip.source === 'MANUAL' ? 'neutral' : 'info'}>{trip.source.toLowerCase()}</Pill></dd>
          <dt className="text-fg-muted">Max guests</dt>
          <dd className="text-fg">{trip.maxGuests}</dd>
          <dt className="text-fg-muted">Guest</dt>
          <dd className="text-fg">{trip.externalGuestName ?? '—'}</dd>
          {trip.externalReservationId && (<>
            <dt className="text-fg-muted">Airbnb reservation</dt>
            <dd className="text-fg font-mono text-xs">{trip.externalReservationId}</dd>
          </>)}
          <dt className="text-fg-muted">Notes</dt>
          <dd className="text-fg whitespace-pre-wrap">{trip.notes ?? '—'}</dd>
        </dl>
      </section>

      {registrationUrl && qrSvg ? (
        <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-fg">Registration link</h2>
              <p className="mt-1 text-xs text-fg-muted">
                Share this with guests. It opens the registration form prefilled with this trip.
              </p>
            </div>
            <CopyButton value={registrationUrl} label="Copy URL" />
          </div>
          <div className="mt-4 grid grid-cols-[auto_1fr] items-start gap-6">
            <div
              className="h-40 w-40 shrink-0 rounded-md border border-border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div className="flex flex-col gap-3">
              <code className="break-all rounded-md border border-border bg-surface-2 p-2 font-mono text-xs text-fg">
                {registrationUrl}
              </code>
              <p className="text-xs text-fg-muted">
                Confirm code: <span className="font-mono">{confirmCode}</span>
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-warning-100 bg-warning-100 p-6">
          <h2 className="text-sm font-semibold text-warning-700">No registration link</h2>
          <p className="mt-1 text-xs text-warning-700/80">
            This trip has no confirm code. Delete and recreate it to regenerate one.
          </p>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Edit action**

`src/app/(admin)/admin/trips/[id]/edit/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { updateTrip } from '@/modules/trips/service';
import { updateTripSchema } from '@/modules/trips/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function updateTripAction(
  id: number,
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();
  const parsed = updateTripSchema.safeParse({
    title: formData.get('title'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    maxGuests: formData.get('maxGuests'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }
  await updateTrip(id, parsed.data);
  revalidatePath('/admin/trips');
  revalidatePath(`/admin/trips/${id}`);
  redirect(`/admin/trips/${id}`);
}
```

- [ ] **Step 3: Edit form**

`src/app/(admin)/admin/trips/[id]/edit/form.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { updateTripAction } from './actions';

interface Props {
  id: number;
  initial: { title: string; startDate: string; endDate: string; maxGuests: number; notes: string | null };
}

export function EditTripForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updateTripAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        <FormField id="title" label="Title" required error={fe.title}>
          <Input id="title" name="title" defaultValue={initial.title} required />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="startDate" label="Start date" required error={fe.startDate}>
            <Input id="startDate" name="startDate" type="date" defaultValue={initial.startDate} required />
          </FormField>
          <FormField id="endDate" label="End date" required error={fe.endDate}>
            <Input id="endDate" name="endDate" type="date" defaultValue={initial.endDate} required />
          </FormField>
        </div>
        <FormField id="maxGuests" label="Max guests" required error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={initial.maxGuests} required />
        </FormField>
        <FormField id="notes" label="Notes" error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ''} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href={`/admin/trips/${id}`}><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>

      <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
        <h2 className="text-sm font-semibold text-danger-700">Delete trip</h2>
        <p className="mt-1 text-xs text-danger-700/80">
          Hard-delete. Use this for test data only — real reservations should be kept for history.
        </p>
        <form
          action={`/admin/trips/${id}/delete`}
          method="post"
          className="mt-5 flex justify-end"
          onSubmit={(e) => { if (!confirm('Delete this trip?')) e.preventDefault(); }}
        >
          <Button type="submit" variant="danger">Delete</Button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Edit page**

`src/app/(admin)/admin/trips/[id]/edit/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getTripById } from '@/modules/trips/service';
import { EditTripForm } from './form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTripPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const trip = await getTripById(id);
  if (!trip) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit trip</h1>
          <p className="mt-1 text-sm text-fg-muted">{trip.title}</p>
        </div>
        <Link href={`/admin/trips/${trip.id}`} className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>

      <EditTripForm
        id={trip.id}
        initial={{
          title: trip.title,
          startDate: trip.startDate.toISOString().slice(0, 10),
          endDate: trip.endDate.toISOString().slice(0, 10),
          maxGuests: trip.maxGuests,
          notes: trip.notes,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Delete route**

`src/app/(admin)/admin/trips/[id]/delete/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { deleteTrip } from '@/modules/trips/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await deleteTrip(id);
  revalidatePath('/admin/trips');
  return NextResponse.redirect(new URL('/admin/trips', req.url), 303);
}
```

- [ ] **Step 6: Typecheck + build**

```bash
npm run typecheck && npm run build 2>&1 | tail -20
```

Expected: all routes listed, no errors.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(admin)/admin/trips/[id]/'
git commit -m "feat(admin): trip detail with registration link + QR, edit + delete"
```

---

## Task 15: Wire dashboard "Arriving this week" with real data

**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat 'src/app/(admin)/admin/dashboard/page.tsx' | head -5
```

Confirm it's the M1 placeholder version.

- [ ] **Step 2: Replace its body with the live version**

Replace the whole file contents with:

```tsx
import Link from 'next/link';
import {
  AlertCircle,
  ClipboardCheck,
  Plane,
  Receipt,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { getUpcomingForAdmin } from '@/modules/trips/service';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface AttentionItem {
  icon: LucideIcon;
  tone: 'warning' | 'danger';
  title: string;
  meta: string;
  action: string;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const upcoming = await getUpcomingForAdmin(admin.id);

  const kpis = [
    { label: 'Arrivals this week', value: upcoming.length, icon: Plane },
    { label: 'Pending registrations', value: 0, icon: ClipboardCheck, delta: 'wires in M4', tone: 'neutral' as const },
    { label: 'Unpaid housekeeping', value: 0, icon: Sparkles, delta: 'wires in M6', tone: 'neutral' as const },
    { label: 'Overdue invoices', value: 0, icon: Receipt, delta: 'wires in M5', tone: 'neutral' as const },
  ];

  // M3 — no real source yet for pending reviews / sync failures / overdue invoices.
  // Show a static "nothing right now" list rather than fake data.
  const attention: AttentionItem[] = [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Welcome back, {admin.username}. Here&apos;s what&apos;s happening today.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            {...('delta' in k && k.delta ? { delta: k.delta } : {})}
            {...('tone' in k && k.tone ? { tone: k.tone } : {})}
            icon={k.icon}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <span className="text-xs text-fg-muted">{attention.length} items</span>
          </CardHeader>
          {attention.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <AlertCircle className="h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
              <p className="text-sm text-fg-muted">Nothing to review right now.</p>
            </div>
          ) : (
            <ul>{/* wires in M4+ */}</ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Arriving this week</CardTitle>
            <Link
              href="/admin/trips"
              className="text-xs font-medium text-accent-600 hover:text-accent-700"
            >
              View all trips
            </Link>
          </CardHeader>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Plane className="h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
              <p className="text-sm text-fg-muted">
                No arrivals in the next 7 days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {['Trip', 'Property', 'Dates', 'Source', 'Guest'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((t, i) => (
                    <tr key={t.id} className={`${i < upcoming.length - 1 ? 'border-b border-border' : ''} hover:bg-surface-2`}>
                      <td className="px-4 py-3 font-medium text-fg">
                        <Link href={`/admin/trips/${t.id}`} className="hover:text-accent-700">{t.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-fg">{t.property.name}</td>
                      <td className="px-4 py-3 text-fg-muted">{fmtDate(t.startDate)} → {fmtDate(t.endDate)}</td>
                      <td className="px-4 py-3">
                        <Pill tone={t.source === 'MANUAL' ? 'neutral' : 'info'}>{t.source.toLowerCase()}</Pill>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{t.externalGuestName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + build**

```bash
npm run typecheck && npm run build 2>&1 | tail -15
```

Expected: passes; `/admin/dashboard` listed.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(admin)/admin/dashboard/page.tsx'
git commit -m "feat(dashboard): wire 'Arriving this week' + KPI to real trips data"
```

---

## Task 16: Final verification + tag + push

- [ ] **Step 1: Full verification**

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
npm run typecheck
npm test
npm run build 2>&1 | tail -30
```

Expected:
- Typecheck clean.
- All tests pass (M1+M2 = 36, M3 adds: 4 confirm-code + 3 qr + 4 ics-parser + 3 calendars-schema + 4 trips-schema = 18 new unit; 2 calendars-integration + 3 trips-integration + 3 airbnb-sync = 8 new integration; **total 36 + 26 = 62**).
- Build lists all new routes.

- [ ] **Step 2: Browser smoke**

```bash
PORT=4100 npm run dev > /tmp/gr-dev.log 2>&1 &
echo $! > /tmp/gr-dev.pid
sleep 7

cat > mk-sess.mjs <<'EOF'
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const token = crypto.randomBytes(20).toString('base64url');
const id = crypto.createHash('sha256').update(token).digest('hex');
await prisma.session.create({ data: { id, userId: 1, expiresAt: new Date(Date.now() + 30*24*60*60*1000) } });
console.log(token);
await prisma.$disconnect();
EOF
TOKEN=$(node mk-sess.mjs)
rm mk-sess.mjs

for path in /admin/dashboard /admin/calendars /admin/calendars/new /admin/trips /admin/trips/new; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: guest_reg_session=$TOKEN" "http://localhost:4100$path")
  echo "$path -> $code"
done

kill $(cat /tmp/gr-dev.pid) 2>/dev/null
```

Expected: all five return `200`.

- [ ] **Step 3: Tag the milestone**

```bash
git -c user.email="2478078+martin-janci@users.noreply.github.com" \
    -c user.name="Martin Janči" \
    tag -a m3-trips-calendars -m "M3: trips & calendars

- Calendar CRUD (property x icsUrl x syncIntervalMin)
- Trip CRUD (manual + imported) with filters and registration link + QR
- ics-parser (pure, fixture-driven)
- airbnb-sync with injectable fetcher, idempotent via externalReservationId
- Manual 'Sync now' per calendar with flash messages
- Dashboard 'Arriving this week' wired to real trips data

All tests green, typecheck clean, production build OK."
```

- [ ] **Step 4: Push**

```bash
git push -u origin refs/heads/m3-trips-calendars
git push origin refs/tags/m3-trips-calendars
```

Expected: branch + tag appear at `https://github.com/martin-janci/guest-registration`.

---

## Out of scope for M3 (tracked for later milestones)

- Scheduled sync (node-cron, `Job` table, retry logic, Synology external-trigger endpoint) → **M7**.
- Guest registration flow at `/register/[code]` + the public form → **M4**.
- Email with registration link when a trip is created/imported → **M4**.
- Housekeeping tasks auto-created when a trip imports → **M6**.
- Invoices linked to trips → **M5**.

## Spec coverage check

| Spec requirement | Implemented in |
|---|---|
| Calendar schema (§4) | Task 1 |
| Trip schema + TripSource enum (§4) | Task 1 |
| Admin CRUD for calendars + trips (§3) | Tasks 10–14 |
| ICS parser + Airbnb sync flow (§5.3, "Airbnb ics sync") | Tasks 5, 8 |
| Registration link per trip (§5.1, implied by `externalConfirmCode`) | Tasks 3, 14 |
| Dashboard "Arriving this week" with real data (§5.2) | Task 15 |
| Module boundaries (§3 principles — one domain, one folder) | Tasks 6, 7, 8 |
| Zod schemas shared across client/server (§3 principles) | Tasks 6, 7 |
| Authorization gate on every mutation (§3 principles) | Every action file |
| Integration tests via Testcontainers (§9) | Tasks 6, 7, 8 |
| Injection-ready sync fetcher so it's testable without hitting Airbnb (§9 "no mock DB in integration tests" — we mock only the external HTTP edge) | Task 8 |
