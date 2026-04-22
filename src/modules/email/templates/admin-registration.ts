import type { Locale } from '@/lib/i18n/locales';
import { emailDict, render } from './i18n';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface AdminRegistrationVars {
  adminName: string;
  tripTitle: string;
  propertyName: string;
  guestCount: number;
  reviewUrl: string;
  submittedAt: Date;
  locale?: Locale;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function adminRegistrationTemplate(v: AdminRegistrationVars): EmailTemplate {
  const when = v.submittedAt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const dict = emailDict(v.locale).adminRegistration;

  const vars = {
    adminName: v.adminName,
    property: v.propertyName,
    trip: v.tripTitle,
    guestCount: v.guestCount,
    when,
  };

  const subject = render(dict.subject, vars);
  const greeting = render(dict.greeting, vars);
  const body = render(dict.body, vars);
  const reviewCta: string = dict.reviewCta;

  return {
    subject,
    text:
      `${greeting}\n\n` +
      `${body}\n\n` +
      `${reviewCta}: ${v.reviewUrl}\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(body)}</p>
  <p><a href="${v.reviewUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">${escapeHtml(reviewCta)}</a></p>
</body></html>`.trim(),
  };
}
