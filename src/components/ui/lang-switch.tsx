'use client';

import { useLocale } from 'next-intl';
import { locales } from '@/lib/i18n/locales';
import { Link, usePathname } from '@/lib/i18n/link';
import { Globe } from 'lucide-react';

const labels: Record<typeof locales[number], string> = {
  sk: 'Slovenčina',
  en: 'English',
  cs: 'Čeština',
};

export function LangSwitch({ className }: { className?: string }) {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <details className={`relative ${className ?? ''}`}>
      <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg-muted hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
        {labels[current as keyof typeof labels]}
      </summary>
      <ul className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-md border border-border bg-surface shadow-md">
        {locales.map((loc) => (
          <li key={loc}>
            <Link
              locale={loc}
              href={pathname}
              className={`block px-3 py-1.5 text-sm ${loc === current ? 'bg-surface-2 font-medium text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'}`}
            >
              {labels[loc]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
