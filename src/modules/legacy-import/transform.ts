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
// Note: documentType and documentNumber are required (non-nullable) in schema.
// Schema has no dateOfBirth or nationality fields.
// ---------------------------------------------------------------------------

type LegacyGuest = {
  id: number;
  registration_id: number;
  first_name: string;
  last_name: string;
  age_category: string;
  document_type: string | null;
  document_number: string | null;
};

export function mapGuest(
  row: LegacyGuest,
  registrationId: number,
): Prisma.GuestCreateInput {
  const age: AgeCategory = row.age_category.toUpperCase() as AgeCategory;
  const doc: DocumentType = row.document_type
    ? (row.document_type.toUpperCase() as DocumentType)
    : 'CITIZEN_ID';
  return {
    registration: { connect: { id: registrationId } },
    firstName: row.first_name,
    lastName: row.last_name,
    ageCategory: age,
    documentType: doc,
    documentNumber: row.document_number ?? '',
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
  client_email: string | null;
  client_vat_number: string | null;
  currency: string;
  issue_date: Date;
  due_date: Date | null;
  status: string;
  notes: string | null;
  subtotal: string;
  vat_total: string;
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
    clientEmail: row.client_email ?? null,
    clientVatNumber: row.client_vat_number ?? null,
    currency: row.currency,
    issueDate: row.issue_date,
    dueDate: row.due_date ?? null,
    status,
    notes: row.notes ?? null,
    subtotal: row.subtotal,
    vatTotal: row.vat_total,
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
