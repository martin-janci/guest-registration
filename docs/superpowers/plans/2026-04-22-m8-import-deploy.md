# M8 — Legacy Import, Docker Deploy, E2E & Cutover

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use `- [ ]` checkbox syntax.

**Goal:** Ship v0.1 — a one-way legacy importer (Flask pg_dump → v2 Prisma schema + MinIO), a multi-stage Dockerfile, a docker-compose for the Synology NAS, three Playwright happy-path E2Es, and a cutover runbook. After M8 the v2 app can take over `airbnb.rlt.sk`.

**Architecture:** `scripts/import-legacy.ts` loads a checked-in mini SQL dump into a Testcontainers Postgres (staging), then streams rows through Prisma into the v2 schema — renaming `amenity→property`, collapsing `guest_reg_` prefixes, mapping status strings to enums, `is_deleted=true → deletedAt`, string `role → UserRole` enum. Document and housekeeping-photo files are read from an uploads tarball and uploaded to MinIO under the same storage-key conventions already used by M4/M6. A verification pass asserts row counts, FK validity, and the M5 invariant `sum(InvoiceItem.totalWithVat) == Invoice.totalAmount`. The Dockerfile uses Next.js 15's `output: 'standalone'` in a `deps → builder → runner` flow; docker-compose wires the app + Postgres 16 + shared external MinIO. Playwright covers guest self-registration, admin invoice flow, and housekeeper photo upload.

**Tech Stack:** `pg` (read staging dump), `tar` node API (read uploads tarball), `@playwright/test`, Docker BuildKit multi-stage, Prisma's existing client.

**Repo root:** `/Users/martinjanci/projects/github.com/martin-janci/guest-registration/`.
**Branch:** `m8-import-deploy` (controller creates from `refs/tags/m7-scheduler`).
**Prior state:** `m7-scheduler` — 138/138 tests, typecheck clean, build OK.

---

## Scope

**In M8:**
- `prisma/seed-legacy-mini.sql` — checked-in 20-row mini dump covering every entity with every interesting enum value.
- `tests/fixtures/legacy-uploads.tar` — checked-in tarball with 2 tiny document images + 1 housekeeping photo.
- `scripts/import-legacy.ts` — CLI: `tsx scripts/import-legacy.ts --dump <file.sql> --uploads <file.tar> [--dry-run]`.
- `src/modules/legacy-import/` — `stage.ts` (load SQL into throwaway schema), `transform.ts` (row-level mappers), `upload.ts` (file → MinIO), `verify.ts` (invariants), `index.ts` (orchestrator).
- Contract test: `tests/integration/legacy-import.test.ts` — golden-file — given mini dump + fixture tarball, produce expected DB state.
- `Dockerfile` multi-stage + `.dockerignore` tuned for Next.js standalone.
- `docker-compose.yml` + `.env.example` for NAS deployment (`/volume1/homes/mjanci/guest-registration-v2/`).
- Playwright config + 3 E2E specs (guest self-registration, admin invoice, housekeeper task).
- `docs/superpowers/runbooks/cutover.md` — pre-flight checklist, cutover steps, rollback plan.
- Tag `v0.1` on final green commit.

**Out of M8 (deferred):**
- CI image publish to `registry.rlt.sk` — manual `docker push` during cutover.
- Staging schema cleanup job — importer drops the throwaway schema on exit; acceptable.
- Legacy read-only mirror at `airbnb-legacy.rlt.sk` — nginx-proxy config change, not app code.
- i18n translations carried over from Flask — v2 is English-first; translations future work.
- Rate-limiting on `/register/*` — spec open question, defer to v0.2.

---

## File structure

```
scripts/
  import-legacy.ts                          # CLI entry
src/modules/legacy-import/
  index.ts                                  # run(opts) — orchestrator
  stage.ts                                  # loadDumpIntoStaging(sql, pgClient) → stagingSchema
  transform.ts                              # mapUser, mapProperty, mapCalendar, mapTrip,
                                            # mapRegistration, mapGuest, mapInvoice,
                                            # mapInvoiceItem, mapHousekeeping, mapHousekeepingPhoto
  upload.ts                                 # streamFileFromTar → putObject
  verify.ts                                 # rowCounts, fkSweep, invoiceTotalsInvariant
prisma/
  seed-legacy-mini.sql                      # fixture, hand-written
tests/fixtures/
  legacy-uploads.tar                        # fixture, 3 tiny files
tests/integration/
  legacy-import.test.ts                     # golden-file contract test
Dockerfile                                  # multi-stage
.dockerignore
docker-compose.yml                          # NAS deployment
.env.example                                # prod env template
e2e/
  playwright.config.ts
  guest-self-registration.spec.ts
  admin-invoice.spec.ts
  housekeeper-task.spec.ts
  fixtures/
    seed.ts                                 # reusable seed per spec
docs/superpowers/runbooks/
  cutover.md
```

---

## Branch setup

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
git fetch --tags
git checkout -b m8-import-deploy refs/tags/m7-scheduler
```

---

## Task 1: Legacy import skeleton + mini dump fixture

**Files:**
- Create: `prisma/seed-legacy-mini.sql`
- Create: `tests/fixtures/legacy-uploads.tar` (binary; built in this task)
- Create: `scripts/import-legacy.ts`
- Create: `src/modules/legacy-import/index.ts`

- [ ] **Step 1: Write `prisma/seed-legacy-mini.sql`**

A single SQL file that, when run against an empty Postgres, produces tables + rows matching the live legacy schema's *subset* we import. Include the `guest_reg_` prefix to match real dumps. Aim for: 2 users (admin + housekeeper), 2 amenities (one active, one soft-deleted), 2 calendars, 3 trips (one AIRBNB, one MANUAL, one with `is_deleted=true`), 2 registrations (pending + approved), 3 guests (adult + adult + child), 2 invoices (DRAFT + SENT) with 2 items each, 2 housekeeping rows (one paid + one unpaid) with 1 photo.

```sql
-- Minimal legacy schema subset (just columns the importer reads).
-- Column names and types match the live production dump verbatim.

CREATE TABLE guest_reg_user (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(120),
  role VARCHAR(20) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_amenity (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255),
  admin_id INTEGER REFERENCES guest_reg_user(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_calendar (
  id SERIAL PRIMARY KEY,
  amenity_id INTEGER REFERENCES guest_reg_amenity(id),
  ics_url TEXT NOT NULL,
  sync_interval INTEGER DEFAULT 60,
  last_synced_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_trip (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amenity_id INTEGER REFERENCES guest_reg_amenity(id),
  admin_id INTEGER REFERENCES guest_reg_user(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  confirm_code VARCHAR(32) UNIQUE,
  source VARCHAR(16) DEFAULT 'MANUAL',
  external_reservation_id VARCHAR(64),
  external_confirm_code VARCHAR(64),
  external_guest_name VARCHAR(255),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_registration (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES guest_reg_trip(id),
  status VARCHAR(20) NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  gdpr_consent BOOLEAN DEFAULT FALSE
);

CREATE TABLE guest_reg_guest (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER REFERENCES guest_reg_registration(id),
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  date_of_birth DATE,
  age_category VARCHAR(10) NOT NULL,
  document_type VARCHAR(20),
  document_number VARCHAR(64),
  document_image VARCHAR(255),
  nationality VARCHAR(2)
);

CREATE TABLE guest_reg_invoice (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES guest_reg_user(id),
  invoice_number VARCHAR(32) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_address TEXT,
  client_ico VARCHAR(32),
  client_dic VARCHAR(32),
  client_icdph VARCHAR(32),
  currency VARCHAR(3) DEFAULT 'EUR',
  issued_at DATE NOT NULL,
  due_date DATE,
  delivered_at DATE,
  status VARCHAR(16) NOT NULL,
  notes TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guest_reg_invoice_item (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES guest_reg_invoice(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(4,2) DEFAULT 0.0,
  total_with_vat NUMERIC(10,2) NOT NULL,
  position INTEGER DEFAULT 0
);

CREATE TABLE guest_reg_housekeeping (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES guest_reg_trip(id),
  amenity_id INTEGER REFERENCES guest_reg_amenity(id),
  housekeeper_id INTEGER REFERENCES guest_reg_user(id),
  service_date DATE NOT NULL,
  status VARCHAR(16) NOT NULL,
  pay_amount NUMERIC(10,2),
  paid BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);

CREATE TABLE guest_reg_housekeeping_photo (
  id SERIAL PRIMARY KEY,
  housekeeping_id INTEGER REFERENCES guest_reg_housekeeping(id),
  file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ------ DATA ------
INSERT INTO guest_reg_user (id, username, password_hash, email, role) VALUES
  (1, 'admin',   'pbkdf2:sha256:dummy', 'admin@example.com', 'admin'),
  (2, 'cleaner', 'pbkdf2:sha256:dummy', 'hk@example.com',    'housekeeper');

INSERT INTO guest_reg_amenity (id, name, address, admin_id, is_deleted) VALUES
  (1, 'Villa A', 'Street 1, Bratislava', 1, FALSE),
  (2, 'Villa B (archived)', 'Street 2', 1, TRUE);

INSERT INTO guest_reg_calendar (id, amenity_id, ics_url, sync_interval) VALUES
  (1, 1, 'https://www.airbnb.com/calendar/ical/xxxx.ics', 60),
  (2, 2, 'https://www.airbnb.com/calendar/ical/yyyy.ics', 120);

INSERT INTO guest_reg_trip (id, title, amenity_id, admin_id, start_date, end_date, confirm_code, source, external_reservation_id, external_guest_name, is_deleted) VALUES
  (1, 'May stay',       1, 1, '2026-05-01', '2026-05-05', 'ABC123',   'MANUAL',  NULL, NULL, FALSE),
  (2, 'Airbnb arrival', 1, 1, '2026-05-10', '2026-05-15', 'AIRBXYZ',  'AIRBNB', 'HMABCDEFGH', 'John Smith', FALSE),
  (3, 'Cancelled',      2, 1, '2026-04-01', '2026-04-02', 'CANC01',   'MANUAL',  NULL, NULL, TRUE);

INSERT INTO guest_reg_registration (id, trip_id, status, gdpr_consent) VALUES
  (1, 1, 'pending', TRUE),
  (2, 2, 'approved', TRUE);

INSERT INTO guest_reg_guest (id, registration_id, first_name, last_name, date_of_birth, age_category, document_type, document_number, document_image, nationality) VALUES
  (1, 1, 'Alice',   'Doe',   '1985-03-14', 'adult', 'passport', 'P1234567', 'registration_1_alice.jpg', 'SK'),
  (2, 2, 'Bob',     'Smith', '1990-06-22', 'adult', 'idcard',   'ID999888', 'registration_2_bob.jpg',   'CZ'),
  (3, 2, 'Charlie', 'Smith', '2020-01-01', 'child', NULL,       NULL,       NULL,                        'CZ');

INSERT INTO guest_reg_invoice (id, admin_id, invoice_number, client_name, client_address, currency, issued_at, due_date, status, total_amount) VALUES
  (1, 1, '2026-0001', 'ACME s.r.o.',  'Street 3, BA', 'EUR', '2026-04-10', '2026-04-24', 'DRAFT', 120.00),
  (2, 1, '2026-0002', 'Beta spol.',   'Street 4, KE', 'EUR', '2026-04-12', '2026-04-26', 'SENT',   96.00);

INSERT INTO guest_reg_invoice_item (id, invoice_id, description, quantity, unit_price, vat_rate, total_with_vat, position) VALUES
  (1, 1, 'Cleaning', 2, 50.00, 0.20, 120.00, 1),
  (2, 1, 'Linen',    0, 0.00,  0.00,   0.00, 2),
  (3, 2, 'Stay x4',  4, 20.00, 0.20,  96.00, 1),
  (4, 2, 'Extras',   0, 0.00,  0.00,   0.00, 2);

INSERT INTO guest_reg_housekeeping (id, trip_id, amenity_id, housekeeper_id, service_date, status, pay_amount, paid) VALUES
  (1, 1, 1, 2, '2026-05-05', 'COMPLETED', 25.00, TRUE),
  (2, 2, 1, 2, '2026-05-15', 'PENDING',   25.00, FALSE);

INSERT INTO guest_reg_housekeeping_photo (id, housekeeping_id, file_path) VALUES
  (1, 1, 'housekeeping_1_clean.jpg');

SELECT setval('guest_reg_user_id_seq', 2);
SELECT setval('guest_reg_amenity_id_seq', 2);
SELECT setval('guest_reg_calendar_id_seq', 2);
SELECT setval('guest_reg_trip_id_seq', 3);
SELECT setval('guest_reg_registration_id_seq', 2);
SELECT setval('guest_reg_guest_id_seq', 3);
SELECT setval('guest_reg_invoice_id_seq', 2);
SELECT setval('guest_reg_invoice_item_id_seq', 4);
SELECT setval('guest_reg_housekeeping_id_seq', 2);
SELECT setval('guest_reg_housekeeping_photo_id_seq', 1);
```

- [ ] **Step 2: Build the uploads tarball fixture**

```bash
mkdir -p tests/fixtures/uploads-work
# 3 tiny JPEGs — any bytes are fine; importer only reads the tar entries by name.
printf 'fake-jpeg-alice' > tests/fixtures/uploads-work/registration_1_alice.jpg
printf 'fake-jpeg-bob'   > tests/fixtures/uploads-work/registration_2_bob.jpg
printf 'fake-jpeg-clean' > tests/fixtures/uploads-work/housekeeping_1_clean.jpg
tar -cf tests/fixtures/legacy-uploads.tar -C tests/fixtures/uploads-work .
rm -rf tests/fixtures/uploads-work
ls -la tests/fixtures/legacy-uploads.tar
```

Expected: ~10 KB tarball.

- [ ] **Step 3: Write the CLI skeleton (`scripts/import-legacy.ts`)**

```ts
#!/usr/bin/env tsx
import { parseArgs } from 'node:util';
import { run } from '@/modules/legacy-import';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      dump:    { type: 'string' },
      uploads: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  if (!values.dump || !values.uploads) {
    console.error('Usage: tsx scripts/import-legacy.ts --dump <file.sql> --uploads <file.tar> [--dry-run]');
    process.exit(2);
  }
  const result = await run({
    dumpPath: values.dump,
    uploadsPath: values.uploads,
    dryRun: Boolean(values['dry-run']),
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.discrepancies.length > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 4: Orchestrator stub (`src/modules/legacy-import/index.ts`)**

```ts
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

export async function run(opts: ImportOptions): Promise<ImportResult> {
  void opts;
  throw new Error('not implemented — fleshed out in later tasks');
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add prisma/seed-legacy-mini.sql tests/fixtures/legacy-uploads.tar \
        scripts/import-legacy.ts src/modules/legacy-import/index.ts
git commit -m "feat(legacy-import): fixture + CLI skeleton"
```

---

## Task 2: Stage loader + transform helpers

**Files:**
- Create: `src/modules/legacy-import/stage.ts`
- Create: `src/modules/legacy-import/transform.ts`
- Modify: `src/modules/legacy-import/index.ts`

- [ ] **Step 1: `stage.ts` — load dump into staging schema**

```ts
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

export async function loadDumpIntoStaging(
  client: Client,
  dumpPath: string,
  stagingSchema: string,
): Promise<void> {
  const sql = readFileSync(dumpPath, 'utf8');
  await client.query(`DROP SCHEMA IF EXISTS "${stagingSchema}" CASCADE`);
  await client.query(`CREATE SCHEMA "${stagingSchema}"`);
  await client.query(`SET search_path TO "${stagingSchema}"`);
  await client.query(sql);
  await client.query('RESET search_path');
}

export async function dropStaging(client: Client, stagingSchema: string): Promise<void> {
  await client.query(`DROP SCHEMA IF EXISTS "${stagingSchema}" CASCADE`);
}
```

Also add `pg` to dependencies:

```bash
npm install pg @types/pg
```

- [ ] **Step 2: `transform.ts` — pure row mappers**

Each mapper takes one legacy row (camelCase-normalised from Postgres) and returns a Prisma `*.create` input object, or `null` to skip. No I/O.

```ts
import type { Prisma, UserRole, TripSource, RegistrationStatus,
              AgeCategory, DocumentType, InvoiceStatus, HousekeepingStatus }
  from '@prisma/client';

type LegacyUser = { id: number; username: string; password_hash: string;
  email: string | null; role: string; is_deleted: boolean; created_at: Date };

export function mapUser(row: LegacyUser): Prisma.UserCreateInput {
  const role: UserRole = row.role === 'superadmin'
    ? 'ADMIN'
    : (row.role.toUpperCase() as UserRole);
  return {
    username: row.username,
    email: row.email ?? `${row.username}@imported.local`,
    passwordHash: row.password_hash, // legacy pbkdf2 — users must reset on first login
    role,
    deletedAt: row.is_deleted ? row.created_at : null,
    createdAt: row.created_at,
  };
}

type LegacyAmenity = { id: number; name: string; address: string | null;
  admin_id: number | null; is_deleted: boolean; created_at: Date };

export function mapProperty(
  row: LegacyAmenity,
  adminId: number,
): Prisma.PropertyCreateInput {
  return {
    name: row.name,
    address: row.address ?? '',
    admin: { connect: { id: adminId } },
    deletedAt: row.is_deleted ? row.created_at : null,
    createdAt: row.created_at,
  };
}

type LegacyCalendar = { id: number; amenity_id: number; ics_url: string;
  sync_interval: number | null; last_synced_at: Date | null; is_deleted: boolean;
  created_at: Date };

export function mapCalendar(
  row: LegacyCalendar,
  propertyId: number,
): Prisma.CalendarCreateInput {
  return {
    property: { connect: { id: propertyId } },
    icsUrl: row.ics_url,
    syncIntervalMin: row.sync_interval ?? 60,
    lastSyncedAt: row.last_synced_at,
    deletedAt: row.is_deleted ? row.created_at : null,
    createdAt: row.created_at,
  };
}

type LegacyTrip = { id: number; title: string; amenity_id: number; admin_id: number;
  start_date: Date; end_date: Date; confirm_code: string | null; source: string;
  external_reservation_id: string | null; external_confirm_code: string | null;
  external_guest_name: string | null; is_deleted: boolean; created_at: Date };

export function mapTrip(
  row: LegacyTrip,
  propertyId: number,
  adminId: number,
): Prisma.TripCreateInput {
  const source: TripSource = row.source.toUpperCase() === 'AIRBNB' ? 'AIRBNB' : 'MANUAL';
  return {
    title: row.title,
    property: { connect: { id: propertyId } },
    admin: { connect: { id: adminId } },
    startDate: row.start_date,
    endDate: row.end_date,
    confirmCode: row.confirm_code ?? cryptoCode(),
    source,
    externalReservationId: row.external_reservation_id,
    externalConfirmCode: row.external_confirm_code,
    externalGuestName: row.external_guest_name,
    deletedAt: row.is_deleted ? row.created_at : null,
    createdAt: row.created_at,
  };
}

function cryptoCode(): string {
  return 'IMP' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

type LegacyReg = { id: number; trip_id: number; status: string;
  submitted_at: Date; gdpr_consent: boolean };

export function mapRegistration(
  row: LegacyReg,
  tripId: number,
): Prisma.RegistrationCreateInput {
  const status: RegistrationStatus = row.status.toUpperCase() as RegistrationStatus;
  return {
    trip: { connect: { id: tripId } },
    status,
    submittedAt: row.submitted_at,
    gdprConsent: row.gdpr_consent,
  };
}

type LegacyGuest = { id: number; registration_id: number; first_name: string;
  last_name: string; date_of_birth: Date | null; age_category: string;
  document_type: string | null; document_number: string | null;
  document_image: string | null; nationality: string | null };

export function mapGuest(
  row: LegacyGuest,
  registrationId: number,
): Prisma.GuestCreateInput {
  const age: AgeCategory = row.age_category.toUpperCase() as AgeCategory;
  const doc: DocumentType | null = row.document_type
    ? (row.document_type.toUpperCase() as DocumentType)
    : null;
  return {
    registration: { connect: { id: registrationId } },
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    ageCategory: age,
    documentType: doc,
    documentNumber: row.document_number,
    nationality: row.nationality,
    // documentImageKey is filled after upload (task 4)
  };
}

type LegacyInvoice = { id: number; admin_id: number; invoice_number: string;
  client_name: string; client_address: string | null; client_ico: string | null;
  client_dic: string | null; client_icdph: string | null; currency: string;
  issued_at: Date; due_date: Date | null; delivered_at: Date | null; status: string;
  notes: string | null; total_amount: string; created_at: Date };

export function mapInvoice(
  row: LegacyInvoice,
  adminId: number,
): Prisma.InvoiceCreateInput {
  const status: InvoiceStatus = row.status.toUpperCase() as InvoiceStatus;
  return {
    admin: { connect: { id: adminId } },
    invoiceNumber: row.invoice_number,
    clientName: row.client_name,
    clientAddress: row.client_address ?? '',
    clientIco: row.client_ico,
    clientDic: row.client_dic,
    clientIcDph: row.client_icdph,
    currency: row.currency,
    issuedAt: row.issued_at,
    dueDate: row.due_date,
    deliveredAt: row.delivered_at,
    status,
    notes: row.notes,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
  };
}

type LegacyItem = { id: number; invoice_id: number; description: string;
  quantity: string; unit_price: string; vat_rate: string; total_with_vat: string;
  position: number };

export function mapInvoiceItem(
  row: LegacyItem,
  invoiceId: number,
): Prisma.InvoiceItemCreateInput {
  return {
    invoice: { connect: { id: invoiceId } },
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    vatRate: row.vat_rate,
    totalWithVat: row.total_with_vat,
    position: row.position,
  };
}

type LegacyHK = { id: number; trip_id: number; amenity_id: number;
  housekeeper_id: number | null; service_date: Date; status: string;
  pay_amount: string | null; paid: boolean; started_at: Date | null;
  completed_at: Date | null; notes: string | null };

export function mapHousekeeping(
  row: LegacyHK,
  tripId: number,
  propertyId: number,
  housekeeperId: number | null,
): Prisma.HousekeepingTaskCreateInput {
  const status: HousekeepingStatus = row.status.toUpperCase() as HousekeepingStatus;
  return {
    trip: { connect: { id: tripId } },
    property: { connect: { id: propertyId } },
    housekeeper: housekeeperId ? { connect: { id: housekeeperId } } : undefined,
    serviceDate: row.service_date,
    status,
    payAmount: row.pay_amount,
    paid: row.paid,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    notes: row.notes,
  };
}
```

- [ ] **Step 3: Typecheck (will fail on `Prisma.*` type names that drift from current schema)**

```bash
npm run typecheck 2>&1 | tail -20
```

If any mapper fails typecheck because a Prisma field was renamed during M2–M6, fix the mapper to match the actual Prisma type — the actual schema is authoritative.

- [ ] **Step 4: Commit**

```bash
git add src/modules/legacy-import/stage.ts src/modules/legacy-import/transform.ts package.json package-lock.json
git commit -m "feat(legacy-import): stage loader + pure row mappers"
```

---

## Task 3: Upload helper + orchestrator

**Files:**
- Create: `src/modules/legacy-import/upload.ts`
- Modify: `src/modules/legacy-import/index.ts`

- [ ] **Step 1: `upload.ts` — tarball → MinIO**

```ts
import { createReadStream } from 'node:fs';
import { extract } from 'tar';
import { putObject } from '@/modules/storage/service';

// Returns a map of legacy file_path → storage key (the S3 object key).
export async function uploadFromTarball(
  tarPath: string,
  keyFor: (legacyFilename: string) => string | null,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  await new Promise<void>((resolve, reject) => {
    const parser = extract({ cwd: '/tmp' });
    parser.on('entry', async (entry) => {
      const legacyName = entry.path.replace(/^\.\//, '');
      const key = keyFor(legacyName);
      if (!key) { entry.resume(); return; }

      const chunks: Buffer[] = [];
      entry.on('data', (c: Buffer) => chunks.push(c));
      entry.on('end', async () => {
        const buf = Buffer.concat(chunks);
        await putObject(key, buf, 'image/jpeg');
        result.set(legacyName, key);
      });
      entry.on('error', reject);
    });
    parser.on('end', resolve);
    parser.on('error', reject);
    createReadStream(tarPath).pipe(parser);
  });

  return result;
}
```

Install `tar`:

```bash
npm install tar @types/tar
```

- [ ] **Step 2: Flesh out `src/modules/legacy-import/index.ts`**

```ts
import { Client } from 'pg';
import { prisma } from '@/lib/db/client';
import { env } from '@/lib/env';
import { loadDumpIntoStaging, dropStaging } from './stage';
import {
  mapUser, mapProperty, mapCalendar, mapTrip,
  mapRegistration, mapGuest, mapInvoice, mapInvoiceItem, mapHousekeeping,
} from './transform';
import { uploadFromTarball } from './upload';
import { verify } from './verify';

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

    const q = async <T>(sql: string): Promise<T[]> =>
      (await pg.query(`SET search_path TO "${STAGING}"; ${sql}`)).rows as T[];

    // 1. Users
    const legacyUsers = await q<any>('SELECT * FROM guest_reg_user ORDER BY id');
    const userIdMap = new Map<number, number>();
    for (const row of legacyUsers) {
      const created = await prisma.user.create({ data: mapUser(row) });
      userIdMap.set(row.id, created.id);
    }

    // 2. Properties (amenity → property)
    const legacyAmenities = await q<any>('SELECT * FROM guest_reg_amenity ORDER BY id');
    const propertyIdMap = new Map<number, number>();
    for (const row of legacyAmenities) {
      const adminId = userIdMap.get(row.admin_id)!;
      const created = await prisma.property.create({ data: mapProperty(row, adminId) });
      propertyIdMap.set(row.id, created.id);
    }

    // 3. Calendars
    const legacyCals = await q<any>('SELECT * FROM guest_reg_calendar ORDER BY id');
    for (const row of legacyCals) {
      const pid = propertyIdMap.get(row.amenity_id)!;
      await prisma.calendar.create({ data: mapCalendar(row, pid) });
    }

    // 4. Trips
    const legacyTrips = await q<any>('SELECT * FROM guest_reg_trip ORDER BY id');
    const tripIdMap = new Map<number, number>();
    for (const row of legacyTrips) {
      const pid = propertyIdMap.get(row.amenity_id)!;
      const aid = userIdMap.get(row.admin_id)!;
      const created = await prisma.trip.create({ data: mapTrip(row, pid, aid) });
      tripIdMap.set(row.id, created.id);
    }

    // 5. Registrations + Guests (+ file uploads)
    const legacyRegs = await q<any>('SELECT * FROM guest_reg_registration ORDER BY id');
    const regIdMap = new Map<number, number>();
    for (const row of legacyRegs) {
      const tid = tripIdMap.get(row.trip_id)!;
      const created = await prisma.registration.create({ data: mapRegistration(row, tid) });
      regIdMap.set(row.id, created.id);
    }

    const legacyGuests = await q<any>('SELECT * FROM guest_reg_guest ORDER BY id');
    const guestIdMap = new Map<number, number>();
    const guestKeyNeeds = new Map<string, { guestId: number; propertyId: number }>();
    for (const row of legacyGuests) {
      const rid = regIdMap.get(row.registration_id)!;
      const created = await prisma.guest.create({ data: mapGuest(row, rid) });
      guestIdMap.set(row.id, created.id);
      if (row.document_image) {
        const reg = legacyRegs.find((r) => r.id === row.registration_id)!;
        const trip = legacyTrips.find((t) => t.id === reg.trip_id)!;
        const pid = propertyIdMap.get(trip.amenity_id)!;
        guestKeyNeeds.set(row.document_image, { guestId: created.id, propertyId: pid });
      }
    }

    // 6. Invoices + Items
    const legacyInvoices = await q<any>('SELECT * FROM guest_reg_invoice ORDER BY id');
    const invoiceIdMap = new Map<number, number>();
    for (const row of legacyInvoices) {
      const aid = userIdMap.get(row.admin_id)!;
      const created = await prisma.invoice.create({ data: mapInvoice(row, aid) });
      invoiceIdMap.set(row.id, created.id);
    }
    const legacyItems = await q<any>('SELECT * FROM guest_reg_invoice_item ORDER BY id');
    for (const row of legacyItems) {
      const invId = invoiceIdMap.get(row.invoice_id)!;
      await prisma.invoiceItem.create({ data: mapInvoiceItem(row, invId) });
    }

    // 7. Housekeeping (+ photos)
    const legacyHK = await q<any>('SELECT * FROM guest_reg_housekeeping ORDER BY id');
    const hkIdMap = new Map<number, number>();
    const hkPhotoNeeds = new Map<string, { taskId: number; propertyId: number }>();
    for (const row of legacyHK) {
      const tid = tripIdMap.get(row.trip_id)!;
      const pid = propertyIdMap.get(row.amenity_id)!;
      const hkId = row.housekeeper_id ? userIdMap.get(row.housekeeper_id) ?? null : null;
      const created = await prisma.housekeepingTask.create({
        data: mapHousekeeping(row, tid, pid, hkId),
      });
      hkIdMap.set(row.id, created.id);
    }
    const legacyPhotos = await q<any>('SELECT * FROM guest_reg_housekeeping_photo ORDER BY id');
    for (const row of legacyPhotos) {
      const taskId = hkIdMap.get(row.housekeeping_id)!;
      const hk = legacyHK.find((h) => h.id === row.housekeeping_id)!;
      const pid = propertyIdMap.get(hk.amenity_id)!;
      hkPhotoNeeds.set(row.file_path, { taskId, propertyId: pid });
    }

    // 8. Upload files
    const legacyFilenameToKey = new Map<string, string>();
    if (!opts.dryRun) {
      const result = await uploadFromTarball(opts.uploadsPath, (filename) => {
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
      for (const [legacy, key] of result) legacyFilenameToKey.set(legacy, key);

      // Backfill keys on Prisma rows
      for (const [filename, { guestId }] of guestKeyNeeds) {
        const key = legacyFilenameToKey.get(filename);
        if (key) await prisma.guest.update({ where: { id: guestId }, data: { documentImageKey: key } });
      }
      for (const [filename, { taskId }] of hkPhotoNeeds) {
        const key = legacyFilenameToKey.get(filename);
        if (key) {
          await prisma.housekeepingPhoto.create({
            data: { task: { connect: { id: taskId } }, storageKey: key },
          });
        }
      }
    }

    // 9. Verify
    const discrepancies = await verify();

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
        housekeepingTasks: legacyHK.length,
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
```

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck 2>&1 | tail -20
git add package.json package-lock.json src/modules/legacy-import/
git commit -m "feat(legacy-import): orchestrator + tarball → MinIO uploader"
```

(`verify.ts` is added in Task 4 — the import statement is forward-referenced; typecheck will complain until Task 4 ships.)

---

## Task 4: Verifier + golden-file contract test

**Files:**
- Create: `src/modules/legacy-import/verify.ts`
- Create: `tests/integration/legacy-import.test.ts`

- [ ] **Step 1: `verify.ts`**

```ts
import { prisma } from '@/lib/db/client';

export async function verify(): Promise<string[]> {
  const issues: string[] = [];

  const invoices = await prisma.invoice.findMany({
    include: { items: true },
  });
  for (const inv of invoices) {
    const sum = inv.items.reduce((acc, it) => acc + Number(it.totalWithVat), 0);
    const total = Number(inv.totalAmount);
    if (Math.abs(sum - total) > 0.01) {
      issues.push(`Invoice ${inv.invoiceNumber}: items sum ${sum.toFixed(2)} != total ${total.toFixed(2)}`);
    }
  }

  // FK sweep (anything imported must have its referenced parent present)
  const orphans = await prisma.$queryRaw<Array<{ table: string; count: bigint }>>`
    SELECT 'Guest' AS table, COUNT(*) AS count FROM "Guest" g
      WHERE NOT EXISTS (SELECT 1 FROM "Registration" r WHERE r.id = g."registrationId")
    UNION ALL
    SELECT 'InvoiceItem', COUNT(*) FROM "InvoiceItem" ii
      WHERE NOT EXISTS (SELECT 1 FROM "Invoice" i WHERE i.id = ii."invoiceId")
    UNION ALL
    SELECT 'HousekeepingPhoto', COUNT(*) FROM "HousekeepingPhoto" hp
      WHERE NOT EXISTS (SELECT 1 FROM "HousekeepingTask" h WHERE h.id = hp."taskId")
  `;
  for (const row of orphans) {
    if (row.count > 0n) issues.push(`${row.table}: ${row.count} orphans`);
  }

  return issues;
}
```

- [ ] **Step 2: Contract test — `tests/integration/legacy-import.test.ts`**

Full integration test: Testcontainers Postgres + MinIO (same harness used elsewhere) + Prisma migrate deploy + run importer on mini dump → assert DB state.

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { run } from '@/modules/legacy-import';

let pg: StartedPostgreSqlContainer;
let minio: StartedTestContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  pg = await new PostgreSqlContainer('postgres:16-alpine').start();
  minio = await new GenericContainer('minio/minio:latest')
    .withCommand(['server', '/data'])
    .withExposedPorts(9000)
    .withEnvironment({ MINIO_ROOT_USER: 'minio', MINIO_ROOT_PASSWORD: 'minio123' })
    .start();
  process.env.DATABASE_URL = pg.getConnectionUri();
  process.env.MINIO_ENDPOINT = `http://${minio.getHost()}:${minio.getMappedPort(9000)}`;
  process.env.MINIO_ACCESS_KEY = 'minio';
  process.env.MINIO_SECRET_KEY = 'minio123';
  process.env.MINIO_BUCKET = 'guest-registration';
  execSync(`DATABASE_URL="${pg.getConnectionUri()}" npx prisma migrate deploy`, { stdio: 'inherit' });
  prisma = new PrismaClient();
  // Ensure bucket exists
  const { ensureBucket } = await import('@/modules/storage/service');
  await ensureBucket();
}, 120_000);

afterAll(async () => {
  await prisma.$disconnect();
  await pg.stop();
  await minio.stop();
});

describe('legacy-import', () => {
  it('imports the mini dump + uploads tarball with zero discrepancies', async () => {
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
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    expect(users[0]!.username).toBe('admin');
    expect(users[0]!.role).toBe('ADMIN');

    const alice = await prisma.guest.findFirst({ where: { firstName: 'Alice' } });
    expect(alice!.documentImageKey).toMatch(/properties\/\d+\/guests\/\d+\/registration_1_alice\.jpg$/);

    const inv1 = await prisma.invoice.findFirst({ where: { invoiceNumber: '2026-0001' }, include: { items: true } });
    expect(inv1!.items).toHaveLength(2);
    expect(Number(inv1!.totalAmount)).toBe(120);

    const archived = await prisma.property.findFirst({ where: { name: 'Villa B (archived)' } });
    expect(archived!.deletedAt).not.toBeNull();
  }, 120_000);
});
```

- [ ] **Step 3: Run**

```bash
npm test -- tests/integration/legacy-import.test.ts 2>&1 | tail -30
```

Expected: 1 passing test, zero discrepancies.

If the test surfaces mapper bugs, fix `transform.ts` — it's the authoritative row-mapping contract.

- [ ] **Step 4: Run the full suite to make sure nothing regressed**

```bash
npm test 2>&1 | tail -5
```

Expected: 139/139 tests pass (138 + 1 new).

- [ ] **Step 5: Commit**

```bash
git add src/modules/legacy-import/verify.ts tests/integration/legacy-import.test.ts
git commit -m "feat(legacy-import): verifier + golden-file contract test"
```

---

## Task 5: Dockerfile + .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore` (append if exists)

- [ ] **Step 1: Write `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---- builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma      ./prisma
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma client needs a DATABASE_URL at generate time if the schema is read there;
# our client generation does not require an actual connection.
RUN npx prisma generate
RUN npm run build

# ---- runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 1001 --create-home --home-dir /app nextjs
USER nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone output carries its own node_modules subset.
COPY --from=builder --chown=nextjs:nextjs /app/public                 ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone       ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static           ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/prisma                 ./prisma
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/.prisma   ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/@prisma   ./node_modules/@prisma

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
```

- [ ] **Step 2: Update `.dockerignore`**

Read current `.dockerignore`, then ensure it contains:

```
node_modules
.next
dist
.git
.github
.idea
.vscode
.DS_Store
coverage
e2e
test-results
playwright-report
tests
docs
*.log
.env*
!/.env.example
```

- [ ] **Step 3: Local build smoke**

```bash
docker buildx build --target runner -t guest-registration:local-smoke .
docker images guest-registration:local-smoke
# Expect an image ~350 MB.
```

If buildx is unavailable, fall back to `docker build` — the output is what matters.

- [ ] **Step 4: Run the image briefly against a throwaway DB** (optional smoke — skip if Docker daemon is not running)

```bash
docker run --rm -d --name grv2-smoke -e DATABASE_URL=postgres://noone@127.0.0.1:1/none \
  -e SESSION_COOKIE_NAME=guest_reg_session -e SESSION_COOKIE_SECURE=false \
  -e MINIO_ENDPOINT=http://127.0.0.1:9000 -e MINIO_ACCESS_KEY=x -e MINIO_SECRET_KEY=x -e MINIO_BUCKET=x \
  -e SMTP_HOST=localhost -e SMTP_PORT=25 -e SMTP_FROM=noreply@example.com \
  -e CRON_SECRET=dev-secret-12345 -e DISABLE_SCHEDULER=1 \
  -p 3100:3000 guest-registration:local-smoke || true
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/api/health/liveness || true
docker rm -f grv2-smoke || true
```

Expected: container starts (liveness 200 even if DB unreachable).

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat(deploy): multi-stage Dockerfile + .dockerignore"
```

---

## Task 6: docker-compose + env template

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: `docker-compose.yml`**

```yaml
# NAS deployment: /volume1/homes/mjanci/guest-registration-v2/docker-compose.yml
# Assumes nginx-proxy + a shared MinIO container already exist on the host.

services:
  db:
    image: postgres:16-alpine
    container_name: guest_registration_v2_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data_v2:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  migrate:
    image: ${APP_IMAGE}
    container_name: guest_registration_v2_migrate
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: ${DATABASE_URL}
    entrypoint: ["npx", "prisma", "migrate", "deploy"]
    restart: "no"

  app:
    image: ${APP_IMAGE}
    container_name: guest_registration_v2_app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SESSION_COOKIE_NAME: ${SESSION_COOKIE_NAME}
      SESSION_COOKIE_SECURE: ${SESSION_COOKIE_SECURE}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET: ${MINIO_BUCKET}
      SERVER_URL: ${SERVER_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      SMTP_FROM: ${SMTP_FROM}
      LOG_LEVEL: ${LOG_LEVEL}
      CRON_SECRET: ${CRON_SECRET}
      # nginx-proxy (virtual host routing)
      VIRTUAL_HOST: airbnb.rlt.sk
      VIRTUAL_PORT: "3000"
      LETSENCRYPT_HOST: airbnb.rlt.sk
    expose:
      - "3000"
    networks:
      - default
      - nginx-proxy

volumes:
  postgres_data_v2:

networks:
  nginx-proxy:
    external: true
```

- [ ] **Step 2: `.env.example`**

```env
# Image
APP_IMAGE=registry.rlt.sk/guest-registration-v2:latest

# Postgres
POSTGRES_USER=grv2
POSTGRES_PASSWORD=changeme
POSTGRES_DB=guest_registration_v2
DATABASE_URL=postgresql://grv2:changeme@db:5432/guest_registration_v2

# Session
SESSION_COOKIE_NAME=guest_reg_session
SESSION_COOKIE_SECURE=true

# MinIO (shared host container)
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=change-me
MINIO_SECRET_KEY=change-me
MINIO_BUCKET=guest-registration

# Server URL (for confirm-code links in outgoing emails)
SERVER_URL=https://airbnb.rlt.sk

# SMTP
SMTP_HOST=mailproxy.nameserver.sk
SMTP_PORT=587
SMTP_USER=m.janci@32bit.sk
SMTP_PASSWORD=change-me
SMTP_FROM=noreply@airbnb.rlt.sk

# Logging
LOG_LEVEL=info

# Cron trigger shared secret
CRON_SECRET=generate-a-long-random-string-here
```

- [ ] **Step 3: Typecheck-equivalent for compose (lint only, no daemon call)**

```bash
docker compose -f docker-compose.yml config > /dev/null
```

Expected: no output = valid.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat(deploy): docker-compose + .env.example for NAS"
```

---

## Task 7: Playwright setup + guest self-registration E2E

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/fixtures/seed.ts`
- Create: `e2e/guest-self-registration.spec.ts`
- Modify: `package.json` (scripts + devDeps)

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: `e2e/playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'PORT=4200 NODE_ENV=development DISABLE_SCHEDULER=1 npm run dev',
        url: 'http://localhost:4200/login',
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
```

- [ ] **Step 3: `e2e/fixtures/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';
import argon2 from '@node-rs/argon2';

export async function seedFlow(): Promise<{ confirmCode: string }> {
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction([
      prisma.guest.deleteMany(),
      prisma.registration.deleteMany(),
      prisma.trip.deleteMany(),
      prisma.calendar.deleteMany(),
      prisma.property.deleteMany(),
      prisma.session.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: await argon2.hash('admin-pass-1234'),
        role: 'ADMIN',
      },
    });
    const property = await prisma.property.create({
      data: { name: 'E2E Villa', address: 'Street 1', admin: { connect: { id: admin.id } } },
    });
    const trip = await prisma.trip.create({
      data: {
        title: 'E2E stay',
        property: { connect: { id: property.id } },
        admin: { connect: { id: admin.id } },
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        confirmCode: 'E2ECODE',
        source: 'MANUAL',
      },
    });
    return { confirmCode: trip.confirmCode };
  } finally {
    await prisma.$disconnect();
  }
}
```

- [ ] **Step 4: `e2e/guest-self-registration.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { seedFlow } from './fixtures/seed';

test('guest self-registration happy path', async ({ page }) => {
  const { confirmCode } = await seedFlow();

  await page.goto(`/register/${confirmCode}`);
  await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();

  await page.getByLabel(/first name/i).first().fill('Alice');
  await page.getByLabel(/last name/i).first().fill('Doe');
  await page.getByLabel(/date of birth/i).first().fill('1990-01-01');
  await page.getByLabel(/nationality/i).first().fill('SK');
  // Document fields vary by age category; skip optional doc upload — covered by unit tests.

  await page.getByLabel(/gdpr/i).check();
  await page.getByRole('button', { name: /submit/i }).click();

  await expect(page).toHaveURL(/\/register\/E2ECODE\/success/);
});
```

- [ ] **Step 5: Add npm scripts**

```json
"scripts": {
  ...
  "e2e": "playwright test --config e2e/playwright.config.ts",
  "e2e:ui": "playwright test --config e2e/playwright.config.ts --ui"
}
```

- [ ] **Step 6: Run**

```bash
npm run e2e 2>&1 | tail -20
```

Expected: 1 passing test.

If selectors miss (labels differ from the spec), update the spec to match the actual form labels in `src/app/register/[code]/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add e2e/ package.json package-lock.json
git commit -m "test(e2e): playwright + guest self-registration happy path"
```

---

## Task 8: Admin invoice + housekeeper task E2Es

**Files:**
- Create: `e2e/admin-invoice.spec.ts`
- Create: `e2e/housekeeper-task.spec.ts`
- Modify: `e2e/fixtures/seed.ts`

- [ ] **Step 1: Extend `seed.ts` with helpers**

Add `seedAdmin()` and `seedHousekeeper()` alongside `seedFlow()` — each returns the credentials + the IDs a spec needs.

```ts
export async function seedAdmin(): Promise<{ username: string; password: string; tripId: number }> {
  // (create admin + property + trip as in seedFlow, but return the trip id)
  // Also leave DB empty first so specs don't collide.
}

export async function seedHousekeeper(): Promise<{ username: string; password: string; taskId: number }> {
  // (create admin + property + trip + housekeeper user + PropertyHousekeeper + HousekeepingTask (PENDING))
}
```

(Use the same wipe-then-seed pattern as `seedFlow`. Full code mirrors the M2/M6 integration-test seed helpers — read those files for exact field names.)

- [ ] **Step 2: `admin-invoice.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { seedAdmin } from './fixtures/seed';

test('admin creates and sends an invoice', async ({ page }) => {
  const { username, password } = await seedAdmin();

  await page.goto('/login');
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  await page.getByRole('link', { name: /invoices/i }).first().click();
  await page.getByRole('link', { name: /new invoice/i }).click();
  await page.getByLabel(/client name/i).fill('Test client');
  await page.getByLabel(/client address/i).fill('Street 1, BA');
  await page.getByRole('button', { name: /add item/i }).click();
  await page.getByLabel(/description/i).fill('Stay');
  await page.getByLabel(/quantity/i).fill('2');
  await page.getByLabel(/unit price/i).fill('50');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.getByText(/100\.00/)).toBeVisible();
  const pdfLink = page.getByRole('link', { name: /pdf/i });
  await expect(pdfLink).toBeVisible();
});
```

- [ ] **Step 3: `housekeeper-task.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { seedHousekeeper } from './fixtures/seed';

test('housekeeper completes a task', async ({ page }) => {
  const { username, password, taskId } = await seedHousekeeper();

  await page.goto('/login');
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/housekeeper\/dashboard/);

  await page.goto(`/housekeeper/tasks/${taskId}`);
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByRole('button', { name: /complete/i }).click();
  await expect(page.getByText(/completed/i)).toBeVisible();
});
```

- [ ] **Step 4: Run**

```bash
npm run e2e 2>&1 | tail -20
```

Expected: 3 passing tests.

If specific selectors don't match the actual UI (the selectors above use /i regex to be robust), inspect the component files and adjust selectors accordingly.

- [ ] **Step 5: Commit**

```bash
git add e2e/
git commit -m "test(e2e): admin invoice + housekeeper task happy paths"
```

---

## Task 9: Cutover runbook

**Files:**
- Create: `docs/superpowers/runbooks/cutover.md`

- [ ] **Step 1: Write the runbook**

```markdown
# Cutover runbook: Flask v1.9.4 → v2

**Target window:** ~1 hour, low-traffic evening (20:00–21:00 CET).
**Actors:** one operator with SSH access to the NAS and docker registry push access.
**Rollback window:** 24 hours — legacy stack stays up on `airbnb-legacy.rlt.sk` and can be flipped back in <5 min.

## T-24h — Rehearsal

1. SSH to NAS, dump the live DB:
   ```
   docker exec guest_registration_db \
     pg_dump -U postgres guest_registration \
     > /volume1/homes/mjanci/backups/guest_registration_$(date -I).sql
   tar -C /volume1/docker/guest_registration_app/static/uploads \
       -cf /volume1/homes/mjanci/backups/uploads_$(date -I).tar .
   ```
2. Copy both files to a staging host with Docker + Node 22.
3. Stand up v2 stack against a test domain (`airbnb-v2-staging.rlt.sk`):
   ```
   cp .env.example .env   # fill in secrets, staging DB
   export APP_IMAGE=registry.rlt.sk/guest-registration-v2:latest
   docker compose pull
   docker compose up -d db migrate
   # wait for migrate to exit 0
   tsx scripts/import-legacy.ts --dump backups/guest_registration_<date>.sql \
       --uploads backups/uploads_<date>.tar
   # Expect: {"discrepancies":[],"counts":{...},"uploaded":N}
   docker compose up -d app
   ```
4. Run `npm run e2e -- --config e2e/playwright.config.ts` with `E2E_BASE_URL=https://airbnb-v2-staging.rlt.sk`.
5. Manually smoke test: login, open each tab, download one invoice PDF.

## T-0 — Cutover

1. Announce maintenance (optional) — post to operations channel.
2. Toggle maintenance page in nginx-proxy for `airbnb.rlt.sk` (returns 503 with a notice).
3. On the NAS, take the final dump + uploads tar (same commands as rehearsal).
4. SCP both to the app host. Run the importer against the production v2 DB.
   Expected duration: <2 min for current data volume.
5. Verify: `{"discrepancies":[]}`. If non-empty — **abort**, see rollback.
6. `docker compose up -d app`. Wait for `/api/health/readiness` to return 200.
7. Flip nginx-proxy:
   ```
   # in /volume1/docker/nginx-proxy/nginx.conf or the docker-gen template:
   # - remove or comment the airbnb.rlt.sk → guest_registration_app upstream
   # - the new container's VIRTUAL_HOST=airbnb.rlt.sk picks up automatically
   docker exec nginx-proxy nginx -s reload
   ```
8. Re-point the legacy stack to `airbnb-legacy.rlt.sk`:
   ```
   docker exec guest_registration_app env | grep VIRTUAL_HOST
   docker exec guest_registration_app \
     sh -c 'export VIRTUAL_HOST=airbnb-legacy.rlt.sk'
   # Or: edit /volume1/homes/mjanci/airbnb/docker-compose.yml,
   # VIRTUAL_HOST=airbnb-legacy.rlt.sk, then `docker compose up -d` in that dir.
   ```
9. Smoke test live:
   ```
   curl -s https://airbnb.rlt.sk/api/health/liveness
   curl -s https://airbnb.rlt.sk/api/health/readiness
   # Log in as admin, open /admin/dashboard — all tabs load.
   ```

## Rollback

1. Flip nginx-proxy upstream for `airbnb.rlt.sk` back to the legacy container.
2. `docker exec nginx-proxy nginx -s reload`.
3. The legacy DB is untouched — writes during the v2 window are lost but the mailbox has copies of every registration email (acceptable for a <1 hour window).
4. File a post-mortem.

## T+24h — Post-cutover

1. Snapshot the v2 DB + uploads (`pg_dump` + tar).
2. Archive legacy image and DB volume to cold storage.
3. Keep `airbnb-legacy.rlt.sk` up for 30 days for reference.
4. After 30 days without incident, stop legacy compose stack; retain the archive indefinitely.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `discrepancies: ["Invoice X: items sum != total"]` | VAT rounding drift in legacy | Run importer with `--dry-run`, inspect; for now, accept within 0.01; abort if >0.10 |
| `app` container restart-loops | migrate didn't finish before app started | `docker compose up -d migrate` explicitly, wait, then `up app` |
| `/api/cron/sync-airbnb` → 401 | Synology Task Scheduler secret drift | Update `X-Cron-Secret` header in the Task Scheduler task definition |
| Airbnb sync empty | ics URL changed on host property | Edit calendar in `/admin/calendars` |
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/runbooks/cutover.md
git commit -m "docs: cutover runbook (rehearsal, T-0, rollback, post-cutover)"
```

---

## Task 10: Final verification + tag v0.1

- [ ] **Step 1: Full local verification**

```bash
npm run typecheck
npm test
npm run build 2>&1 | tail -15
docker buildx build --target runner -t guest-registration:m8-final .
```

Expected:
- Typecheck clean.
- Tests: **~139** (138 + 1 legacy-import contract).
- Build: all M1–M7 routes listed.
- Docker image builds.

- [ ] **Step 2: Tag + push**

```bash
git push -u origin refs/heads/m8-import-deploy
git -c user.email="2478078+martin-janci@users.noreply.github.com" \
    -c user.name="Martin Janči" \
    tag -a m8-import-deploy -m "M8: legacy importer + Dockerfile + compose + Playwright E2E + cutover runbook"
git -c user.email="2478078+martin-janci@users.noreply.github.com" \
    -c user.name="Martin Janči" \
    tag -a v0.1 -m "v0.1 — feature-complete: ready for cutover from Flask v1.9.4"
git push origin refs/tags/m8-import-deploy
git push origin refs/tags/v0.1
```

---

## Out of scope (deferred)

- CI image publish to `registry.rlt.sk` — manual `docker push` during cutover is fine for first release.
- Automated nginx-proxy config change on cutover — documented as manual step in the runbook.
- Translation carry-over (Flask cs/sk Babel → v2) — v2 is English-first, defer to v0.2.
- Staging schema cleanup cron — importer drops its own throwaway schema on exit.
- Legacy read-only mirror auto-provisioning — documented as runbook step.

## Spec coverage

| Spec §  | Task |
|---|---|
| §8.1–8.2 (import process) | 1–3 |
| §8.3 (files → MinIO)      | 3 |
| §8.4 (verification)       | 4 |
| §9 contract test          | 4 |
| §9 Playwright happy paths | 7–8 |
| §7 Dockerfile             | 5 |
| §7 docker-compose         | 6 |
| §8 cutover                | 9 |
| §12.2 zero FK violations  | 4 (verify) |
| §12.4 rehearsal           | 9 |
| §12.5 cutover             | 9 |
