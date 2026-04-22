'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pill } from '@/components/ui/pill';
import { assignAction, unassignAction, setDefaultAction } from './housekeepers/actions';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('admin.properties.housekeepers');
  return (
    <section className="rounded-lg border border-border bg-surface shadow-xs">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">{t('heading')}</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {t('subheading')}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {assignments.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-fg-muted">
            {t('empty')}
          </li>
        )}
        {assignments.map((a) => (
          <li key={a.housekeeperId} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-fg">{a.username}</span>
                {a.isDefault && <Pill tone="accent">{t('defaultBadge')}</Pill>}
              </div>
              <div className="truncate text-xs text-fg-muted">{a.email}</div>
            </div>
            <div className="text-sm tabular-nums text-fg">
              {a.payOverride ?? propertyDefaultPay} €
            </div>
            {!a.isDefault && (
              <form action={setDefaultAction.bind(null, propertyId, a.housekeeperId)}>
                <Button variant="ghost" size="sm" type="submit">{t('makeDefault')}</Button>
              </form>
            )}
            <form
              action={unassignAction.bind(null, propertyId, a.housekeeperId)}
              onSubmit={(e) => { if (!confirm(t('removeConfirm', { name: a.username }))) e.preventDefault(); }}
            >
              <Button variant="ghost" size="sm" type="submit">{t('remove')}</Button>
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
            <label className="text-xs font-medium text-fg">{t('fieldHousekeeper')}</label>
            <Select name="housekeeperId" required>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.username} ({c.email})</option>
              ))}
            </Select>
          </div>
          <div className="flex w-32 flex-col gap-1">
            <label className="text-xs font-medium text-fg">{t('fieldPayOverride')}</label>
            <Input
              name="payOverride"
              type="text"
              inputMode="decimal"
              placeholder={propertyDefaultPay}
              pattern="^\d+(\.\d{1,2})?$"
            />
          </div>
          <Button type="submit" size="md">{t('assignButton')}</Button>
        </form>
      )}
    </section>
  );
}
