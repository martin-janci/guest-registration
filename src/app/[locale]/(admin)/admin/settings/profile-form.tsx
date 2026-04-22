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
