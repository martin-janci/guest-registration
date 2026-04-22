import { ImageOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface Props {
  guestId: number;
  documentKey: string | null;
  label?: string;
  className?: string;
}

export async function DocumentImage({ guestId, documentKey, label, className }: Props) {
  const t = await getTranslations('admin.document');
  if (!documentKey) {
    return (
      <div className={`flex h-40 w-40 flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-surface-2 text-xs text-fg-muted ${className ?? ''}`}>
        <ImageOff className="h-5 w-5" strokeWidth={1.5} />
        {t('noDocument')}
      </div>
    );
  }
  return (
    <a
      href={`/api/admin/documents/${guestId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`block h-40 w-40 overflow-hidden rounded-md border border-border bg-white ${className ?? ''}`}
      title={label ?? t('viewDocument')}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/admin/documents/${guestId}`} alt={label ?? t('guestDocument')} className="h-full w-full object-contain" />
    </a>
  );
}
