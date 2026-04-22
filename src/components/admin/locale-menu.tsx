'use client';

import { useLocale } from 'next-intl';
import { locales } from '@/lib/i18n/locales';
import { Link, usePathname } from '@/lib/i18n/link';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/cn';

const labels: Record<typeof locales[number], string> = {
  sk: 'Slovenčina',
  en: 'English',
  cs: 'Čeština',
};

export function LocaleMenu() {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <details className="relative">
      <summary className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-fg-muted hover:bg-surface-2 hover:text-fg [&::-webkit-details-marker]:hidden">
        <Globe className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 truncate">{labels[current as keyof typeof labels]}</span>
      </summary>
      <ul className="absolute bottom-full left-0 z-10 mb-1 w-44 overflow-hidden rounded-md border border-border bg-surface shadow-md">
        {locales.map((loc) => (
          <li key={loc}>
            <Link
              locale={loc}
              href={pathname}
              className={cn(
                'block px-3 py-1.5 text-sm',
                loc === current
                  ? 'bg-surface-2 font-medium text-fg'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
              )}
            >
              {labels[loc]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
