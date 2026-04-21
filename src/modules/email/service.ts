import { transporter } from './transport';
import { env } from '@/lib/env';
import type { EmailTemplate } from './templates/admin-registration';

export interface SendMailInput {
  to: string;
  template: EmailTemplate;
  replyTo?: string;
}

export async function sendMail({ to, template, replyTo }: SendMailInput): Promise<void> {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
    ...(replyTo ? { replyTo } : {}),
  });
}
