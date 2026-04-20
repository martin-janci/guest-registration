import * as React from 'react';
import { cn } from '@/lib/cn';

interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Array<ColumnDef<T>>;
  rows: T[];
  emptyState?: React.ReactNode;
  rowKey: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  rows,
  emptyState,
  rowKey,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
        {emptyState ?? (
          <p className="text-sm text-fg-muted">Nothing here yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-fg-muted',
                  c.align === 'right' ? 'text-right' : 'text-left',
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              className={cn(
                'hover:bg-surface-2 transition-colors',
                i < rows.length - 1 && 'border-b border-border',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-4 py-3 text-fg',
                    c.align === 'right' ? 'text-right' : 'text-left',
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
