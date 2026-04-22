import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
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
