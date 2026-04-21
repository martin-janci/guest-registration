import { z } from 'zod';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

export const uploadFileValidation = z
  .instanceof(File)
  .refine((f) => f.size > 0, { message: 'File is empty' })
  .refine((f) => f.size <= MAX_UPLOAD_BYTES, {
    message: `File exceeds ${MAX_UPLOAD_BYTES} bytes`,
  })
  .refine((f) => ALLOWED_MIME.has(f.type), {
    message: 'Unsupported file type',
  });
