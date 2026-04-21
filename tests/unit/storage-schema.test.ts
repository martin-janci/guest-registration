import { describe, it, expect } from 'vitest';
import { uploadFileValidation, MAX_UPLOAD_BYTES } from '@/modules/storage/schema';

function makeFile(bytes: number, type = 'image/jpeg', name = 'doc.jpg'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('uploadFileValidation', () => {
  it('accepts a JPEG under the limit', () => {
    expect(uploadFileValidation.safeParse(makeFile(1024)).success).toBe(true);
  });

  it('accepts PDFs', () => {
    expect(uploadFileValidation.safeParse(makeFile(1024, 'application/pdf', 'doc.pdf')).success).toBe(true);
  });

  it('rejects unknown mime types', () => {
    expect(
      uploadFileValidation.safeParse(makeFile(1024, 'application/zip', 'bundle.zip')).success,
    ).toBe(false);
  });

  it('rejects empty files', () => {
    expect(uploadFileValidation.safeParse(makeFile(0)).success).toBe(false);
  });

  it(`rejects files larger than ${MAX_UPLOAD_BYTES} bytes`, () => {
    expect(uploadFileValidation.safeParse(makeFile(MAX_UPLOAD_BYTES + 1)).success).toBe(false);
  });
});
