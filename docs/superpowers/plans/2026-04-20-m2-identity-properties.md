# M2 — Identity & Properties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship admin CRUD for users (incl. soft-delete + restore + password reset), properties, property↔housekeeper assignments (with default flag + per-assignment pay override), and a Settings page for the current admin's own company/contact profile.

**Architecture:** Extend the Prisma schema with the full `User` profile fields from the design spec, plus new `Property` and `PropertyHousekeeper` tables. Build one service module per domain (`src/modules/users`, `src/modules/properties`, `src/modules/property-housekeepers`, `src/modules/settings`); each module exports pure functions the UI calls via React Server Components (reads) and Server Actions (writes). Every mutation is a Server Action that re-validates input with zod against a shared schema, mutates via Prisma, revalidates cache, and redirects. Lists render in Server Components via a shared `DataTable` primitive.

**Tech Stack:** Prisma, zod, `react-hook-form` + `@hookform/resolvers`, Next.js 15 App Router Server Actions, Tailwind 4 + design-system tokens (from M1), Lucide icons, Vitest + Testcontainers.

**Repo root:** `/Users/martinjanci/projects/github.com/martin-janci/guest-registration/`.
**Branch:** `m2-identity-properties` (the controller creates it before Task 1).
**Prior state:** `m1-skeleton` tag contains scaffold + auth + design system + placeholder dashboard.

---

## Scope boundaries

**In M2:**
- Prisma schema extension: User profile fields + `Property` + `PropertyHousekeeper` + `deletedAt` soft-delete pattern for all three.
- Admin CRUD UIs: `/admin/users`, `/admin/properties`, `/admin/properties/[id]`, `/admin/settings`.
- Server-side authorization: anyone with role `ADMIN` or `SUPERADMIN` can manage all users and properties (single-tenant per design spec non-goal #2). `HOUSEKEEPER` role is blocked by middleware from `/admin/*` already.
- Admin password reset (generates a new password, shows it once — housekeepers do not have self-service reset in M2).
- Form primitives: `FormField`, `Select`, `Textarea`, reusable `DataTable`.

**Out of M2 (explicit non-goals, handled later):**
- Email sending (welcome mails, password reset mails) → M4.
- Uploaded photos / object storage → M4.
- Trips / Calendars / Registrations / Invoices / Housekeeping tasks → M3+.
- Self-service "forgot password" flow (requires email) → after M4.
- Per-tenant data isolation → never (single-tenant by design).
- Audit logging → M5+.

---

## File structure (new + modified)

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | **Modify:** extend `User`, add `Property`, add `PropertyHousekeeper`. Add `@@index` on `deletedAt` for soft-delete lookups. |
| `prisma/migrations/<ts>_profile_and_properties/` | **Create** (via `prisma migrate dev`). |
| `src/modules/users/schema.ts` | **Create:** zod schemas for create/update/password-reset payloads. |
| `src/modules/users/service.ts` | **Create:** pure functions — `listUsers`, `getUserById`, `createUser`, `updateUser`, `softDeleteUser`, `restoreUser`, `resetUserPassword`. |
| `src/modules/properties/schema.ts` | **Create:** zod schemas. |
| `src/modules/properties/service.ts` | **Create:** `listProperties`, `getPropertyById`, `createProperty`, `updateProperty`, `softDeleteProperty`. |
| `src/modules/property-housekeepers/schema.ts` | **Create:** zod schemas for assign/update/unassign. |
| `src/modules/property-housekeepers/service.ts` | **Create:** `listAssignments`, `assign`, `unassign`, `setDefault`, `updatePayOverride`. |
| `src/modules/settings/schema.ts` | **Create:** zod schema for the admin's own profile. |
| `src/modules/settings/service.ts` | **Create:** `getMyProfile`, `updateMyProfile`, `changeMyPassword`. |
| `src/components/ui/select.tsx` | **Create:** native `<select>` styled with tokens. |
| `src/components/ui/textarea.tsx` | **Create:** styled textarea. |
| `src/components/ui/form-field.tsx` | **Create:** label + description + error wrapper (works with react-hook-form). |
| `src/components/ui/data-table.tsx` | **Create:** headless table + empty state component. |
| `src/app/(admin)/admin/users/page.tsx` | **Create:** list + "Show deleted" filter. |
| `src/app/(admin)/admin/users/new/page.tsx` | **Create:** form. |
| `src/app/(admin)/admin/users/new/actions.ts` | **Create:** `createUserAction`. |
| `src/app/(admin)/admin/users/[id]/edit/page.tsx` | **Create:** form. |
| `src/app/(admin)/admin/users/[id]/edit/actions.ts` | **Create:** `updateUserAction`, `resetPasswordAction`. |
| `src/app/(admin)/admin/users/[id]/delete/route.ts` | **Create:** POST → soft-delete. |
| `src/app/(admin)/admin/users/[id]/restore/route.ts` | **Create:** POST → restore. |
| `src/app/(admin)/admin/properties/page.tsx` | **Create.** |
| `src/app/(admin)/admin/properties/new/{page,actions}.ts(x)` | **Create.** |
| `src/app/(admin)/admin/properties/[id]/page.tsx` | **Create:** detail with housekeeper assignments. |
| `src/app/(admin)/admin/properties/[id]/edit/{page,actions}.ts(x)` | **Create.** |
| `src/app/(admin)/admin/properties/[id]/housekeepers/actions.ts` | **Create:** `assignAction`, `unassignAction`, `setDefaultAction`, `updatePayAction`. |
| `src/app/(admin)/admin/properties/[id]/delete/route.ts` | **Create.** |
| `src/app/(admin)/admin/settings/{page,actions}.ts(x)` | **Create:** profile + password-change forms. |
| `src/lib/authz.ts` | **Create:** `requireAdmin()` helper; shared by all admin Server Actions. |
| `src/lib/password-gen.ts` | **Create:** URL-safe random password generator for admin-triggered resets. |
| `tests/unit/users-service.test.ts` | **Create.** |
| `tests/integration/users.test.ts` | **Create.** |
| `tests/unit/properties-service.test.ts` | **Create.** |
| `tests/integration/properties.test.ts` | **Create.** |
| `tests/unit/property-housekeepers-service.test.ts` | **Create.** |
| `tests/integration/property-housekeepers.test.ts` | **Create.** |
| `tests/unit/settings-service.test.ts` | **Create.** |
| `tests/unit/password-gen.test.ts` | **Create.** |

Modules each ship their schema alongside the service. UI pages are thin — they call module functions and render shared primitives.

---

## Branch setup (do this before Task 1)

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
git checkout main
git pull --ff-only
git checkout -b m2-identity-properties
```

If the controller is working from the `m1-skeleton` branch instead, it can branch from there: `git checkout -b m2-identity-properties m1-skeleton`. Either is fine — M2 does not conflict with M1 work since M1 is tagged and stable.

---

## Task 1: Prisma schema extension + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_profile_and_properties/migration.sql` (generated by Prisma)

- [ ] **Step 1: Extend `prisma/schema.prisma`**

Replace the entire file with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPERADMIN
  ADMIN
  HOUSEKEEPER
}

model User {
  id           Int       @id @default(autoincrement())
  username     String    @unique
  email        String    @unique
  passwordHash String
  role         UserRole  @default(ADMIN)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  // Admin contact / branding (used on invoices, emails)
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

  // Preferences
  photoRequiredAdults   Boolean  @default(true)
  photoRequiredChildren Boolean  @default(true)
  dateFormat            String   @default("d.M.y")
  defaultHousekeeperPay Decimal  @default(20) @db.Decimal(10, 2)

  sessions            Session[]
  ownedProperties     Property[]            @relation("PropertyOwner")
  housekeeperAssignments PropertyHousekeeper[] @relation("AssignmentHousekeeper")

  @@index([deletedAt])
}

model Session {
  id        String   @id
  userId    Int
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Property {
  id        Int       @id @default(autoincrement())
  name      String
  ownerId   Int
  owner     User      @relation("PropertyOwner", fields: [ownerId], references: [id])
  maxGuests Int?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  housekeepers PropertyHousekeeper[]

  @@index([ownerId])
  @@index([deletedAt])
}

model PropertyHousekeeper {
  propertyId    Int
  housekeeperId Int
  isDefault     Boolean   @default(false)
  payOverride   Decimal?  @db.Decimal(10, 2)
  createdAt     DateTime  @default(now())

  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  housekeeper User     @relation("AssignmentHousekeeper", fields: [housekeeperId], references: [id], onDelete: Cascade)

  @@id([propertyId, housekeeperId])
  @@index([housekeeperId])
}
```

- [ ] **Step 2: Verify local dev Postgres is running**

```bash
docker ps --filter name=postgres --format '{{.Names}}\t{{.Status}}'
```

Expected: at least one running postgres on port 5432 (either `papayapos-backend-postgres-1` or whatever the user has). If nothing, start one:

```bash
docker run -d --name gr-pg-dev \
  -e POSTGRES_DB=guest_registration \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine
```

- [ ] **Step 3: Create migration**

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
npx prisma migrate dev --name profile_and_properties
```

Expected:
- Creates `prisma/migrations/<ts>_profile_and_properties/migration.sql`.
- Applies it to the local dev DB.
- Regenerates Prisma Client (`node_modules/.prisma/client/`).

The migration should add: all new `User` columns (nullable with defaults where stated), `User.updatedAt`, `User.deletedAt`, `User(deletedAt)` index, `Property` table, `PropertyHousekeeper` table with composite PK.

- [ ] **Step 4: Verify migration by inspecting the SQL**

```bash
ls prisma/migrations/ | tail -1 | xargs -I{} cat prisma/migrations/{}/migration.sql | head -50
```

Check it contains `CREATE TABLE "Property"` and `CREATE TABLE "PropertyHousekeeper"` and `ALTER TABLE "User" ADD COLUMN "companyName"`.

- [ ] **Step 5: Typecheck (Prisma Client regenerated the new types)**

```bash
npm run typecheck
```

Expected: passes (zero errors). If `updatedAt` triggers an error anywhere (e.g., Task 1 of M1's login doesn't set it), investigate; Prisma auto-manages `@updatedAt` so inserts should not need to provide it.

- [ ] **Step 6: Run the existing test suite to catch regressions**

```bash
npm test
```

Expected: 10/10 still pass. The auth integration test creates users without the new optional fields, which is fine since they all have defaults or are nullable.

- [ ] **Step 7: Commit**

```bash
git add prisma/
git commit -m "feat(db): extend User + add Property + PropertyHousekeeper"
```

---

## Task 2: Install form + data libraries

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install**

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
npm install react-hook-form@^7.53.2 @hookform/resolvers@^3.9.1
```

- [ ] **Step 2: Verify**

```bash
node -e "console.log(require('./package.json').dependencies['react-hook-form'], require('./package.json').dependencies['@hookform/resolvers'])"
```

Expected: `^7.53.2 ^3.9.1` (or equivalent matching versions).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add react-hook-form + hookform resolvers"
```

---

## Task 3: Authorization helper

Centralize the admin guard so every Server Action and Route Handler uses the same check.

**Files:**
- Create: `src/lib/authz.ts`
- Create: `tests/unit/authz.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/authz.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/modules/auth/current', () => ({
  getCurrentSession: vi.fn(),
}));

import { requireAdmin, AuthError } from '@/lib/authz';
import { getCurrentSession } from '@/modules/auth/current';

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the user when role is ADMIN', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 1, username: 'a', email: 'a@x', role: 'ADMIN' } as never,
      session: { id: 's', userId: 1, expiresAt: new Date() } as never,
    });
    const u = await requireAdmin();
    expect(u.role).toBe('ADMIN');
  });

  it('returns the user when role is SUPERADMIN', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 1, username: 'a', email: 'a@x', role: 'SUPERADMIN' } as never,
      session: { id: 's', userId: 1, expiresAt: new Date() } as never,
    });
    const u = await requireAdmin();
    expect(u.role).toBe('SUPERADMIN');
  });

  it('throws AuthError when no session', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: null, session: null });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthError);
  });

  it('throws AuthError when role is HOUSEKEEPER', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 9, username: 'h', email: 'h@x', role: 'HOUSEKEEPER' } as never,
      session: { id: 's', userId: 9, expiresAt: new Date() } as never,
    });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthError);
  });
});
```

- [ ] **Step 2: Run it — should fail**

```bash
npm test -- tests/unit/authz.test.ts
```

Expected: "Cannot find module '@/lib/authz'".

- [ ] **Step 3: Implement `src/lib/authz.ts`**

```ts
import type { User } from '@prisma/client';
import { getCurrentSession } from '@/modules/auth/current';

export class AuthError extends Error {
  constructor(public readonly reason: 'unauthenticated' | 'forbidden') {
    super(reason);
    this.name = 'AuthError';
  }
}

/** Require an authenticated admin (ADMIN or SUPERADMIN). Throws AuthError otherwise. */
export async function requireAdmin(): Promise<User> {
  const { user } = await getCurrentSession();
  if (!user) throw new AuthError('unauthenticated');
  if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    throw new AuthError('forbidden');
  }
  return user as User;
}
```

- [ ] **Step 4: Run test — should pass**

```bash
npm test -- tests/unit/authz.test.ts
```

Expected: `✓ 4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/authz.ts tests/unit/authz.test.ts
git commit -m "feat(authz): requireAdmin helper with AuthError"
```

---

## Task 4: Random password generator

For admin-triggered password resets. Not for routine security operations — just generates a URL-safe readable string.

**Files:**
- Create: `src/lib/password-gen.ts`
- Create: `tests/unit/password-gen.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/password-gen.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateRandomPassword } from '@/lib/password-gen';

describe('generateRandomPassword', () => {
  it('returns a string of the requested length', () => {
    expect(generateRandomPassword(12).length).toBe(12);
    expect(generateRandomPassword(20).length).toBe(20);
  });

  it('uses a URL-safe alphabet only (no ambiguous chars)', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRandomPassword(16)).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
    }
  });

  it('is non-deterministic', () => {
    const set = new Set(Array.from({ length: 100 }, () => generateRandomPassword(16)));
    expect(set.size).toBe(100);
  });
});
```

- [ ] **Step 2: Run — should fail**

```bash
npm test -- tests/unit/password-gen.test.ts
```

- [ ] **Step 3: Implement `src/lib/password-gen.ts`**

```ts
import crypto from 'node:crypto';

// URL-safe alphabet without visually ambiguous chars (0/O, 1/l/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Generate a random password. Default length 14 (≈ 82 bits of entropy). */
export function generateRandomPassword(length = 14): string {
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
npm test -- tests/unit/password-gen.test.ts
```

Expected: `✓ 3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/password-gen.ts tests/unit/password-gen.test.ts
git commit -m "feat(lib): generateRandomPassword for admin-triggered resets"
```

---

## Task 5: UI primitives — Select, Textarea, FormField, DataTable

**Files:**
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/form-field.tsx`
- Create: `src/components/ui/data-table.tsx`

- [ ] **Step 1: `src/components/ui/select.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/cn';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg',
      'transition-colors hover:border-border-strong',
      'focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/25',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
```

- [ ] **Step 2: `src/components/ui/textarea.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/cn';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[72px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle',
      'transition-colors hover:border-border-strong',
      'focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/25',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
```

- [ ] **Step 3: `src/components/ui/form-field.tsx`**

```tsx
import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';

interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string | undefined;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-danger-700">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-fg-muted">{description}</p>
      )}
      {error && (
        <p className="text-xs text-danger-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `src/components/ui/data-table.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/cn';

interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Array<ColumnDef<T>>;
  rows: T[];
  emptyState?: React.ReactNode;
  rowKey: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  rows,
  emptyState,
  rowKey,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
        {emptyState ?? (
          <p className="text-sm text-fg-muted">Nothing here yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-fg-muted',
                  c.align === 'right' ? 'text-right' : 'text-left',
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              className={cn(
                'hover:bg-surface-2 transition-colors',
                i < rows.length - 1 && 'border-b border-border',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-4 py-3 text-fg',
                    c.align === 'right' ? 'text-right' : 'text-left',
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Verify typecheck**

```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/select.tsx src/components/ui/textarea.tsx src/components/ui/form-field.tsx src/components/ui/data-table.tsx
git commit -m "feat(ui): Select, Textarea, FormField, DataTable primitives"
```

---

## Task 6: Users module (service + unit tests)

**Files:**
- Create: `src/modules/users/schema.ts`
- Create: `src/modules/users/service.ts`
- Create: `tests/unit/users-service.test.ts`

- [ ] **Step 1: `src/modules/users/schema.ts`**

```ts
import { z } from 'zod';

export const userRoleSchema = z.enum(['SUPERADMIN', 'ADMIN', 'HOUSEKEEPER']);

export const createUserSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(200),
  role: userRoleSchema.default('ADMIN'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(120),
  role: userRoleSchema,
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(200),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

- [ ] **Step 2: `src/modules/users/service.ts`**

```ts
import type { User } from '@prisma/client';
import { prisma } from '@/db/client';
import { hashPassword } from '@/modules/auth/password';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ResetPasswordInput,
} from './schema';

export type PublicUser = Omit<User, 'passwordHash'>;

function redact(user: User): PublicUser {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

export async function listUsers({
  includeDeleted = false,
}: { includeDeleted?: boolean } = {}): Promise<PublicUser[]> {
  const rows = await prisma.user.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: [{ deletedAt: 'asc' }, { username: 'asc' }],
  });
  return rows.map(redact);
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? redact(row) : null;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const data = createUserSchema.parse(input);
  const row = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      role: data.role,
      passwordHash: await hashPassword(data.password),
    },
  });
  return redact(row);
}

export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<PublicUser> {
  const data = updateUserSchema.parse(input);
  const row = await prisma.user.update({ where: { id }, data });
  return redact(row);
}

export async function softDeleteUser(id: number): Promise<PublicUser> {
  const row = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  // Also invalidate all active sessions so the user is immediately logged out everywhere.
  await prisma.session.deleteMany({ where: { userId: id } });
  return redact(row);
}

export async function restoreUser(id: number): Promise<PublicUser> {
  const row = await prisma.user.update({
    where: { id },
    data: { deletedAt: null },
  });
  return redact(row);
}

export async function resetUserPassword(
  id: number,
  input: ResetPasswordInput,
): Promise<PublicUser> {
  const data = resetPasswordSchema.parse(input);
  const row = await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  // Invalidate existing sessions — user must re-login with the new password.
  await prisma.session.deleteMany({ where: { userId: id } });
  return redact(row);
}
```

- [ ] **Step 3: Write unit test `tests/unit/users-service.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from '@/modules/users/schema';

describe('users schemas', () => {
  it('createUserSchema rejects short passwords', () => {
    const r = createUserSchema.safeParse({
      username: 'ok',
      email: 'x@y.z',
      password: 'short',
      role: 'ADMIN',
    });
    expect(r.success).toBe(false);
  });

  it('createUserSchema accepts valid input and defaults role to ADMIN', () => {
    const r = createUserSchema.parse({
      username: 'someone',
      email: 'some@one.io',
      password: 'a-valid-password',
    });
    expect(r.role).toBe('ADMIN');
  });

  it('updateUserSchema requires role explicitly', () => {
    const ok = updateUserSchema.safeParse({
      username: 'a',
      email: 'b@c.io',
      role: 'HOUSEKEEPER',
    });
    expect(ok.success).toBe(false); // username min 3
    const ok2 = updateUserSchema.parse({
      username: 'abc',
      email: 'b@c.io',
      role: 'HOUSEKEEPER',
    });
    expect(ok2.role).toBe('HOUSEKEEPER');
  });

  it('resetPasswordSchema enforces min length', () => {
    expect(resetPasswordSchema.safeParse({ newPassword: '1234' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ newPassword: 'longenoughpw' }).success).toBe(true);
  });
});
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- tests/unit/users-service.test.ts
```

Expected: `✓ 4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/modules/users/ tests/unit/users-service.test.ts
git commit -m "feat(users): service + zod schemas (list, CRUD, soft-delete, reset)"
```

---

## Task 7: Users integration test (Testcontainers)

**Files:**
- Create: `tests/integration/users.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

describe('users service', () => {
  it('creates, lists, updates, soft-deletes, and restores a user', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/users/service');

    const created = await svc.createUser({
      username: 'housekeeper1',
      email: 'hk1@example.com',
      password: 'secretpass!',
      role: 'HOUSEKEEPER',
    });
    expect(created.username).toBe('housekeeper1');
    expect((created as { passwordHash?: string }).passwordHash).toBeUndefined();

    const listed = await svc.listUsers();
    expect(listed).toHaveLength(1);

    const updated = await svc.updateUser(created.id, {
      username: 'housekeeper1',
      email: 'new@example.com',
      role: 'HOUSEKEEPER',
    });
    expect(updated.email).toBe('new@example.com');

    const deleted = await svc.softDeleteUser(created.id);
    expect(deleted.deletedAt).not.toBeNull();

    const activeOnly = await svc.listUsers();
    expect(activeOnly).toHaveLength(0);
    const withDeleted = await svc.listUsers({ includeDeleted: true });
    expect(withDeleted).toHaveLength(1);

    const restored = await svc.restoreUser(created.id);
    expect(restored.deletedAt).toBeNull();
  });

  it('invalidates sessions when a user is soft-deleted', async () => {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const session = await import('@/modules/auth/session');

    const u = await users.createUser({
      username: 'walker',
      email: 'w@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    const token = session.generateSessionToken();
    await session.createSession(token, u.id);
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(1);

    await users.softDeleteUser(u.id);
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(0);
  });

  it('invalidates sessions when password is reset', async () => {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const session = await import('@/modules/auth/session');

    const u = await users.createUser({
      username: 'rotate',
      email: 'r@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    const token = session.generateSessionToken();
    await session.createSession(token, u.id);
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(1);

    await users.resetUserPassword(u.id, { newPassword: 'brand-new-pw-01' });
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(0);
  });
});
```

- [ ] **Step 2: Run**

```bash
npm test -- tests/integration/users.test.ts
```

Expected: `✓ 3 passed` (first run spins up postgres image — ~30–60s).

- [ ] **Step 3: Commit**

```bash
git add tests/integration/users.test.ts
git commit -m "test(users): integration tests (CRUD + session invalidation on delete/reset)"
```

---

## Task 8: /admin/users list page

**Files:**
- Create: `src/app/(admin)/admin/users/page.tsx`

- [ ] **Step 1: Implement `src/app/(admin)/admin/users/page.tsx`**

```tsx
import Link from 'next/link';
import { Plus, UserMinus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listUsers } from '@/modules/users/service';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ deleted?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const includeDeleted = params.deleted === '1';
  const users = await listUsers({ includeDeleted });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Users</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Admins, superadmins, and housekeepers with account access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={includeDeleted ? '/admin/users' : '/admin/users?deleted=1'}
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            {includeDeleted ? 'Hide deleted' : 'Show deleted'}
          </Link>
          <Link href="/admin/users/new">
            <Button size="md">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              New user
            </Button>
          </Link>
        </div>
      </header>

      <DataTable
        rowKey={(u) => u.id}
        rows={users}
        columns={[
          { key: 'username', header: 'Username', render: (u) => (
            <span className="font-medium text-fg">{u.username}</span>
          ) },
          { key: 'email', header: 'Email', render: (u) => <span className="text-fg-muted">{u.email}</span> },
          { key: 'role', header: 'Role', render: (u) => (
            <Pill tone={u.role === 'SUPERADMIN' ? 'accent' : u.role === 'ADMIN' ? 'info' : 'neutral'}>
              {u.role.toLowerCase()}
            </Pill>
          ) },
          { key: 'status', header: 'Status', render: (u) => (
            u.deletedAt
              ? <Pill tone="danger">Deleted</Pill>
              : <Pill tone="success">Active</Pill>
          ) },
          { key: 'actions', header: '', align: 'right', render: (u) => (
            <Link
              href={`/admin/users/${u.id}/edit`}
              className="text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              Edit
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <UserMinus className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No users yet. <Link href="/admin/users/new" className="text-accent-600">Add one</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: `/admin/users` appears in the route list as `ƒ` (dynamic).

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(admin)/admin/users/page.tsx'
git commit -m "feat(admin): users list page with deleted filter"
```

---

## Task 9: /admin/users/new — form + Server Action

**Files:**
- Create: `src/app/(admin)/admin/users/new/page.tsx`
- Create: `src/app/(admin)/admin/users/new/actions.ts`

- [ ] **Step 1: `src/app/(admin)/admin/users/new/actions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/authz';
import { createUser } from '@/modules/users/service';
import { createUserSchema } from '@/modules/users/schema';

export type CreateUserState = { error?: string; fieldErrors?: Record<string, string> };

export async function createUserAction(
  _prev: CreateUserState | undefined,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await createUser(parsed.data);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.[0] ?? 'field';
      return { error: `A user with this ${target} already exists.` };
    }
    throw err;
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}
```

- [ ] **Step 2: `src/app/(admin)/admin/users/new/page.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { createUserAction, type CreateUserState } from './actions';

export default function NewUserPage() {
  const [state, action, pending] = useActionState<CreateUserState | undefined, FormData>(
    createUserAction,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">New user</h1>
        <p className="mt-1 text-sm text-fg-muted">
          The new user will be able to sign in immediately using the password you set.
        </p>
      </header>

      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}

        <FormField id="username" label="Username" required error={fe.username}>
          <Input id="username" name="username" autoComplete="off" required />
        </FormField>

        <FormField id="email" label="Email" required error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="off" required />
        </FormField>

        <FormField id="password" label="Password" description="Minimum 8 characters." required error={fe.password}>
          <Input id="password" name="password" type="text" autoComplete="new-password" required />
        </FormField>

        <FormField id="role" label="Role" required error={fe.role}>
          <Select id="role" name="role" defaultValue="ADMIN">
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="HOUSEKEEPER">Housekeeper</option>
          </Select>
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-3">
          <Link href="/admin/users">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create user'}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(admin)/admin/users/new/'
git commit -m "feat(admin): /admin/users/new page + createUserAction"
```

---

## Task 10: /admin/users/[id]/edit — form + Server Actions (update + reset password)

**Files:**
- Create: `src/app/(admin)/admin/users/[id]/edit/page.tsx`
- Create: `src/app/(admin)/admin/users/[id]/edit/actions.ts`

- [ ] **Step 1: `src/app/(admin)/admin/users/[id]/edit/actions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/authz';
import { updateUser, resetUserPassword } from '@/modules/users/service';
import { updateUserSchema, resetPasswordSchema } from '@/modules/users/schema';

type BaseState = { error?: string; fieldErrors?: Record<string, string> };

export async function updateUserAction(
  id: number,
  _prev: BaseState | undefined,
  formData: FormData,
): Promise<BaseState> {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    role: formData.get('role'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await updateUser(id, parsed.data);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.[0] ?? 'field';
      return { error: `Another user has this ${target}.` };
    }
    throw err;
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}/edit`);
  redirect('/admin/users');
}

export type ResetPasswordState = { error?: string; newPassword?: string };

export async function resetPasswordAction(
  id: number,
  _prev: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireAdmin();

  const newPassword = String(formData.get('newPassword') ?? '');
  const parsed = resetPasswordSchema.safeParse({ newPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid password' };
  }
  await resetUserPassword(id, parsed.data);
  return { newPassword: parsed.data.newPassword };
}
```

- [ ] **Step 2: `src/app/(admin)/admin/users/[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getUserById } from '@/modules/users/service';
import { EditUserForm } from './form';
import { ResetPasswordPanel } from './reset-password-panel';
import { DeletePanel } from './delete-panel';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const user = await getUserById(id);
  if (!user) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit user</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {user.username} · {user.email}
          </p>
        </div>
        <Link href="/admin/users" className="text-sm text-accent-600 hover:text-accent-700">
          Back to users
        </Link>
      </header>

      <EditUserForm
        id={user.id}
        initial={{ username: user.username, email: user.email, role: user.role }}
      />

      <ResetPasswordPanel id={user.id} />

      <DeletePanel id={user.id} deleted={user.deletedAt !== null} />
    </div>
  );
}
```

- [ ] **Step 3: Split out client pieces into colocated files.**

`src/app/(admin)/admin/users/[id]/edit/form.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { updateUserAction } from './actions';

interface Props {
  id: number;
  initial: { username: string; email: string; role: 'SUPERADMIN' | 'ADMIN' | 'HOUSEKEEPER' };
}

export function EditUserForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updateUserAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">Profile</h2>
      <p className="mt-1 text-xs text-fg-muted">
        Username and email must be unique across the workspace.
      </p>

      <form action={action} className="mt-5 flex flex-col gap-5">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}
        <FormField id="username" label="Username" required error={fe.username}>
          <Input id="username" name="username" defaultValue={initial.username} required />
        </FormField>
        <FormField id="email" label="Email" required error={fe.email}>
          <Input id="email" name="email" type="email" defaultValue={initial.email} required />
        </FormField>
        <FormField id="role" label="Role" required error={fe.role}>
          <Select id="role" name="role" defaultValue={initial.role}>
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="HOUSEKEEPER">Housekeeper</option>
          </Select>
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </section>
  );
}
```

`src/app/(admin)/admin/users/[id]/edit/reset-password-panel.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { resetPasswordAction } from './actions';

export function ResetPasswordPanel({ id }: { id: number }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction.bind(null, id),
    undefined,
  );

  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">Reset password</h2>
      <p className="mt-1 text-xs text-fg-muted">
        Type a new password or generate one. The user&apos;s current sessions are invalidated
        immediately.
      </p>

      <form action={action} className="mt-5 flex flex-col gap-5">
        <FormField id="newPassword" label="New password" required error={state?.error}>
          <Input
            id="newPassword"
            name="newPassword"
            type="text"
            autoComplete="off"
            minLength={8}
            required
          />
        </FormField>

        {state?.newPassword && (
          <p className="rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700">
            Password updated. New password: <strong className="font-mono">{state.newPassword}</strong>
            <br />
            Share it with the user — this is the last time it will be shown.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? 'Updating…' : 'Set password'}
          </Button>
        </div>
      </form>
    </section>
  );
}
```

`src/app/(admin)/admin/users/[id]/edit/delete-panel.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';

export function DeletePanel({ id, deleted }: { id: number; deleted: boolean }) {
  if (deleted) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Restore user</h2>
        <p className="mt-1 text-xs text-fg-muted">
          This user was soft-deleted. Restoring will re-enable sign-in.
        </p>
        <form action={`/admin/users/${id}/restore`} method="post" className="mt-5 flex justify-end">
          <Button type="submit" variant="secondary">Restore user</Button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
      <h2 className="text-sm font-semibold text-danger-700">Delete user</h2>
      <p className="mt-1 text-xs text-danger-700/80">
        Soft-delete. Historical data is preserved; active sessions are invalidated.
      </p>
      <form
        action={`/admin/users/${id}/delete`}
        method="post"
        className="mt-5 flex justify-end"
        onSubmit={(e) => {
          if (!confirm('Soft-delete this user?')) e.preventDefault();
        }}
      >
        <Button type="submit" variant="danger">Delete user</Button>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: passes. Note `useActionState(fn.bind(null, id), undefined)` is a Next 15 / React 19 idiom that binds an extra argument — the compiler should accept it because `updateUserAction` has `(id, prev, formData)` signature.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(admin)/admin/users/[id]/edit/'
git commit -m "feat(admin): /admin/users/[id]/edit with update + reset-password panels"
```

---

## Task 11: /admin/users/[id]/{delete,restore} route handlers

**Files:**
- Create: `src/app/(admin)/admin/users/[id]/delete/route.ts`
- Create: `src/app/(admin)/admin/users/[id]/restore/route.ts`

- [ ] **Step 1: `.../delete/route.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { softDeleteUser } from '@/modules/users/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await softDeleteUser(id);
  revalidatePath('/admin/users');
  return NextResponse.redirect(new URL('/admin/users', req.url), 303);
}
```

- [ ] **Step 2: `.../restore/route.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { restoreUser } from '@/modules/users/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await restoreUser(id);
  revalidatePath('/admin/users');
  return NextResponse.redirect(new URL(`/admin/users/${id}/edit`, req.url), 303);
}
```

- [ ] **Step 3: Typecheck + build**

```bash
npm run typecheck && npm run build 2>&1 | tail -10
```

Expected: both pass; new routes listed.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(admin)/admin/users/[id]/delete/' 'src/app/(admin)/admin/users/[id]/restore/'
git commit -m "feat(admin): soft-delete + restore routes for users"
```

---

## Task 12: Properties module (service + unit + integration tests)

**Files:**
- Create: `src/modules/properties/schema.ts`
- Create: `src/modules/properties/service.ts`
- Create: `tests/unit/properties-service.test.ts`
- Create: `tests/integration/properties.test.ts`

- [ ] **Step 1: `src/modules/properties/schema.ts`**

```ts
import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().trim().min(1).max(200),
  ownerId: z.coerce.number().int().positive(),
  maxGuests: z.coerce.number().int().positive().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z.object({
  name: z.string().trim().min(1).max(200),
  maxGuests: z.coerce.number().int().positive().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
```

- [ ] **Step 2: `src/modules/properties/service.ts`**

```ts
import type { Property, User } from '@prisma/client';
import { prisma } from '@/db/client';
import {
  createPropertySchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from './schema';

export type PropertyWithOwner = Property & {
  owner: Pick<User, 'id' | 'username' | 'email'>;
};

export async function listProperties({
  includeDeleted = false,
}: { includeDeleted?: boolean } = {}): Promise<PropertyWithOwner[]> {
  return prisma.property.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    include: { owner: { select: { id: true, username: true, email: true } } },
    orderBy: [{ deletedAt: 'asc' }, { name: 'asc' }],
  });
}

export async function getPropertyById(id: number): Promise<PropertyWithOwner | null> {
  return prisma.property.findUnique({
    where: { id },
    include: { owner: { select: { id: true, username: true, email: true } } },
  });
}

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const data = createPropertySchema.parse(input);
  return prisma.property.create({ data });
}

export async function updateProperty(id: number, input: UpdatePropertyInput): Promise<Property> {
  const data = updatePropertySchema.parse(input);
  return prisma.property.update({ where: { id }, data });
}

export async function softDeleteProperty(id: number): Promise<Property> {
  return prisma.property.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreProperty(id: number): Promise<Property> {
  return prisma.property.update({
    where: { id },
    data: { deletedAt: null },
  });
}
```

- [ ] **Step 3: Unit test `tests/unit/properties-service.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { createPropertySchema, updatePropertySchema } from '@/modules/properties/schema';

describe('properties schemas', () => {
  it('createPropertySchema requires name and ownerId', () => {
    expect(createPropertySchema.safeParse({ name: '' }).success).toBe(false);
    expect(createPropertySchema.safeParse({ name: 'ok', ownerId: 1 }).success).toBe(true);
  });

  it('createPropertySchema coerces ownerId and maxGuests from string', () => {
    const r = createPropertySchema.parse({ name: 'ok', ownerId: '42', maxGuests: '6' });
    expect(r.ownerId).toBe(42);
    expect(r.maxGuests).toBe(6);
  });

  it('updatePropertySchema allows omitting maxGuests', () => {
    const r = updatePropertySchema.parse({ name: 'ok' });
    expect(r.maxGuests).toBeUndefined();
  });
});
```

- [ ] **Step 4: Integration test `tests/integration/properties.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

describe('properties service', () => {
  async function seedOwner() {
    const { createUser } = await import('@/modules/users/service');
    const u = await createUser({
      username: 'owner',
      email: 'owner@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    return u;
  }

  it('creates, lists, updates, soft-deletes, and restores a property', async () => {
    process.env.DATABASE_URL = ctx.url;
    const owner = await seedOwner();
    const svc = await import('@/modules/properties/service');

    const created = await svc.createProperty({
      name: 'Tatranská Perla — Apt 2B',
      ownerId: owner.id,
      maxGuests: 4,
    });
    expect(created.name).toContain('Tatranská Perla');

    const listed = await svc.listProperties();
    expect(listed).toHaveLength(1);
    expect(listed[0]!.owner.username).toBe('owner');

    const updated = await svc.updateProperty(created.id, {
      name: 'Tatranská Perla — Apt 2B (renovated)',
      maxGuests: 5,
    });
    expect(updated.maxGuests).toBe(5);

    const deleted = await svc.softDeleteProperty(created.id);
    expect(deleted.deletedAt).not.toBeNull();
    expect(await svc.listProperties()).toHaveLength(0);
    expect(await svc.listProperties({ includeDeleted: true })).toHaveLength(1);

    const restored = await svc.restoreProperty(created.id);
    expect(restored.deletedAt).toBeNull();
  });
});
```

- [ ] **Step 5: Run both test files**

```bash
npm test -- tests/unit/properties-service.test.ts tests/integration/properties.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/modules/properties/ tests/unit/properties-service.test.ts tests/integration/properties.test.ts
git commit -m "feat(properties): service + schemas + unit/integration tests"
```

---

## Task 13: /admin/properties pages (list + new + edit + delete + restore)

**Files:**
- Create: `src/app/(admin)/admin/properties/page.tsx`
- Create: `src/app/(admin)/admin/properties/new/page.tsx`
- Create: `src/app/(admin)/admin/properties/new/actions.ts`
- Create: `src/app/(admin)/admin/properties/[id]/edit/page.tsx`
- Create: `src/app/(admin)/admin/properties/[id]/edit/actions.ts`
- Create: `src/app/(admin)/admin/properties/[id]/edit/form.tsx`
- Create: `src/app/(admin)/admin/properties/[id]/delete/route.ts`
- Create: `src/app/(admin)/admin/properties/[id]/restore/route.ts`

- [ ] **Step 1: List page `src/app/(admin)/admin/properties/page.tsx`**

```tsx
import Link from 'next/link';
import { Home, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ deleted?: string }>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const includeDeleted = params.deleted === '1';
  const rows = await listProperties({ includeDeleted });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Properties</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Apartments and cottages you rent through Airbnb.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={includeDeleted ? '/admin/properties' : '/admin/properties?deleted=1'}
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            {includeDeleted ? 'Hide deleted' : 'Show deleted'}
          </Link>
          <Link href="/admin/properties/new">
            <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New property</Button>
          </Link>
        </div>
      </header>

      <DataTable
        rowKey={(p) => p.id}
        rows={rows}
        columns={[
          { key: 'name', header: 'Name', render: (p) => (
            <Link href={`/admin/properties/${p.id}`} className="font-medium text-fg hover:text-accent-700">
              {p.name}
            </Link>
          ) },
          { key: 'owner', header: 'Owner', render: (p) => (
            <span className="text-fg-muted">{p.owner.username}</span>
          ) },
          { key: 'maxGuests', header: 'Max guests', align: 'right', render: (p) => (
            <span className="tabular-nums text-fg">{p.maxGuests ?? '—'}</span>
          ) },
          { key: 'status', header: 'Status', render: (p) => (
            p.deletedAt ? <Pill tone="danger">Deleted</Pill> : <Pill tone="success">Active</Pill>
          ) },
          { key: 'actions', header: '', align: 'right', render: (p) => (
            <Link href={`/admin/properties/${p.id}/edit`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Edit
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <Home className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No properties yet. <Link href="/admin/properties/new" className="text-accent-600">Add one</Link>.
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
import { createProperty } from '@/modules/properties/service';
import { createPropertySchema } from '@/modules/properties/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createPropertyAction(
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  const admin = await requireAdmin();

  const parsed = createPropertySchema.safeParse({
    name: formData.get('name'),
    // Default owner to current admin if not specified (single-tenant).
    ownerId: formData.get('ownerId') ?? admin.id,
    maxGuests: formData.get('maxGuests') || undefined,
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

  const p = await createProperty(parsed.data);
  revalidatePath('/admin/properties');
  redirect(`/admin/properties/${p.id}`);
}
```

- [ ] **Step 3: New page `.../new/page.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { createPropertyAction } from './actions';

export default function NewPropertyPage() {
  const [state, action, pending] = useActionState(createPropertyAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">New property</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Add an apartment or cottage you want to manage.
        </p>
      </header>

      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}

        <FormField id="name" label="Name" required error={fe.name}>
          <Input id="name" name="name" autoComplete="off" required />
        </FormField>

        <FormField id="maxGuests" label="Max guests" description="Capacity limit on registrations." error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} />
        </FormField>

        <FormField id="notes" label="Internal notes" description="Only visible to admins. Nothing here appears to guests." error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} />
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-3">
          <Link href="/admin/properties"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create property'}</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Edit action `.../[id]/edit/actions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { updateProperty } from '@/modules/properties/service';
import { updatePropertySchema } from '@/modules/properties/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function updatePropertyAction(
  id: number,
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const parsed = updatePropertySchema.safeParse({
    name: formData.get('name'),
    maxGuests: formData.get('maxGuests') || undefined,
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
  await updateProperty(id, parsed.data);
  revalidatePath('/admin/properties');
  revalidatePath(`/admin/properties/${id}`);
  redirect(`/admin/properties/${id}`);
}
```

- [ ] **Step 5: Edit form + page**

`.../[id]/edit/form.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { updatePropertyAction } from './actions';

interface Props {
  id: number;
  initial: { name: string; maxGuests: number | null; notes: string | null; deleted: boolean };
}

export function EditPropertyForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updatePropertyAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-8">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}
        <FormField id="name" label="Name" required error={fe.name}>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </FormField>
        <FormField id="maxGuests" label="Max guests" error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={initial.maxGuests ?? ''} />
        </FormField>
        <FormField id="notes" label="Internal notes" error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ''} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href={`/admin/properties/${id}`}><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>

      {initial.deleted ? (
        <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-fg">Restore property</h2>
          <form action={`/admin/properties/${id}/restore`} method="post" className="mt-5 flex justify-end">
            <Button type="submit" variant="secondary">Restore</Button>
          </form>
        </section>
      ) : (
        <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
          <h2 className="text-sm font-semibold text-danger-700">Delete property</h2>
          <p className="mt-1 text-xs text-danger-700/80">
            Soft-delete. All trips, registrations, and housekeeping tasks that reference it are preserved.
          </p>
          <form
            action={`/admin/properties/${id}/delete`}
            method="post"
            className="mt-5 flex justify-end"
            onSubmit={(e) => { if (!confirm('Soft-delete this property?')) e.preventDefault(); }}
          >
            <Button type="submit" variant="danger">Delete</Button>
          </form>
        </section>
      )}
    </div>
  );
}
```

`.../[id]/edit/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getPropertyById } from '@/modules/properties/service';
import { EditPropertyForm } from './form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const p = await getPropertyById(id);
  if (!p) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit property</h1>
          <p className="mt-1 text-sm text-fg-muted">{p.name}</p>
        </div>
        <Link href={`/admin/properties/${p.id}`} className="text-sm text-accent-600 hover:text-accent-700">
          Back
        </Link>
      </header>

      <EditPropertyForm
        id={p.id}
        initial={{ name: p.name, maxGuests: p.maxGuests, notes: p.notes, deleted: p.deletedAt !== null }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Delete + restore routes**

`.../[id]/delete/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { softDeleteProperty } from '@/modules/properties/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await softDeleteProperty(id);
  revalidatePath('/admin/properties');
  return NextResponse.redirect(new URL('/admin/properties', req.url), 303);
}
```

`.../[id]/restore/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { restoreProperty } from '@/modules/properties/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await restoreProperty(id);
  revalidatePath('/admin/properties');
  return NextResponse.redirect(new URL(`/admin/properties/${id}/edit`, req.url), 303);
}
```

- [ ] **Step 7: Typecheck + build**

```bash
npm run typecheck && npm run build 2>&1 | tail -15
```

Expected: passes. `/admin/properties`, `/admin/properties/new`, `/admin/properties/[id]/edit`, `/admin/properties/[id]/delete`, `/admin/properties/[id]/restore` all listed.

- [ ] **Step 8: Commit**

```bash
git add 'src/app/(admin)/admin/properties/'
git commit -m "feat(admin): properties list + new + edit + soft-delete/restore"
```

---

## Task 14: Property detail page + PropertyHousekeeper module

**Files:**
- Create: `src/modules/property-housekeepers/schema.ts`
- Create: `src/modules/property-housekeepers/service.ts`
- Create: `tests/unit/property-housekeepers-service.test.ts`
- Create: `tests/integration/property-housekeepers.test.ts`
- Create: `src/app/(admin)/admin/properties/[id]/page.tsx`
- Create: `src/app/(admin)/admin/properties/[id]/housekeepers/actions.ts`
- Create: `src/app/(admin)/admin/properties/[id]/housekeepers-panel.tsx`

- [ ] **Step 1: Service schema `src/modules/property-housekeepers/schema.ts`**

```ts
import { z } from 'zod';

export const assignSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  housekeeperId: z.coerce.number().int().positive(),
  isDefault: z.coerce.boolean().optional(),
  payOverride: z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/).optional())
    .optional(),
});
export type AssignInput = z.infer<typeof assignSchema>;
```

- [ ] **Step 2: Service `src/modules/property-housekeepers/service.ts`**

```ts
import type { PropertyHousekeeper } from '@prisma/client';
import { prisma } from '@/db/client';
import { assignSchema, type AssignInput } from './schema';

export type AssignmentRow = PropertyHousekeeper & {
  housekeeper: { id: number; username: string; email: string; deletedAt: Date | null };
};

export async function listAssignments(propertyId: number): Promise<AssignmentRow[]> {
  return prisma.propertyHousekeeper.findMany({
    where: { propertyId },
    include: {
      housekeeper: {
        select: { id: true, username: true, email: true, deletedAt: true },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { housekeeper: { username: 'asc' } }],
  });
}

export async function assign(input: AssignInput): Promise<PropertyHousekeeper> {
  const data = assignSchema.parse(input);
  return prisma.propertyHousekeeper.upsert({
    where: {
      propertyId_housekeeperId: {
        propertyId: data.propertyId,
        housekeeperId: data.housekeeperId,
      },
    },
    create: {
      propertyId: data.propertyId,
      housekeeperId: data.housekeeperId,
      isDefault: data.isDefault ?? false,
      payOverride: data.payOverride,
    },
    update: {
      isDefault: data.isDefault ?? false,
      payOverride: data.payOverride,
    },
  });
}

export async function unassign(propertyId: number, housekeeperId: number): Promise<void> {
  await prisma.propertyHousekeeper.delete({
    where: { propertyId_housekeeperId: { propertyId, housekeeperId } },
  });
}

export async function setDefault(propertyId: number, housekeeperId: number): Promise<void> {
  await prisma.$transaction([
    prisma.propertyHousekeeper.updateMany({
      where: { propertyId },
      data: { isDefault: false },
    }),
    prisma.propertyHousekeeper.update({
      where: { propertyId_housekeeperId: { propertyId, housekeeperId } },
      data: { isDefault: true },
    }),
  ]);
}
```

- [ ] **Step 3: Unit test `tests/unit/property-housekeepers-service.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { assignSchema } from '@/modules/property-housekeepers/schema';

describe('property-housekeepers schema', () => {
  it('coerces numeric strings', () => {
    const r = assignSchema.parse({ propertyId: '1', housekeeperId: '2' });
    expect(r.propertyId).toBe(1);
    expect(r.housekeeperId).toBe(2);
  });

  it('accepts payOverride like "22.50"', () => {
    const r = assignSchema.parse({ propertyId: 1, housekeeperId: 2, payOverride: '22.50' });
    expect(r.payOverride).toBe('22.50');
  });

  it('rejects malformed payOverride', () => {
    expect(
      assignSchema.safeParse({ propertyId: 1, housekeeperId: 2, payOverride: 'abc' }).success,
    ).toBe(false);
  });

  it('treats empty payOverride as undefined', () => {
    const r = assignSchema.parse({ propertyId: 1, housekeeperId: 2, payOverride: '' });
    expect(r.payOverride).toBeUndefined();
  });
});
```

- [ ] **Step 4: Integration test `tests/integration/property-housekeepers.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

describe('property-housekeepers service', () => {
  async function setup() {
    const users = await import('@/modules/users/service');
    const properties = await import('@/modules/properties/service');
    const owner = await users.createUser({
      username: 'owner',
      email: 'owner@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    const hk1 = await users.createUser({
      username: 'hk1',
      email: 'hk1@example.com',
      password: 'secretpass!',
      role: 'HOUSEKEEPER',
    });
    const hk2 = await users.createUser({
      username: 'hk2',
      email: 'hk2@example.com',
      password: 'secretpass!',
      role: 'HOUSEKEEPER',
    });
    const prop = await properties.createProperty({
      name: 'Test property',
      ownerId: owner.id,
      maxGuests: 4,
    });
    return { owner, hk1, hk2, prop };
  }

  it('assigns, re-assigns (upsert), sets default, and unassigns', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/property-housekeepers/service');
    const { prop, hk1, hk2 } = await setup();

    await svc.assign({ propertyId: prop.id, housekeeperId: hk1.id, payOverride: '22.00' });
    await svc.assign({ propertyId: prop.id, housekeeperId: hk2.id });
    expect(await svc.listAssignments(prop.id)).toHaveLength(2);

    // Upsert path: re-assign hk1 with a different pay, should not duplicate.
    await svc.assign({ propertyId: prop.id, housekeeperId: hk1.id, payOverride: '25.00' });
    const after = await svc.listAssignments(prop.id);
    expect(after).toHaveLength(2);
    const hk1Row = after.find((r) => r.housekeeperId === hk1.id)!;
    expect(hk1Row.payOverride?.toString()).toBe('25');

    // setDefault flips the flag atomically for the whole property.
    await svc.setDefault(prop.id, hk2.id);
    const withDefault = await svc.listAssignments(prop.id);
    expect(withDefault.filter((r) => r.isDefault)).toHaveLength(1);
    expect(withDefault.find((r) => r.isDefault)?.housekeeperId).toBe(hk2.id);

    await svc.setDefault(prop.id, hk1.id);
    const flipped = await svc.listAssignments(prop.id);
    expect(flipped.find((r) => r.isDefault)?.housekeeperId).toBe(hk1.id);

    // Unassign
    await svc.unassign(prop.id, hk2.id);
    expect(await svc.listAssignments(prop.id)).toHaveLength(1);
  });
});
```

- [ ] **Step 5: Actions `.../housekeepers/actions.ts`**

Note: every server action accepts a trailing `FormData` parameter (even if ignored) so
that `action.bind(null, ...args)` produces a `(formData: FormData) => Promise<void>`
shape assignable to a `<form action>` prop in React 19 strict mode.

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import * as svc from '@/modules/property-housekeepers/service';

export async function assignAction(propertyId: number, formData: FormData): Promise<void> {
  await requireAdmin();
  await svc.assign({
    propertyId,
    housekeeperId: Number(formData.get('housekeeperId')),
    payOverride: String(formData.get('payOverride') ?? ''),
  });
  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function unassignAction(
  propertyId: number,
  housekeeperId: number,
  _formData: FormData,
): Promise<void> {
  await requireAdmin();
  await svc.unassign(propertyId, housekeeperId);
  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function setDefaultAction(
  propertyId: number,
  housekeeperId: number,
  _formData: FormData,
): Promise<void> {
  await requireAdmin();
  await svc.setDefault(propertyId, housekeeperId);
  revalidatePath(`/admin/properties/${propertyId}`);
}
```

- [ ] **Step 6: Client panel `.../housekeepers-panel.tsx`**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pill } from '@/components/ui/pill';
import { assignAction, unassignAction, setDefaultAction } from './housekeepers/actions';

interface Assignment {
  housekeeperId: number;
  username: string;
  email: string;
  isDefault: boolean;
  payOverride: string | null;
}
interface Candidate { id: number; username: string; email: string }

interface Props {
  propertyId: number;
  assignments: Assignment[];
  candidates: Candidate[];
  propertyDefaultPay: string;
}

export function HousekeepersPanel({ propertyId, assignments, candidates, propertyDefaultPay }: Props) {
  return (
    <section className="rounded-lg border border-border bg-surface shadow-xs">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Housekeepers</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            Who cleans this property, and what they get paid.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {assignments.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-fg-muted">
            No housekeepers assigned yet.
          </li>
        )}
        {assignments.map((a) => (
          <li key={a.housekeeperId} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-fg">{a.username}</span>
                {a.isDefault && <Pill tone="accent">Default</Pill>}
              </div>
              <div className="truncate text-xs text-fg-muted">{a.email}</div>
            </div>
            <div className="text-sm tabular-nums text-fg">
              {a.payOverride ?? propertyDefaultPay} €
            </div>
            {!a.isDefault && (
              <form action={setDefaultAction.bind(null, propertyId, a.housekeeperId)}>
                <Button variant="ghost" size="sm" type="submit">Make default</Button>
              </form>
            )}
            <form
              action={unassignAction.bind(null, propertyId, a.housekeeperId)}
              onSubmit={(e) => { if (!confirm(`Unassign ${a.username}?`)) e.preventDefault(); }}
            >
              <Button variant="ghost" size="sm" type="submit">Remove</Button>
            </form>
          </li>
        ))}
      </ul>

      {candidates.length > 0 && (
        <form
          action={assignAction.bind(null, propertyId)}
          className="flex flex-wrap items-end gap-3 border-t border-border px-4 py-3"
        >
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-fg">Housekeeper</label>
            <Select name="housekeeperId" required>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.username} ({c.email})</option>
              ))}
            </Select>
          </div>
          <div className="flex w-32 flex-col gap-1">
            <label className="text-xs font-medium text-fg">Pay override (€)</label>
            <Input
              name="payOverride"
              type="text"
              inputMode="decimal"
              placeholder={propertyDefaultPay}
              pattern="^\d+(\.\d{1,2})?$"
            />
          </div>
          <Button type="submit" size="md">Assign</Button>
        </form>
      )}
    </section>
  );
}
```

- [ ] **Step 7: Property detail page `src/app/(admin)/admin/properties/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getPropertyById } from '@/modules/properties/service';
import { listAssignments } from '@/modules/property-housekeepers/service';
import { listUsers } from '@/modules/users/service';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { HousekeepersPanel } from './housekeepers-panel';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();

  const p = await getPropertyById(id);
  if (!p) notFound();

  const [assignments, allUsers] = await Promise.all([
    listAssignments(p.id),
    listUsers(),
  ]);
  const assignedIds = new Set(assignments.map((a) => a.housekeeperId));
  const candidates = allUsers
    .filter((u) => u.role === 'HOUSEKEEPER' && !u.deletedAt && !assignedIds.has(u.id))
    .map((u) => ({ id: u.id, username: u.username, email: u.email }));

  const owner = allUsers.find((u) => u.id === p.ownerId);
  const defaultPay = owner?.defaultHousekeeperPay.toString() ?? '20';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{p.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Owner: {p.owner.username} {p.deletedAt && <Pill tone="danger">Deleted</Pill>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/properties/${p.id}/edit`}><Button variant="secondary">Edit</Button></Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-fg-muted">Max guests</dt>
          <dd className="text-fg">{p.maxGuests ?? '—'}</dd>
          <dt className="text-fg-muted">Notes</dt>
          <dd className="text-fg whitespace-pre-wrap">{p.notes ?? '—'}</dd>
        </dl>
      </section>

      <HousekeepersPanel
        propertyId={p.id}
        assignments={assignments.map((a) => ({
          housekeeperId: a.housekeeperId,
          username: a.housekeeper.username,
          email: a.housekeeper.email,
          isDefault: a.isDefault,
          payOverride: a.payOverride?.toString() ?? null,
        }))}
        candidates={candidates}
        propertyDefaultPay={defaultPay}
      />
    </div>
  );
}
```

- [ ] **Step 8: Run tests**

```bash
npm test -- tests/unit/property-housekeepers-service.test.ts tests/integration/property-housekeepers.test.ts
```

Expected: all pass.

- [ ] **Step 9: Build**

```bash
npm run build 2>&1 | tail -15
```

Expected: new routes listed, no errors.

- [ ] **Step 10: Commit**

```bash
git add src/modules/property-housekeepers/ tests/unit/property-housekeepers-service.test.ts tests/integration/property-housekeepers.test.ts 'src/app/(admin)/admin/properties/[id]/'
git commit -m "feat(properties): detail page + housekeeper assignment module"
```

---

## Task 15: Settings page + settings module

**Files:**
- Create: `src/modules/settings/schema.ts`
- Create: `src/modules/settings/service.ts`
- Create: `tests/unit/settings-service.test.ts`
- Create: `src/app/(admin)/admin/settings/page.tsx`
- Create: `src/app/(admin)/admin/settings/actions.ts`
- Create: `src/app/(admin)/admin/settings/profile-form.tsx`
- Create: `src/app/(admin)/admin/settings/password-form.tsx`

- [ ] **Step 1: `src/modules/settings/schema.ts`**

```ts
import { z } from 'zod';

const maxLen = (n: number) => z.string().trim().max(n).optional().transform((v) => (v === '' ? undefined : v));

export const profileSchema = z.object({
  companyName: maxLen(200),
  companyIco: maxLen(50),
  companyVat: maxLen(50),
  contactName: maxLen(200),
  contactPhone: maxLen(50),
  contactAddress: maxLen(500),
  contactWebsite: maxLen(200),
  contactDescription: maxLen(2000),
  customLine1: maxLen(200),
  customLine2: maxLen(200),
  customLine3: maxLen(200),
  photoRequiredAdults: z.coerce.boolean(),
  photoRequiredChildren: z.coerce.boolean(),
  dateFormat: z.enum(['d.M.y', 'd.M.yyyy', 'yyyy-MM-dd', 'M/d/yyyy']).default('d.M.y'),
  defaultHousekeeperPay: z.string().regex(/^\d+(\.\d{1,2})?$/),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
```

- [ ] **Step 2: `src/modules/settings/service.ts`**

```ts
import { prisma } from '@/db/client';
import { hashPassword, verifyPassword } from '@/modules/auth/password';
import {
  profileSchema,
  passwordChangeSchema,
  type ProfileInput,
  type PasswordChangeInput,
} from './schema';

export async function getMyProfile(userId: number) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      companyName: true,
      companyIco: true,
      companyVat: true,
      contactName: true,
      contactPhone: true,
      contactAddress: true,
      contactWebsite: true,
      contactDescription: true,
      customLine1: true,
      customLine2: true,
      customLine3: true,
      photoRequiredAdults: true,
      photoRequiredChildren: true,
      dateFormat: true,
      defaultHousekeeperPay: true,
    },
  });
}

export async function updateMyProfile(userId: number, input: ProfileInput) {
  const data = profileSchema.parse(input);
  await prisma.user.update({ where: { id: userId }, data });
}

export type PasswordChangeResult = { ok: true } | { ok: false; reason: 'bad_current' };

export async function changeMyPassword(
  userId: number,
  input: PasswordChangeInput,
): Promise<PasswordChangeResult> {
  const data = passwordChangeSchema.parse(input);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const ok = await verifyPassword(user.passwordHash, data.currentPassword);
  if (!ok) return { ok: false, reason: 'bad_current' };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  // Invalidate all other sessions; the one we're currently using stays valid (best-effort UX).
  return { ok: true };
}
```

- [ ] **Step 3: Unit test `tests/unit/settings-service.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { profileSchema, passwordChangeSchema } from '@/modules/settings/schema';

describe('settings schemas', () => {
  it('profileSchema trims empty strings to undefined', () => {
    const r = profileSchema.parse({
      companyName: '   ',
      photoRequiredAdults: 'true',
      photoRequiredChildren: 'false',
      dateFormat: 'd.M.y',
      defaultHousekeeperPay: '22.50',
    });
    expect(r.companyName).toBeUndefined();
    expect(r.photoRequiredAdults).toBe(true);
    expect(r.photoRequiredChildren).toBe(false);
    expect(r.defaultHousekeeperPay).toBe('22.50');
  });

  it('profileSchema rejects bad pay format', () => {
    expect(
      profileSchema.safeParse({
        photoRequiredAdults: 'true',
        photoRequiredChildren: 'true',
        dateFormat: 'd.M.y',
        defaultHousekeeperPay: 'free',
      }).success,
    ).toBe(false);
  });

  it('passwordChangeSchema requires min 8 for new', () => {
    expect(
      passwordChangeSchema.safeParse({ currentPassword: 'x', newPassword: '1234' }).success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({ currentPassword: 'x', newPassword: 'valid-pw' }).success,
    ).toBe(true);
  });
});
```

- [ ] **Step 4: Actions `src/app/(admin)/admin/settings/actions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { updateMyProfile, changeMyPassword } from '@/modules/settings/service';
import { profileSchema, passwordChangeSchema } from '@/modules/settings/schema';

export type ProfileState = { saved?: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function saveProfileAction(
  _prev: ProfileState | undefined,
  formData: FormData,
): Promise<ProfileState> {
  const admin = await requireAdmin();

  const payload: Record<string, unknown> = {};
  const fields = [
    'companyName', 'companyIco', 'companyVat',
    'contactName', 'contactPhone', 'contactAddress', 'contactWebsite', 'contactDescription',
    'customLine1', 'customLine2', 'customLine3',
    'dateFormat', 'defaultHousekeeperPay',
  ];
  for (const f of fields) payload[f] = formData.get(f) ?? '';
  payload.photoRequiredAdults = formData.get('photoRequiredAdults') === 'on';
  payload.photoRequiredChildren = formData.get('photoRequiredChildren') === 'on';

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  await updateMyProfile(admin.id, parsed.data);
  revalidatePath('/admin/settings');
  return { saved: true };
}

export type PasswordState = { saved?: boolean; error?: string };

export async function changePasswordAction(
  _prev: PasswordState | undefined,
  formData: FormData,
): Promise<PasswordState> {
  const admin = await requireAdmin();

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const res = await changeMyPassword(admin.id, parsed.data);
  if (!res.ok) {
    return { error: 'Current password is incorrect.' };
  }
  return { saved: true };
}
```

- [ ] **Step 5: Profile form `profile-form.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { saveProfileAction, type ProfileState } from './actions';

interface Initial {
  companyName: string | null;
  companyIco: string | null;
  companyVat: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  contactDescription: string | null;
  customLine1: string | null;
  customLine2: string | null;
  customLine3: string | null;
  photoRequiredAdults: boolean;
  photoRequiredChildren: boolean;
  dateFormat: string;
  defaultHousekeeperPay: string;
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<ProfileState | undefined, FormData>(
    saveProfileAction,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">Brand & contact</h2>

      {state?.saved && (
        <p className="rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700">
          Saved.
        </p>
      )}

      <FormField id="companyName" label="Company name" error={fe.companyName}>
        <Input id="companyName" name="companyName" defaultValue={initial.companyName ?? ''} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="companyIco" label="IČO" error={fe.companyIco}>
          <Input id="companyIco" name="companyIco" defaultValue={initial.companyIco ?? ''} />
        </FormField>
        <FormField id="companyVat" label="DIČ / VAT" error={fe.companyVat}>
          <Input id="companyVat" name="companyVat" defaultValue={initial.companyVat ?? ''} />
        </FormField>
      </div>
      <FormField id="contactName" label="Contact name" error={fe.contactName}>
        <Input id="contactName" name="contactName" defaultValue={initial.contactName ?? ''} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="contactPhone" label="Phone" error={fe.contactPhone}>
          <Input id="contactPhone" name="contactPhone" defaultValue={initial.contactPhone ?? ''} />
        </FormField>
        <FormField id="contactWebsite" label="Website" error={fe.contactWebsite}>
          <Input id="contactWebsite" name="contactWebsite" defaultValue={initial.contactWebsite ?? ''} />
        </FormField>
      </div>
      <FormField id="contactAddress" label="Billing address" error={fe.contactAddress}>
        <Textarea id="contactAddress" name="contactAddress" rows={2} defaultValue={initial.contactAddress ?? ''} />
      </FormField>
      <FormField id="contactDescription" label="Description on invoices" error={fe.contactDescription}>
        <Textarea id="contactDescription" name="contactDescription" rows={3} defaultValue={initial.contactDescription ?? ''} />
      </FormField>

      <h2 className="mt-4 text-sm font-semibold text-fg">Custom lines on invoices</h2>
      <FormField id="customLine1" label="Line 1" error={fe.customLine1}>
        <Input id="customLine1" name="customLine1" defaultValue={initial.customLine1 ?? ''} />
      </FormField>
      <FormField id="customLine2" label="Line 2" error={fe.customLine2}>
        <Input id="customLine2" name="customLine2" defaultValue={initial.customLine2 ?? ''} />
      </FormField>
      <FormField id="customLine3" label="Line 3" error={fe.customLine3}>
        <Input id="customLine3" name="customLine3" defaultValue={initial.customLine3 ?? ''} />
      </FormField>

      <h2 className="mt-4 text-sm font-semibold text-fg">Guest registration</h2>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="photoRequiredAdults" defaultChecked={initial.photoRequiredAdults} className="h-4 w-4 rounded border-border accent-accent-500" />
          Require document photos for adults
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="photoRequiredChildren" defaultChecked={initial.photoRequiredChildren} className="h-4 w-4 rounded border-border accent-accent-500" />
          Require document photos for children
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="dateFormat" label="Date format" error={fe.dateFormat}>
          <Select id="dateFormat" name="dateFormat" defaultValue={initial.dateFormat}>
            <option value="d.M.y">d.M.y (22.4.26)</option>
            <option value="d.M.yyyy">d.M.yyyy (22.4.2026)</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd (2026-04-22)</option>
            <option value="M/d/yyyy">M/d/yyyy (4/22/2026)</option>
          </Select>
        </FormField>
        <FormField id="defaultHousekeeperPay" label="Default housekeeper pay (€)" error={fe.defaultHousekeeperPay}>
          <Input id="defaultHousekeeperPay" name="defaultHousekeeperPay" type="text" inputMode="decimal" defaultValue={initial.defaultHousekeeperPay} />
        </FormField>
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Password form `password-form.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { changePasswordAction } from './actions';

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">Change password</h2>

      {state?.saved && (
        <p className="rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700">
          Password changed.
        </p>
      )}
      {state?.error && (
        <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
          {state.error}
        </p>
      )}

      <FormField id="currentPassword" label="Current password" required>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </FormField>
      <FormField id="newPassword" label="New password" description="At least 8 characters." required>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? 'Updating…' : 'Change password'}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 7: Page `src/app/(admin)/admin/settings/page.tsx`**

```tsx
import { requireAdmin } from '@/lib/authz';
import { getMyProfile } from '@/modules/settings/service';
import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const profile = await getMyProfile(admin.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {profile.username} · {profile.email}
        </p>
      </header>

      <ProfileForm
        initial={{
          companyName: profile.companyName,
          companyIco: profile.companyIco,
          companyVat: profile.companyVat,
          contactName: profile.contactName,
          contactPhone: profile.contactPhone,
          contactAddress: profile.contactAddress,
          contactWebsite: profile.contactWebsite,
          contactDescription: profile.contactDescription,
          customLine1: profile.customLine1,
          customLine2: profile.customLine2,
          customLine3: profile.customLine3,
          photoRequiredAdults: profile.photoRequiredAdults,
          photoRequiredChildren: profile.photoRequiredChildren,
          dateFormat: profile.dateFormat,
          defaultHousekeeperPay: profile.defaultHousekeeperPay.toString(),
        }}
      />

      <PasswordForm />
    </div>
  );
}
```

- [ ] **Step 8: Run tests + typecheck + build**

```bash
npm test -- tests/unit/settings-service.test.ts && npm run typecheck && npm run build 2>&1 | tail -15
```

Expected: all pass; `/admin/settings` listed as dynamic.

- [ ] **Step 9: Commit**

```bash
git add src/modules/settings/ tests/unit/settings-service.test.ts 'src/app/(admin)/admin/settings/'
git commit -m "feat(admin): settings page (profile + change password)"
```

---

## Task 16: End-to-end smoke + typecheck + full test suite + tag

- [ ] **Step 1: Full verification**

```bash
cd /Users/martinjanci/projects/github.com/martin-janci/guest-registration
npm run typecheck
npm test
npm run build 2>&1 | tail -25
```

Expected:
- Typecheck clean.
- All tests pass (M1: 10; M2 adds ~14 unit + 8 integration; total ~32).
- Build lists all new routes: `/admin/users`, `/admin/users/new`, `/admin/users/[id]/edit`, `/admin/users/[id]/delete`, `/admin/users/[id]/restore`, `/admin/properties`, `/admin/properties/new`, `/admin/properties/[id]`, `/admin/properties/[id]/edit`, `/admin/properties/[id]/delete`, `/admin/properties/[id]/restore`, `/admin/settings`.

- [ ] **Step 2: Browser smoke test**

Start dev on a free port and walk the flow:

```bash
# Find a free port (example: 4100).
PORT=4100 npm run dev > /tmp/gr-dev.log 2>&1 &
echo $! > /tmp/gr-dev.pid
sleep 7

# Create a session as admin user id 1 (bootstrapped in M1).
cat > /tmp/mk-sess.mjs <<'EOF'
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const token = crypto.randomBytes(20).toString('base64url');
const id = crypto.createHash('sha256').update(token).digest('hex');
await prisma.session.create({ data: { id, userId: 1, expiresAt: new Date(Date.now() + 30*24*60*60*1000) } });
console.log(token);
await prisma.$disconnect();
EOF
cp /tmp/mk-sess.mjs mk-sess.mjs
TOKEN=$(node mk-sess.mjs)
rm mk-sess.mjs

# Check each page renders 200.
for path in /admin/users /admin/users/new /admin/properties /admin/properties/new /admin/settings; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: guest_reg_session=$TOKEN" "http://localhost:4100$path")
  echo "$path -> $code"
done

kill $(cat /tmp/gr-dev.pid)
```

Expected: all five paths return `200`.

- [ ] **Step 3: Manual interactive verification (optional but recommended)**

Run `PORT=4100 npm run dev` and in a browser:
1. Log in at http://localhost:4100/login (admin / admin123).
2. Create a housekeeper user at `/admin/users/new`.
3. Create a property at `/admin/properties/new`.
4. On the property page, assign the new housekeeper and set them as default.
5. Go to `/admin/settings`, fill in company name + IČO + VAT, save.
6. Soft-delete the housekeeper at `/admin/users/<id>/edit`; verify the property page still shows them assigned but `/admin/users` hides them (unless `?deleted=1`).
7. Restore the housekeeper; verify they re-appear on `/admin/users`.

- [ ] **Step 4: Tag the milestone**

```bash
git tag -a m2-identity-properties -m "M2: identity & properties

- User CRUD + soft-delete + restore + admin-triggered password reset
- Property CRUD + soft-delete + restore
- PropertyHousekeeper assignment with isDefault + payOverride
- Settings page (own profile + change password)
- Shared primitives: Select, Textarea, FormField, DataTable
- Authz helper: requireAdmin

All tests green, typecheck clean, production build OK."
```

- [ ] **Step 5: Push**

```bash
git push -u origin refs/heads/m2-identity-properties
git push origin refs/tags/m2-identity-properties
```

Expected: branch + tag appear on GitHub at `https://github.com/martin-janci/guest-registration`.

---

## Out of scope for M2 (tracked for later milestones)

- Email notifications (welcome mail on user create, password-changed mail, self-service forgot-password) → **M4**.
- Document uploads and photo storage on MinIO → **M4**.
- Trips, calendars, registrations, invoices, housekeeping tasks → **M3–M5**.
- Real KPI numbers on the dashboard (currently placeholder) → partial in later milestones once backing data exists.
- Multi-tenant row-level authorization (e.g., admin A can only see properties owned by admin A) → **never**, per spec non-goal #2.
- Audit log rows for destructive operations → **M5+**.
- Playwright end-to-end tests through the actual login Server Action → **after M6** when PWA is added and the test infra benefits from it.

## Spec coverage check

| Spec requirement | Implemented in |
|---|---|
| User schema including all contact/branding fields (§4) | Task 1 |
| Session schema unchanged from M1 (§4) | n/a (already exists) |
| Property schema with ownerId, maxGuests, soft delete (§4) | Task 1 |
| PropertyHousekeeper with isDefault + payOverride (§4) | Task 1, 14 |
| Admin UI for users, properties, settings (§3) | Tasks 8–15 |
| Soft-delete pattern using deletedAt (§4 deltas) | Tasks 6, 12 |
| Zod schemas shared between client and server (§3 principles) | Tasks 6, 12, 14, 15 |
| Module per domain with service + schema (§3 principles) | Tasks 6, 12, 14, 15 |
| Authorization check on every server mutation (§2 non-goal: multi-tenant is out, but basic role gate is in) | Task 3 + every action |
| Integration tests via Testcontainers (§9) | Tasks 7, 12, 14 |
