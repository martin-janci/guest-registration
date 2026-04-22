import { Link } from '@/lib/i18n/link';
import { Clock, CheckCircle2, Play, type LucideIcon } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import { formatMoney } from '@/lib/money';

export interface TaskCardData {
  id: number;
  propertyName: string;
  tripTitle: string;
  date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  paid: boolean;
  payAmount: string;
  photoCount: number;
}

function statusTone(s: TaskCardData['status']) {
  if (s === 'COMPLETED') return 'success' as const;
  if (s === 'IN_PROGRESS') return 'info' as const;
  return 'warning' as const;
}
function statusIcon(s: TaskCardData['status']): LucideIcon {
  if (s === 'COMPLETED') return CheckCircle2;
  if (s === 'IN_PROGRESS') return Play;
  return Clock;
}

export function TaskCard({ task }: { task: TaskCardData }) {
  const Icon = statusIcon(task.status);
  return (
    <Link href={`/housekeeper/tasks/${task.id}`}
      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs active:bg-surface-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-fg-muted">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-fg">{task.propertyName}</div>
        <div className="text-xs text-fg-muted">{task.tripTitle} · {task.date}</div>
        <div className="mt-2 flex items-center gap-2">
          <Pill tone={statusTone(task.status)}>{task.status.toLowerCase().replace('_', ' ')}</Pill>
          {task.paid ? <Pill tone="success">paid</Pill> : null}
          <span className="ml-auto text-xs tabular-nums font-medium text-fg">{formatMoney(task.payAmount, 'EUR')}</span>
        </div>
      </div>
    </Link>
  );
}
