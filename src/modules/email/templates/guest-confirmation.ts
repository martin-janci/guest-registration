import type { Locale } from '@/lib/i18n/locales';
import type { EmailTemplate } from './admin-registration';
import { emailDict, render } from './i18n';

export interface GuestConfirmationVars {
  guestFirstName: string;
  tripTitle: string;
  propertyName: string;
  locale?: Locale;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function guestConfirmationTemplate(v: GuestConfirmationVars): EmailTemplate {
  const dict = emailDict(v.locale).guestConfirmation;

  const vars = {
    name: v.guestFirstName,
    trip: v.tripTitle,
    property: v.propertyName,
  };

  const subject = render(dict.subject, vars);
  const greeting = render(dict.greeting, vars);
  const body = render(dict.body, vars);
  const fix: string = dict.fix;

  return {
    subject,
    text:
      `${greeting}\n\n` +
      `${body}\n\n` +
      `${fix}\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(body)}</p>
  <p style="color:#64748b;font-size:13px;">${escapeHtml(fix)}</p>
</body></html>`.trim(),
  };
}
