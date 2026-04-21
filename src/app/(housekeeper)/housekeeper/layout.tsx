import { redirect } from 'next/navigation';
import { requireHousekeeperOrAdmin } from '@/lib/authz';
import { HousekeeperBottomNav } from '@/components/housekeeper/bottom-nav';
import { Wordmark } from '@/components/brand/wordmark';

export default async function HousekeeperLayout({ children }: { children: React.ReactNode }) {
  try { await requireHousekeeperOrAdmin(); } catch { redirect('/login'); }
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-surface/95 px-4 backdrop-blur-md">
        <Wordmark size={20} />
      </header>
      <main className="flex-1 pb-20">
        <div className="mx-auto w-full max-w-[640px] px-4 py-4">{children}</div>
      </main>
      <HousekeeperBottomNav />
    </div>
  );
}
