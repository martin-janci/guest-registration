import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  tone?: 'neutral' | 'warning' | 'danger';
  icon?: LucideIcon;
  href?: string;
}

const toneClass = {
  neutral: 'text-fg-muted',
  warning: 'text-warning-700',
  danger: 'text-danger-700',
} as const;

export function KpiCard({ label, value, delta, tone = 'neutral', icon: Icon, href }: KpiCardProps) {
  return (
    <a
      href={href ?? '#'}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-fg">{value}</span>
        {delta && <span className={cn('text-xs font-medium', toneClass[tone])}>{delta}</span>}
      </div>
      <div className="flex items-center gap-1 text-xs text-accent-600 opacity-0 transition-opacity group-hover:opacity-100">
        View <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
      </div>
    </a>
  );
}
