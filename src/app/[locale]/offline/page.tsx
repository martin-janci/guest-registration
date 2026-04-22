import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <WifiOff className="h-12 w-12 text-fg-subtle" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-fg">You're offline</h1>
      <p className="text-sm text-fg-muted">
        The app will sync the moment you reconnect. Your previously-loaded tasks stay accessible.
      </p>
    </main>
  );
}
