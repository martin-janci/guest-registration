import { AlertTriangle } from 'lucide-react';

export default function InvalidPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-warning-500" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-fg">Registration link not found</h1>
      <p className="text-sm text-fg-muted">
        The code in your link doesn't match any booking. Double-check the link your host sent,
        or reply to their email for a new one.
      </p>
    </main>
  );
}
