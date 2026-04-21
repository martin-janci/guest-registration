import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/modules/email/transport', () => ({
  transporter: { sendMail: vi.fn().mockResolvedValue({ messageId: 'm1' }) },
}));

import { sendMail } from '@/modules/email/service';
import { transporter } from '@/modules/email/transport';

describe('sendMail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates to the transporter with the envelope fields', async () => {
    await sendMail({
      to: 'a@example.com',
      template: { subject: 'sub', html: '<p>hi</p>', text: 'hi' },
      replyTo: 'reply@example.com',
    });
    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(transporter.sendMail).mock.calls[0]![0] as {
      to: string; subject: string; html: string; text: string; replyTo?: string;
    };
    expect(arg.to).toBe('a@example.com');
    expect(arg.subject).toBe('sub');
    expect(arg.html).toBe('<p>hi</p>');
    expect(arg.replyTo).toBe('reply@example.com');
  });
});
