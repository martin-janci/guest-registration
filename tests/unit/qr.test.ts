import { describe, it, expect } from 'vitest';
import { renderQrSvg } from '@/lib/qr';

describe('renderQrSvg', () => {
  it('returns an inline SVG string with viewBox', async () => {
    const svg = await renderQrSvg('https://airbnb.rlt.sk/register/ABC123');
    expect(svg).toMatch(/^<svg\b[^>]*viewBox=/);
    expect(svg).toContain('</svg>');
  });

  it('is deterministic for the same input', async () => {
    const a = await renderQrSvg('hello');
    const b = await renderQrSvg('hello');
    expect(a).toBe(b);
  });

  it('errors on empty input', async () => {
    await expect(renderQrSvg('')).rejects.toBeDefined();
  });
});
