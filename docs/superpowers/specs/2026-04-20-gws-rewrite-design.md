# Guest Registration v2 — Design Spec

**Date:** 2026-04-20
**Author:** Martin Janči
**Status:** Draft → pending user review
**Replaces:** Flask `guest-registration-system` v1.9.4 at https://airbnb.rlt.sk
**Legacy architecture reference:** `../../../guest-registration-legacy-source/ARCHITECTURE.md`
**Legacy DB dump:** `/volume1/homes/mjanci/backups/guest_registration_2026-04-20.sql`

---

## 1. Goals and non-goals

### Goals
- Replace the Flask + Jinja SSR monolith with a **Node.js + React** application that is *easy to understand* (small number of well-named modules, standard Next.js patterns, no custom frameworks) and *mobile-compatible* (one responsive PWA serving both admin and housekeeper flows).
- Clean the data model (rename `amenity` → `property`, replace magic strings with enums, use object storage for uploads, drop the custom migration/version bookkeeping).
- Preserve every production feature: guest self-registration, admin CRUD for trips/properties/calendars/users/invoices/housekeeping, Airbnb ics polling, invoice PDF + email, i18n (en/cs/sk), housekeeper mobile UI with photo uploads.

### Non-goals (for v2.0)
- Native iOS/Android apps (v2 is a PWA; a React Native client can be layered later on top of the same API).
- Multi-tenant SaaS. One deployment serves Martin's properties; tenant isolation is by `adminId`, not by separate DBs.
- Push notifications (can be added after launch via Web Push if needed).
- Replacing the existing nginx-proxy / registry.rlt.sk / Synology deployment model.

---

## 2. Stack

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node 22 LTS in container | Native fetch, long-term support |
| Framework | Next.js 15 (App Router) | One codebase for UI + API, React Server Components reduce hand-written endpoints |
| Language | TypeScript strict | End-to-end types |
| Database | PostgreSQL 16 (new container, separate from legacy) | Clean slate for schema redesign |
| ORM | **Prisma** | Declarative schema, Prisma Studio for ad-hoc DB browsing, fully-typed client |
| Auth | **Lucia v3** + argon2 + session cookie | Minimal, explicit; closest to today's Flask-Login mental model |
| UI | Tailwind CSS 4 + shadcn/ui | Mobile-first, copy-pasteable components, low learning curve |
| Forms | react-hook-form + zod | Shared schemas between client and server |
| i18n | next-intl | Native App Router support; locales `en`, `cs`, `sk` |
| PDF | @react-pdf/renderer | Invoice as React components; no headless Chromium → small image |
| Email | nodemailer + @react-email/components | Same SMTP (mailproxy.nameserver.sk:587) as today |
| Object storage | MinIO (S3-compatible) at `/volume1/docker/minio/` | Document images + housekeeping photos |
| Background jobs | node-cron in-process + DB-backed `Job` table | BullMQ/Redis is overkill for this traffic; in-process is simpler to reason about |
| Testing | Vitest (unit + integration via Testcontainers) + Playwright (E2E) | Standard; no mock DB in integration tests |
| Logging | pino → stdout (JSON) → docker logs | Structured, simple |
| Deploy | Docker multi-stage + `output: 'standalone'` → `registry.rlt.sk` → docker-compose on NAS | Matches existing infra |

---

## 3. Project layout

```
guest-registration/
├── src/
│   ├── app/                                    # Next.js App Router
│   │   ├── (public)/                           # Unauthenticated routes
│   │   │   ├── page.tsx                        # Landing
│   │   │   ├── register/[code]/page.tsx        # Guest self-registration
│   │   │   ├── about/page.tsx
│   │   │   └── gdpr/page.tsx
│   │   ├── (admin)/admin/                      # Admin UI
│   │   │   ├── layout.tsx                      # Sidebar + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── trips/…
│   │   │   ├── registrations/…
│   │   │   ├── invoices/…
│   │   │   ├── calendars/…
│   │   │   ├── properties/…
│   │   │   ├── housekeeping/…
│   │   │   ├── users/…
│   │   │   └── settings/page.tsx
│   │   ├── (housekeeper)/housekeeper/          # Mobile-first PWA
│   │   │   ├── layout.tsx                      # Bottom nav, large tap targets
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tasks/[id]/page.tsx
│   │   │   └── calendar/page.tsx
│   │   ├── login/page.tsx                      # Unified login (role-based redirect)
│   │   ├── api/
│   │   │   ├── webhook/sync/route.ts
│   │   │   ├── cron/sync-airbnb/route.ts       # External trigger (Synology scheduler)
│   │   │   └── health/{liveness,readiness}/route.ts
│   │   ├── manifest.ts + icon.png              # PWA manifest
│   │   └── globals.css
│   │
│   ├── modules/                                # Domain logic
│   │   ├── auth/                               # Lucia adapter, password hash
│   │   ├── users/                              # CRUD + soft delete
│   │   ├── properties/                         # Formerly Amenity
│   │   ├── calendars/                          # ICS URLs + sync state
│   │   ├── trips/                              # Reservations (manual + Airbnb)
│   │   ├── registrations/                      # Guest self-reg forms
│   │   ├── guests/                             # Guest + document upload
│   │   ├── invoices/                           # Invoice + items
│   │   ├── housekeeping/                       # Tasks + photos + payment
│   │   ├── airbnb-sync/                        # ICS parser + cron job
│   │   ├── email/                              # React Email templates + nodemailer
│   │   ├── storage/                            # MinIO upload / signed URL
│   │   └── pdf/                                # @react-pdf invoice template
│   │
│   ├── db/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/                         # Prisma Migrate
│   │
│   ├── components/
│   │   ├── ui/                                 # shadcn primitives
│   │   ├── admin/                              # Admin composites
│   │   └── housekeeper/                        # Mobile composites
│   │
│   ├── i18n/
│   │   ├── messages/{en,cs,sk}.json
│   │   └── request.ts
│   │
│   └── lib/                                    # Date, money, validation helpers
│
├── tests/
│   ├── unit/
│   ├── integration/                            # Testcontainers (Postgres + MinIO)
│   └── e2e/                                    # Playwright
│
├── scripts/
│   └── import-legacy.ts                        # One-way data import from legacy dump
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml                      # prod: app + postgres + minio
│   └── docker-compose.dev.yml                  # dev: same stack, bind-mounted source
│
├── docs/
│   └── superpowers/specs/                      # This spec
│
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

**Principles:**

1. **Modules = former Flask blueprints, decoupled from routes.** Route files in `src/app/` call functions exported from `src/modules/<domain>/`. API handlers, cron jobs, and Server Actions all call the same functions. No business logic in route files.
2. **One module = one folder containing everything for that domain:** schemas, DB queries, helpers, tests. To understand "how invoices work," open `src/modules/invoices/`.
3. **No shared `database.py`-style monolith.** Prisma schema is a single `schema.prisma`, but query logic lives per module.
4. **Admin and housekeeper share auth/DB/modules but have separate UI layouts.** Feels like two apps to the user; is one codebase for us.

---

## 4. Data model (Prisma)

New database, new schema — no legacy table prefix, no test prefix duplicates, no hand-rolled migration bookkeeping.

```prisma
// IDENTITY
enum UserRole { SUPERADMIN ADMIN HOUSEKEEPER }

model User {
  id                    Int       @id @default(autoincrement())
  username              String    @unique
  email                 String    @unique
  passwordHash          String
  role                  UserRole  @default(ADMIN)
  createdAt             DateTime  @default(now())
  deletedAt             DateTime?

  companyName           String?
  companyIco            String?
  companyVat            String?
  contactName           String?
  contactPhone          String?
  contactAddress        String?
  contactWebsite        String?
  contactDescription    String?
  customLine1           String?
  customLine2           String?
  customLine3           String?

  photoRequiredAdults   Boolean   @default(true)
  photoRequiredChildren Boolean   @default(true)
  dateFormat            String    @default("d.M.y")
  defaultHousekeeperPay Decimal   @default(20) @db.Decimal(10, 2)

  properties            Property[]
  trips                 Trip[]              @relation("TripAdmin")
  invoices              Invoice[]
  housekeepingTasks     HousekeepingTask[]  @relation("Housekeeper")
  sessions              Session[]
}

model Session {                             // Lucia session store
  id        String   @id
  userId    Int
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// DOMAIN
model Property {                            // formerly "Amenity"
  id           Int       @id @default(autoincrement())
  name         String
  ownerId      Int
  owner        User      @relation(fields: [ownerId], references: [id])
  maxGuests    Int?
  createdAt    DateTime  @default(now())
  deletedAt    DateTime?

  calendars    Calendar[]
  housekeepers PropertyHousekeeper[]
  trips        Trip[]
}

model PropertyHousekeeper {
  propertyId    Int
  housekeeperId Int
  isDefault     Boolean   @default(false)
  payOverride   Decimal?  @db.Decimal(10, 2)
  createdAt     DateTime  @default(now())
  @@id([propertyId, housekeeperId])
}

model Calendar {
  id              Int        @id @default(autoincrement())
  propertyId      Int
  icsUrl          String
  lastSyncedAt    DateTime?
  syncIntervalMin Int        @default(60)
  createdAt       DateTime   @default(now())
  trips           Trip[]
}

enum TripSource { MANUAL AIRBNB_ICS WEBHOOK }

model Trip {
  id                    Int         @id @default(autoincrement())
  title                 String
  startDate             DateTime    @db.Date
  endDate               DateTime    @db.Date
  maxGuests             Int
  adminId               Int
  admin                 User        @relation("TripAdmin", fields: [adminId], references: [id])
  propertyId            Int
  calendarId            Int?
  source                TripSource  @default(MANUAL)
  externalReservationId String?     @unique
  externalConfirmCode   String?     @unique
  externalGuestName     String?
  externalGuestEmail    String?
  externalGuestCount    Int?
  externalSyncedAt      DateTime?
  createdAt             DateTime    @default(now())

  registrations         Registration[]
  housekeepingTasks     HousekeepingTask[]
}

enum RegistrationStatus { PENDING APPROVED REJECTED }

model Registration {
  id           Int                @id @default(autoincrement())
  tripId       Int
  email        String
  status       RegistrationStatus @default(PENDING)
  adminComment String?
  language     String             @default("en")
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  guests       Guest[]
}

enum DocumentType { PASSPORT DRIVING_LICENSE CITIZEN_ID }
enum AgeCategory  { ADULT CHILD }

model Guest {
  id               Int          @id @default(autoincrement())
  registrationId   Int
  firstName        String
  lastName         String
  ageCategory      AgeCategory
  documentType     DocumentType
  documentNumber   String
  documentImageKey String?      // MinIO object key
  gdprConsent      Boolean      @default(false)
  createdAt        DateTime     @default(now())
}

// INVOICING
enum InvoiceStatus { DRAFT SENT PAID OVERDUE }

model Invoice {
  id              Int           @id @default(autoincrement())
  invoiceNumber   String        @unique
  adminId         Int
  registrationId  Int?
  clientName      String
  clientEmail     String?
  clientVatNumber String?
  clientAddress   String?
  issueDate       DateTime      @db.Date
  dueDate         DateTime?     @db.Date
  subtotal        Decimal       @default(0) @db.Decimal(10, 2)
  vatTotal        Decimal       @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal       @default(0) @db.Decimal(10, 2)
  currency        String        @default("EUR")
  notes           String?
  status          InvoiceStatus @default(DRAFT)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  items           InvoiceItem[]
}

model InvoiceItem {
  id           Int     @id @default(autoincrement())
  invoiceId    Int
  description  String
  quantity     Decimal @default(1) @db.Decimal(10, 2)
  unitPrice    Decimal @db.Decimal(10, 2)
  vatRate      Decimal @default(0) @db.Decimal(5, 2)
  lineTotal    Decimal @default(0) @db.Decimal(10, 2)
  vatAmount    Decimal @default(0) @db.Decimal(10, 2)
  totalWithVat Decimal @default(0) @db.Decimal(10, 2)
}

// HOUSEKEEPING
enum HousekeepingStatus { PENDING IN_PROGRESS COMPLETED }

model HousekeepingTask {
  id            Int                 @id @default(autoincrement())
  tripId        Int
  housekeeperId Int
  housekeeper   User                @relation("Housekeeper", fields: [housekeeperId], references: [id])
  date          DateTime            @db.Date
  status        HousekeepingStatus  @default(PENDING)
  payAmount     Decimal             @default(0) @db.Decimal(10, 2)
  paid          Boolean             @default(false)
  paidAt        DateTime?
  notes         String?
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  photos        HousekeepingPhoto[]
}

model HousekeepingPhoto {
  id         Int      @id @default(autoincrement())
  taskId     Int
  storageKey String                   // MinIO object key
  uploadedAt DateTime @default(now())
}

// JOB QUEUE (in-process scheduler state)
enum JobStatus { PENDING RUNNING DONE FAILED }

model Job {
  id         Int       @id @default(autoincrement())
  kind       String                    // "airbnb-sync", "email", "pdf-generate"
  payload    Json
  status     JobStatus @default(PENDING)
  runAfter   DateTime  @default(now())
  attempts   Int       @default(0)
  lastError  String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

**Key deltas from legacy:**

| Legacy | v2 | Reason |
|---|---|---|
| `Amenity` | `Property` | Accurate naming |
| `is_deleted: boolean` | `deletedAt: DateTime?` | Preserves deletion timestamp |
| `VARCHAR` status columns | Prisma enums | Type safety |
| `guest_reg_` table prefix | No prefix | Fresh DB |
| `guest_reg_test_*` tables | Testcontainers in CI | Tests don't live in prod schema |
| `document_image` = disk path | `documentImageKey` = MinIO object key | Object storage |
| Custom `migration_history`, `version_manager` | Prisma Migrate | Built-in |
| `role: String` | `UserRole` enum | Type safety |

---

## 5. Key flows

### 5.1 Guest self-registration (public)
1. Guest receives link `https://airbnb.rlt.sk/register/<confirmCode>`.
2. Next.js Server Component loads the `Trip` by `externalConfirmCode`.
3. Renders React form (react-hook-form + zod schema from `modules/registrations/schema.ts`).
4. Submit → Server Action → creates `Registration` + N `Guest` rows, uploads document images to MinIO, triggers "admin notification" email job.
5. Redirect to `/register/<confirmCode>/success`.

### 5.2 Admin login and dashboard
1. `/login` → POST credentials → Lucia verifies argon2 hash → writes `Session` row + sets `auth_session` cookie.
2. Middleware on `/admin/*` checks cookie; no session → 302 to `/login`.
3. `/admin/dashboard` Server Component queries KPIs directly via Prisma.

### 5.3 Airbnb ics sync
1. External trigger (`POST /api/cron/sync-airbnb` with shared secret) OR in-process `node-cron` every N minutes.
2. `modules/airbnb-sync/run.ts`: for each `Calendar`, fetches ics, parses events, upserts `Trip` rows by `externalReservationId`, creates missing `HousekeepingTask` rows per property's default housekeeper.
3. Updates `Calendar.lastSyncedAt`.

### 5.4 Invoice PDF and email
1. `/admin/invoices/[id]/pdf` → Server Route Handler.
2. Renders `modules/pdf/InvoicePdf.tsx` via `@react-pdf/renderer` → returns `application/pdf` stream.
3. "Send" button enqueues a `Job(kind='email', payload={invoiceId})`; the job runner picks it up, regenerates PDF, attaches to email via nodemailer.

### 5.5 Housekeeper mobile flow
1. Housekeeper opens `https://airbnb.rlt.sk/housekeeper` on phone → "Add to Home Screen" (PWA).
2. Login → `/housekeeper/dashboard` lists today's tasks.
3. Tap task → detail → "Mark in progress" → "Upload photo" (captures via `<input type=file capture=environment>`, stored in IndexedDB queue, uploaded to MinIO when online) → "Mark complete".

---

## 6. External integrations

| Service | Purpose | Mechanism |
|---|---|---|
| Airbnb | Reservation import | Poll ics URLs (per-calendar) |
| SMTP (`mailproxy.nameserver.sk:587`) | Outbound mail | nodemailer STARTTLS |
| MinIO | Object storage | AWS SDK v3 S3 client |
| Synology Task Scheduler | External cron trigger (backup to in-process) | `curl -H "X-Cron-Secret: …" https://airbnb.rlt.sk/api/cron/sync-airbnb` |
| Webhook inbound | `/api/webhook/sync` | Shared secret header |

---

## 7. Deployment

```
┌─────────────────────────────────────────────────────┐
│  nginx-proxy (existing) ── TLS ── airbnb.rlt.sk     │
└─────────────────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
guest_registration_v2_app   guest_registration_v2_db
Next.js 15 standalone       postgres:16-alpine
port :3000 → :6598          volume: postgres_data_v2
              │
              ▼
       minio (shared NAS container)
       /volume1/docker/minio, bucket: guest-registration
```

- Image built multi-stage: `deps → builder → runner`, uses `next.config.ts` `output: 'standalone'`.
- Pushed to `registry.rlt.sk/guest-registration-v2:latest`.
- Deployed via `docker-compose pull && up -d` on NAS at `/volume1/homes/mjanci/guest-registration-v2/`.
- Legacy stack stays at `/volume1/homes/mjanci/airbnb/` during transition (moved behind `airbnb-legacy.rlt.sk` for reference after cutover).

---

## 8. Legacy import (one-way)

Script: `scripts/import-legacy.ts`.

Inputs:
- `guest_registration_YYYY-MM-DD.sql` (fresh dump taken right before cutover)
- `/app/static/uploads/` directory contents (tarball from container)

Process:
1. Load dump into a staging Postgres (testcontainer locally, or a throwaway schema in the new DB).
2. Using Prisma client, read from staging and write to production schema, applying transforms:
   - `amenity` → `property` (rename)
   - `status` strings → enum values
   - `is_deleted = true` → `deletedAt = <dump_timestamp>`
   - string `role` → `UserRole` enum
   - strip `guest_reg_` prefix from references
3. For each `Guest.document_image` and `HousekeepingPhoto.file_path`: read file from uploads tarball, upload to MinIO (`properties/{id}/guests/{guestId}/{filename}`), write `documentImageKey` / `storageKey`.
4. Verification step:
   - row count per table matches expected
   - foreign keys valid
   - `sum(invoice_items.totalWithVat) per invoice == invoice.totalAmount` for all invoices
5. Print summary; exit non-zero on any discrepancy.

Cutover day:
1. Stop writes to legacy Flask (toggle maintenance mode in nginx).
2. Take final pg_dump + uploads tar.
3. Run import script (expected ~1 min for current data volume).
4. Run smoke test against v2 via Playwright (login, create trip, view dashboard).
5. Flip nginx-proxy to route `airbnb.rlt.sk` → new container.
6. Keep legacy DB + image in cold storage for 30 days.

---

## 9. Testing strategy

- **Unit (Vitest)** — Pure functions per module (ics parsing, invoice totals, zod schemas).
- **Integration (Vitest + Testcontainers)** — Spin up Postgres 16 + MinIO containers per test file, exercise module functions end-to-end (no mocks).
- **E2E (Playwright)** — Happy paths only:
  1. Guest self-registration full flow
  2. Admin login → create trip → create invoice → download PDF → send email (SMTP captured by mailhog container)
  3. Housekeeper login → complete task → upload photo
- **Contract** — `import-legacy.ts` has a golden-file test: given a checked-in mini dump, produce expected DB state.

Target: ≥80% line coverage in `src/modules/`. Routes and components are covered by E2E.

---

## 10. Observability

- Structured JSON logs via pino → stdout → `docker logs`.
- `/api/health/liveness` — always 200 when process alive.
- `/api/health/readiness` — 200 when DB + MinIO reachable.
- Airbnb sync failures logged with correlation id; surfaced in `/admin/settings` → "Sync health" panel.

---

## 11. Open questions

None blocking. To be decided during implementation planning:
- Exact invoice PDF layout (migrate current WeasyPrint template pixel-for-pixel, or redesign?)
- PWA offline scope (housekeeper only, or also admin?)
- Rate limiting on `/register/*` (to prevent form spam)
- Data retention policy for guest document images (GDPR)

---

## 12. Success criteria

The rewrite is done when:
1. Every legacy blueprint has a corresponding v2 module with passing integration tests.
2. Legacy data successfully imports into v2 schema with zero foreign-key violations.
3. Playwright E2E happy paths pass.
4. A Synology cutover rehearsal (import → smoke test → rollback) completes without manual intervention.
5. `airbnb.rlt.sk` serves the v2 container, legacy is archived.
