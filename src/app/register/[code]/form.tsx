'use client';

import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { submitAction } from './actions';

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
        <Label htmlFor="email">Your email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
        />
        <p className="text-xs text-fg-muted">We'll send the confirmation and any host updates here.</p>
      </section>

      {guests.map((g, i) => (
        <section key={g.id} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Guest {i + 1}</h3>
            {canRemove && (
              <button
                type="button"
                onClick={() => setGuests((prev) => prev.filter((p) => p.id !== g.id))}
                className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-danger-700"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`g-${i}-first`}>First name</Label>
              <Input id={`g-${i}-first`} name={`guests.${i}.firstName`} required autoComplete="given-name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`g-${i}-last`}>Last name</Label>
              <Input id={`g-${i}-last`} name={`guests.${i}.lastName`} required autoComplete="family-name" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-age`}>Age category</Label>
            <Select id={`g-${i}-age`} name={`guests.${i}.ageCategory`} defaultValue="ADULT">
              <option value="ADULT">Adult</option>
              <option value="CHILD">Child</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-dtype`}>Document type</Label>
            <Select id={`g-${i}-dtype`} name={`guests.${i}.documentType`} defaultValue="PASSPORT">
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENSE">Driving license</option>
              <option value="CITIZEN_ID">Citizen ID</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-dnum`}>Document number</Label>
            <Input id={`g-${i}-dnum`} name={`guests.${i}.documentNumber`} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`g-${i}-doc`}>Document photo</Label>
            <input
              id={`g-${i}-doc`}
              name={`guests.${i}.document`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              capture="environment"
              className="text-sm"
            />
            <p className="text-xs text-fg-muted">JPEG/PNG/PDF up to 10 MB. Optional for children if host allows.</p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox name={`guests.${i}.gdprConsent`} required />
            <span className="text-fg">
              I agree this guest's personal data is processed for legal registration purposes.
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
          Add another guest
        </Button>
      )}

      {state?.error && (
        <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? 'Submitting…' : 'Submit registration'}
      </Button>
    </form>
  );
}
