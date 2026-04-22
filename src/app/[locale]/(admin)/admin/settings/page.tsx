import { requireAdmin } from '@/lib/authz';
import { getMyProfile } from '@/modules/settings/service';
import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const t = await getTranslations('admin.settings');
  const profile = await getMyProfile(admin.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('heading')}</h1>
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
