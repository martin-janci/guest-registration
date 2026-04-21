'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Calendar, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { href: '/housekeeper/dashboard', label: 'Tasks', icon: CheckSquare },
  { href: '/housekeeper/calendar', label: 'Calendar', icon: Calendar },
];

export function HousekeeperBottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 border-t border-border bg-surface/95 backdrop-blur-md">
      {items.map((it) => {
        const active = path === it.href || path.startsWith(it.href + '/');
        const Icon = it.icon;
        return (
          <Link key={it.href} href={it.href}
            className={cn('flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium',
              active ? 'text-accent-600' : 'text-fg-muted hover:text-fg')}>
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
            {it.label}
          </Link>
        );
      })}
      <form action="/admin/logout" method="post" className="flex flex-1 items-center justify-center">
        <button type="submit" className="flex flex-col items-center gap-1 text-[11px] font-medium text-fg-muted hover:text-fg">
          <LogOut className="h-5 w-5" strokeWidth={1.5} />
          Sign out
        </button>
      </form>
    </nav>
  );
}
