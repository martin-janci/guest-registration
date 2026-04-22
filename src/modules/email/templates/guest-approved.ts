import type { Locale } from '@/lib/i18n/locales';
import type { EmailTemplate } from './admin-registration';
import { emailDict, render } from './i18n';

export interface GuestApprovedVars {
  guestFirstName: string;
  tripTitle: string;
  propertyName: string;
  adminComment: string | null;
  locale?: Locale;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function guestApprovedTemplate(v: GuestApprovedVars): EmailTemplate {
  const dict = emailDict(v.locale).guestApproved;

  const vars = {
    name: v.guestFirstName,
    trip: v.tripTitle,
    property: v.propertyName,
  };

  const subject = render(dict.subject, vars);
  const greeting = render(dict.greeting, vars);
  const body = render(dict.body, vars);
  const noteFromHost: string = dict.noteFromHost;
  const footer: string = dict.footer;

  const commentHtml = v.adminComment
    ? `<p style="background:#f1f5f9;padding:10px;border-radius:6px;">
         <strong>${escapeHtml(noteFromHost)}</strong> ${escapeHtml(v.adminComment)}
       </p>`
    : '';
  const commentText = v.adminComment
    ? `\n${noteFromHost} ${v.adminComment}\n`
    : '';

  return {
    subject,
    text:
      `${greeting}\n\n` +
      `${body}\n` +
      commentText +
      `\n${footer}\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(body)}</p>
  ${commentHtml}
  <p>${escapeHtml(footer)}</p>
</body></html>`.trim(),
  };
}
