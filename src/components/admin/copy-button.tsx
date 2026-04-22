'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslations } from 'next-intl';

interface Props {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label, className }: Props) {
  const t = useTranslations('admin.common');
  const [copied, setCopied] = useState(false);
  const displayLabel = label ?? t('copied');
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-fg hover:bg-surface-hover',
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
      {copied ? t('copied') : displayLabel}
    </button>
  );
}
