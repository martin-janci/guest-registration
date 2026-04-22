import { Link } from '@/lib/i18n/link';
import { redirect } from '@/lib/i18n/link';
import { getTripByConfirmCode, countSubmissionsForTrip } from '@/modules/registrations/service';
import { RegisterForm } from './form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function RegisterPage({ params }: PageProps) {
  const { code } = await params;
  const trip = await getTripByConfirmCode(code);
  if (!trip) return await redirect(`/register/${code}/invalid`);

  const existing = await countSubmissionsForTrip(trip.id);
  if (existing > 0) return await redirect(`/register/${code}/success?existing=1`);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Guest registration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">{trip.property.name}</h1>
      </header>

      <RegisterForm
        tripId={trip.id}
        tripTitle={trip.title}
        propertyName={trip.property.name}
        maxGuests={trip.maxGuests}
      />

      <footer className="border-t border-border pt-4 text-xs text-fg-subtle">
        <Link href="/gdpr" className="text-accent-600 hover:text-accent-700">Data processing notice</Link>
      </footer>
    </main>
  );
}
