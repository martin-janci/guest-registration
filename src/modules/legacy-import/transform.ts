import type {
  Prisma,
  UserRole,
  TripSource,
  RegistrationStatus,
  AgeCategory,
  DocumentType,
  InvoiceStatus,
  HousekeepingStatus,
} from '@prisma/client';

// pg parses DATE columns as local-midnight Date objects, which shifts by the
// host's UTC offset. Reconstruct at UTC midnight so imported values round-
// trip identically regardless of the container's timezone.
function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

type LegacyUser = {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  role: string;
  is_deleted: boolean;
  created_at: Date;
};

export function mapUser(row: LegacyUser): Prisma.UserCreateInput {
  const role: UserRole =
    row.role === 'superadmin' ? 'ADMIN' : (row.role.toUpperCase() as UserRole);
  return {
    username: row.username,
    email: row.email ?? `${row.username}@imported.local`,
    passwordHash: row.password_hash, // legacy hash — users must reset on first login
    role,
    deletedAt: row.is_deleted ? row.created_at : null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Property  (legacy table: amenity)
// ---------------------------------------------------------------------------

type LegacyAmenity = {
  id: number;
  name: string;
  admin_id: number | null;
  is_deleted: boolean;
  created_at: Date;
};

export function mapProperty(
  row: LegacyAmenity,
  ownerId: number,
): Prisma.PropertyCreateInput {
  return {
    name: row.name,
    owner: { connect: { id: ownerId } },
    deletedAt: row.is_deleted ? row.created_at : null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

type LegacyCalendar = {
  id: number;
  amenity_id: number;
  name: string | null;
  ics_url: string;
  sync_interval: number | null;
  last_synced_at: Date | null;
  created_at: Date;
};

export function mapCalendar(
  row: LegacyCalendar,
  propertyId: number,
): Prisma.CalendarCreateInput {
  return {
    property: { connect: { id: propertyId } },
    name: row.name ?? row.ics_url,
    icsUrl: row.ics_url,
    syncIntervalMin: row.sync_interval ?? 60,
    lastSyncedAt: row.last_synced_at ?? null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Trip
// Note: Trip has no deletedAt in schema. TripSource values: MANUAL | AIRBNB_ICS | WEBHOOK
// ---------------------------------------------------------------------------

type LegacyTrip = {
  id: number;
  title: string;
  amenity_id: number;
  admin_id: number;
  start_date: Date;
  end_date: Date;
  max_guests: number | null;
  source: string;
  external_reservation_id: string | null;
  external_confirm_code: string | null;
  external_guest_name: string | null;
  created_at: Date;
};

export function mapTrip(
  row: LegacyTrip,
  propertyId: number,
  adminId: number,
): Prisma.TripCreateInput {
  const srcUpper = row.source.toUpperCase();
  const source: TripSource =
    srcUpper === 'AIRBNB' || srcUpper === 'AIRBNB_ICS' ? 'AIRBNB_ICS' : 'MANUAL';
  return {
    title: row.title,
    property: { connect: { id: propertyId } },
    admin: { connect: { id: adminId } },
    startDate: row.start_date,
    endDate: row.end_date,
    maxGuests: row.max_guests ?? 1,
    source,
    externalReservationId: row.external_reservation_id ?? null,
    externalConfirmCode: row.external_confirm_code ?? null,
    externalGuestName: row.external_guest_name ?? null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Registration
// Note: Registration requires email; schema has no gdprConsent field.
// ---------------------------------------------------------------------------

type LegacyReg = {
  id: number;
  trip_id: number;
  email: string | null;
  status: string;
  submitted_at: Date;
};

export function mapRegistration(
  row: LegacyReg,
  tripId: number,
): Prisma.RegistrationCreateInput {
  const status: RegistrationStatus = row.status.toUpperCase() as RegistrationStatus;
  return {
    trip: { connect: { id: tripId } },
    email: row.email ?? 'unknown@imported.local',
    status,
    submittedAt: row.submitted_at,
  };
}

// ---------------------------------------------------------------------------
// Guest
// documentType and documentNumber are required (non-nullable) in schema.
// gdprConsent is copied from the parent Registration's legacy value.
// dateOfBirth and nationality are nullable — carried over when the legacy
// row has them (Slovak UBYREG reporting requires both).
// ---------------------------------------------------------------------------

type LegacyGuest = {
  id: number;
  registration_id: number;
  first_name: string;
  last_name: string;
  age_category: string;
  document_type: string | null;
  document_number: string | null;
  date_of_birth?: Date | null;
  nationality?: string | null;
};

export function mapGuest(
  row: LegacyGuest,
  registrationId: number,
  gdprConsent: boolean,
): Prisma.GuestCreateInput {
  const age: AgeCategory = row.age_category.toUpperCase() as AgeCategory;
  const mapDocType = (raw: string): DocumentType => {
    const up = raw.toUpperCase();
    if (up === 'IDCARD' || up === 'ID_CARD' || up === 'CITIZEN_ID') return 'CITIZEN_ID';
    if (up === 'DRIVING_LICENSE' || up === 'DRIVING' || up === 'DRIVER') return 'DRIVING_LICENSE';
    return 'PASSPORT'; // default for 'PASSPORT' and any unknown legacy values
  };
  const doc: DocumentType = row.document_type ? mapDocType(row.document_type) : 'CITIZEN_ID';
  return {
    registration: { connect: { id: registrationId } },
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth ? toUtcMidnight(row.date_of_birth) : null,
    nationality: row.nationality ?? null,
    ageCategory: age,
    documentType: doc,
    documentNumber: row.document_number ?? '',
    gdprConsent,
    // documentImageKey is filled after upload (task 4)
  };
}

// ---------------------------------------------------------------------------
// Invoice
// Note: schema uses issueDate (@db.Date), subtotal + vatTotal + totalAmount;
//       no clientIco/clientDic/clientIcDph/deliveredAt/issuedAt fields.
// ---------------------------------------------------------------------------

type LegacyInvoice = {
  id: number;
  admin_id: number;
  invoice_number: string;
  client_name: string;
  client_address: string | null;
  // Legacy dumps do not carry client_email / client_vat_number columns;
  // they are omitted from the legacy schema — default to null.
  currency: string;
  // Legacy column is `issued_at` (not `issue_date`).
  issued_at: Date;
  due_date: Date | null;
  status: string;
  notes: string | null;
  // Legacy dump has only total_amount; subtotal/vat_total are absent.
  total_amount: string;
  created_at: Date;
};

export function mapInvoice(
  row: LegacyInvoice,
  adminId: number,
): Prisma.InvoiceCreateInput {
  const status: InvoiceStatus = row.status.toUpperCase() as InvoiceStatus;
  return {
    admin: { connect: { id: adminId } },
    invoiceNumber: row.invoice_number,
    clientName: row.client_name,
    clientAddress: row.client_address ?? null,
    clientEmail: null,
    clientVatNumber: null,
    currency: row.currency,
    issueDate: row.issued_at,
    dueDate: row.due_date ?? null,
    status,
    notes: row.notes ?? null,
    // Legacy has no separate subtotal/vatTotal — set both to 0 and carry the
    // total as-is; the verify pass checks sum(items) ≈ totalAmount instead.
    subtotal: '0',
    vatTotal: '0',
    totalAmount: row.total_amount,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// InvoiceItem
// ---------------------------------------------------------------------------

type LegacyItem = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: string;
  unit_price: string;
  vat_rate: string;
  total_with_vat: string;
  position: number;
};

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

// ---------------------------------------------------------------------------
// HousekeepingTask
// Note: schema has no property relation on HousekeepingTask.
//       housekeeperId is required (NOT NULL) in schema.
//       field is `date` (not serviceDate).
// ---------------------------------------------------------------------------

type LegacyHK = {
  id: number;
  trip_id: number;
  housekeeper_id: number;
  service_date: Date;
  status: string;
  pay_amount: string | null;
  paid: boolean;
  started_at: Date | null;
  completed_at: Date | null;
  notes: string | null;
};

export function mapHousekeeping(
  row: LegacyHK,
  tripId: number,
  housekeeperId: number,
): Prisma.HousekeepingTaskCreateInput {
  const status: HousekeepingStatus = row.status.toUpperCase() as HousekeepingStatus;
  return {
    trip: { connect: { id: tripId } },
    housekeeper: { connect: { id: housekeeperId } },
    date: row.service_date,
    status,
    payAmount: row.pay_amount ?? '0',
    paid: row.paid,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    notes: row.notes ?? null,
  };
}
