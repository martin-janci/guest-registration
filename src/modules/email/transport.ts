import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@/lib/env';

const globalForMail = globalThis as unknown as { transporter?: Transporter };

export const transporter: Transporter =
  globalForMail.transporter ??
  nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForMail.transporter = transporter;
