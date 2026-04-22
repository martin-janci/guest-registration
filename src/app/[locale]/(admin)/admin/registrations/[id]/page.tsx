import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getRegistrationById } from '@/modules/registrations/service';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { DocumentImage } from '@/components/admin/document-image';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function statusTone(s: 'PENDING' | 'APPROVED' | 'REJECTED') {
  if (s === 'APPROVED') return 'success' as const;
  if (s === 'REJECTED') return 'danger' as const;
  return 'warning' as const;
}

export default async function RegistrationDetailPage({ params }: PageProps) {
  await requireAdmin();
  const t = await getTranslations('admin.registrations');
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const reg = await getRegistrationById(id);
  if (!reg) notFound();

  const pending = reg.status === 'PENDING';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{t('detail.eyebrow', { id: reg.id })}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
            <Link href={`/admin/trips/${reg.trip.id}`} className="hover:text-accent-700">{reg.trip.title}</Link>
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {reg.trip.property.name} · {reg.email} · {reg.guests.length} {t('detail.guestCount', { count: reg.guests.length })}
          </p>
        </div>
        <Pill tone={statusTone(reg.status)}>{t(`status.${reg.status}`)}</Pill>
      </header>

      <section className="flex flex-col gap-6">
        {reg.guests.map((g, i) => (
          <div key={g.id} className="rounded-lg border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-fg">
                  {t('detail.guestHeading', { number: i + 1, name: `${g.firstName} ${g.lastName}` })}
                </h3>
                <p className="mt-1 text-xs text-fg-muted">
                  {g.ageCategory.toLowerCase()} · {g.documentType.toLowerCase().replace('_', ' ')} #{g.documentNumber}
                </p>
              </div>
              <DocumentImage guestId={g.id} documentKey={g.documentImageKey} label={`${g.firstName} ${g.lastName}`} />
            </div>
          </div>
        ))}
      </section>

      {pending ? (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-fg">{t('detail.decisionHeading')}</h2>

          <form action={`/admin/registrations/${reg.id}/approve`} method="post" className="flex flex-col gap-3">
            <label className="text-xs font-medium text-fg">{t('detail.approveNoteLabel')}</label>
            <input
              name="comment"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              placeholder={t('detail.approveNotePlaceholder')}
            />
            <Button type="submit">{t('detail.approvButton')}</Button>
          </form>

          <form
            action={`/admin/registrations/${reg.id}/reject`}
            method="post"
            className="flex flex-col gap-3 border-t border-border pt-4"
          >
            <label className="text-xs font-medium text-fg">{t('detail.rejectReasonLabel')}</label>
            <input
              name="comment"
              required
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            />
            <Button type="submit" variant="danger">{t('detail.rejectButton')}</Button>
          </form>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-fg">{t('detail.decisionHeading')}</h2>
          <p className="mt-2 text-sm text-fg-muted">
            {t('detail.statusLabel')} <strong>{t(`status.${reg.status}`)}</strong>
            {reg.reviewedAt && (
              <> · {t('detail.reviewedAt', { datetime: reg.reviewedAt.toISOString().slice(0, 16).replace('T', ' ') })}</>
            )}
          </p>
          {reg.adminComment && (
            <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm text-fg">
              {reg.adminComment}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
