'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plane,
  ClipboardCheck,
  Receipt,
  Sparkles,
  Home,
  Calendar,
  Users,
  Settings,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';
import { Wordmark } from '@/components/brand/wordmark';
import { cn } from '@/lib/cn';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/trips', label: 'Trips', icon: Plane },
      { href: '/admin/registrations', label: 'Registrations', icon: ClipboardCheck },
      { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
      { href: '/admin/housekeeping', label: 'Housekeeping', icon: Sparkles },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/properties', label: 'Properties', icon: Home },
      { href: '/admin/calendars', label: 'Calendars', icon: Calendar },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/jobs', label: 'Jobs', icon: CircleDot },
    ],
  },
];

export function Sidebar({ user }: { user: { username: string; email: string; role: string } }) {
  const pathname = usePathname();
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-5 border-r border-border bg-surface px-2.5 py-4">
      <div className="px-2.5 pb-1">
        <Wordmark size={24} />
      </div>

      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href as never}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                  isActive
                    ? 'bg-accent-50 font-medium text-accent-700'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-warning-100 px-1.5 text-[11px] font-medium text-warning-700">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2.5 pt-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-fg">{user.username}</div>
          <div className="text-[11px] text-fg-subtle capitalize">
            {user.role.toLowerCase()}
          </div>
        </div>
        <form action="/admin/logout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="rounded-md p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span className="sr-only">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
