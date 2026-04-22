import { CheckCircle2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ existing?: string }>;
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  await params;
  const sp = await searchParams;
  const already = sp.existing === '1';
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-success-500" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-fg">
        {already ? 'Already registered' : 'Registration received'}
      </h1>
      <p className="text-sm text-fg-muted">
        {already
          ? 'This booking already has a registration on file. If that\'s wrong, contact your host.'
          : 'Your host will review it shortly. We\'ve emailed you a confirmation.'}
      </p>
    </main>
  );
}
