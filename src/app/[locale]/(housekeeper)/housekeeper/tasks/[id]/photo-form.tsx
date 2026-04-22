'use client';
import { useActionState } from 'react';
import { Camera } from 'lucide-react';
import { uploadPhotoAction, type PhotoState } from './actions';

export function UploadPhotoForm({ taskId }: { taskId: number }) {
  const [state, action, pending] = useActionState<PhotoState | undefined, FormData>(
    uploadPhotoAction.bind(null, taskId), undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-2 p-6 text-sm font-medium text-fg-muted active:bg-surface">
        <Camera className="h-5 w-5" strokeWidth={1.5} />
        <span>{pending ? 'Uploading…' : 'Tap to take / choose a photo'}</span>
        <input type="file" name="photo"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment" className="hidden"
          onChange={(e) => { if (e.target.files && e.target.files.length > 0) e.target.form?.requestSubmit(); }} />
      </label>
      {state?.error && (
        <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
