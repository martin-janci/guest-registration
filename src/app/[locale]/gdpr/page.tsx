import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function GdprPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gdpr');

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-10">
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
