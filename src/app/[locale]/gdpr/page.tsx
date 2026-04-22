import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LangSwitch } from '@/components/ui/lang-switch';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function GdprPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gdpr');

  return (
    <main className="relative mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-10">
      <div className="absolute right-0 top-4">
        <LangSwitch />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('heading')}</h1>
      <p className="text-sm text-fg-muted">
        {t('body1')}
      </p>
      <p className="text-sm text-fg-muted">
        {t('body2')}
      </p>
    </main>
  );
}
