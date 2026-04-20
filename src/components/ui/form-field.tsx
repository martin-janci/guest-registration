import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';

interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string | undefined;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-danger-700">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-fg-muted">{description}</p>
      )}
      {error && (
        <p className="text-xs text-danger-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
