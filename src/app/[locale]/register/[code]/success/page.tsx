import { CheckCircle2 } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: Promise<{ code: string; locale: string }>;
  searchParams: Promise<{ existing?: string }>;
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('guest.success');

  const sp = await searchParams;
  const already = sp.existing === '1';
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-success-500" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-fg">
        {already ? t('alreadyHeading') : t('heading')}
      </h1>
      <p className="text-sm text-fg-muted">
        {already ? t('alreadyBody') : t('body')}
      </p>
    </main>
  );
}
