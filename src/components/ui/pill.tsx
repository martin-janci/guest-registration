import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const pillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-2 text-fg border border-border',
        success: 'bg-success-100 text-success-700',
        warning: 'bg-warning-100 text-warning-700',
        danger: 'bg-danger-100 text-danger-700',
        info: 'bg-info-100 text-info-700',
        accent: 'bg-accent-100 text-accent-700',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

const dotVariants = cva('h-1.5 w-1.5 rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-fg-subtle',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-info-500',
      accent: 'bg-accent-500',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  dot?: boolean;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ className, tone, dot = true, children, ...props }, ref) => (
    <span ref={ref} className={cn(pillVariants({ tone }), className)} {...props}>
      {dot && <span className={dotVariants({ tone })} aria-hidden />}
      {children}
    </span>
  ),
);
Pill.displayName = 'Pill';
