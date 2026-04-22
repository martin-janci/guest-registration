import { AlertTriangle } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InvalidPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('guest.invalid');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-warning-500" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-fg">{t('heading')}</h1>
      <p className="text-sm text-fg-muted">
        {t('body')}
      </p>
    </main>
  );
}
