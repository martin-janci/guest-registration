'use client';

import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { submitAction } from './actions';
import { useTranslations } from 'next-intl';

interface Props {
  tripId: number;
  tripTitle: string;
  propertyName: string;
  maxGuests: number;
}

interface GuestFormRow {
  id: number;
}

let nextId = 1;

export function RegisterForm({ tripId, tripTitle, propertyName, maxGuests }: Props) {
  const t = useTranslations('guest.register');
  const [state, action, pending] = useActionState(submitAction, undefined);
  const [guests, setGuests] = useState<GuestFormRow[]>([{ id: nextId++ }]);

  const canAdd = guests.length < Math.min(maxGuests, 20);
  const canRemove = guests.length > 1;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="tripId" value={tripId} />

      <section className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-fg">{tripTitle}</p>
        <p className="text-fg-muted">{propertyName}</p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <Label htmlFor="email">{t('email.label')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
        />
        <p className="text-xs text-fg-muted">{t('email.hint')}</p>
      </section>

      {guests.map((g, i) => (
        <section key={g.id} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">{t('guestHeading', { number: i + 1 })}</h3>
            {canRemove && (
              <button
                type="button"
                onClick={() => setGuests((prev) => prev.filter((p) => p.id !== g.id))}
                className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-danger-700"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t('remove')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`g-${i}-first`}>{t('firstName')}</Label>
              <Input id={`g-${i}-first`} name={`guests.${i}.firstName`} required autoComplete="given-name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`g-${i}-last`}>{t('lastName')}</Label>
              <Input id={`g-${i}-last`} name={`guests.${i}.lastName`} required autoComplete="family-name" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-age`}>{t('ageCategory')}</Label>
            <Select id={`g-${i}-age`} name={`guests.${i}.ageCategory`} defaultValue="ADULT">
              <option value="ADULT">{t('ageAdult')}</option>
              <option value="CHILD">{t('ageChild')}</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-dtype`}>{t('documentType')}</Label>
            <Select id={`g-${i}-dtype`} name={`guests.${i}.documentType`} defaultValue="PASSPORT">
              <option value="PASSPORT">{t('documentPassport')}</option>
              <option value="DRIVING_LICENSE">{t('documentDrivingLicense')}</option>
              <option value="CITIZEN_ID">{t('documentCitizenId')}</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-dnum`}>{t('documentNumber')}</Label>
            <Input id={`g-${i}-dnum`} name={`guests.${i}.documentNumber`} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-doc`}>{t('documentPhoto')}</Label>
            <input
              id={`g-${i}-doc`}
              name={`guests.${i}.document`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              capture="environment"
              className="text-sm"
            />
            <p className="text-xs text-fg-muted">{t('documentHint')}</p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox name={`guests.${i}.gdprConsent`} required />
            <span className="text-fg">
              {t('gdprConsent')}
            </span>
          </label>
        </section>
      ))}

      {canAdd && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setGuests((prev) => [...prev, { id: nextId++ }])}
          className="self-start"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          {t('addGuest')}
        </Button>
      )}

      {state?.error && (
        <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
