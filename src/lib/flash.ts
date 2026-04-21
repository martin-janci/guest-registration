import { cookies } from 'next/headers';

const COOKIE = 'gr_flash';

export interface FlashPayload {
  kind: 'success' | 'error';
  message: string;
}

export async function setFlash(payload: FlashPayload): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, JSON.stringify(payload), {
    path: '/',
    maxAge: 30,
    sameSite: 'lax',
  });
}

export async function popFlash(): Promise<FlashPayload | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    c.delete(COOKIE);
    const parsed = JSON.parse(raw) as FlashPayload;
    if (parsed && (parsed.kind === 'success' || parsed.kind === 'error') && typeof parsed.message === 'string') {
      return parsed;
    }
  } catch {
    // Ignore malformed flash cookies.
  }
  return null;
}
