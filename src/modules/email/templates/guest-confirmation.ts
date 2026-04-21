import type { EmailTemplate } from './admin-registration';

export interface GuestConfirmationVars {
  guestFirstName: string;
  tripTitle: string;
  propertyName: string;
}

export function guestConfirmationTemplate(v: GuestConfirmationVars): EmailTemplate {
  return {
    subject: `Registration received — ${v.propertyName}`,
    text:
      `Hi ${v.guestFirstName},\n\n` +
      `We've received your registration for "${v.tripTitle}" at ${v.propertyName}.\n` +
      `Your host will review it shortly. You'll get another email once it's approved.\n\n` +
      `If you spot a mistake, just reply to this email.\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>Hi ${escapeHtml(v.guestFirstName)},</p>
  <p>We've received your registration for <strong>${escapeHtml(v.tripTitle)}</strong>
    at ${escapeHtml(v.propertyName)}.</p>
  <p>Your host will review it shortly. You'll get another email once it's approved.</p>
  <p style="color:#64748b;font-size:13px;">If you spot a mistake, just reply to this email.</p>
</body></html>`.trim(),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
