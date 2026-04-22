'use client';
import { Link } from '@/lib/i18n/link';
import { usePathname } from '@/lib/i18n/link';
import { CheckSquare, Calendar, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslations } from 'next-intl';

export function HousekeeperBottomNav() {
  const path = usePathname();
  const t = useTranslations('hk.nav');

  const items = [
    { href: '/housekeeper/dashboard', label: t('dashboard'), icon: CheckSquare },
    { href: '/housekeeper/calendar', label: t('calendar'), icon: Calendar },
  ];

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
          {t('signOut')}
        </button>
      </form>
    </nav>
  );
}
