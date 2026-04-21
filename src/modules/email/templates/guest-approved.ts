import type { EmailTemplate } from './admin-registration';

export interface GuestApprovedVars {
  guestFirstName: string;
  tripTitle: string;
  propertyName: string;
  adminComment: string | null;
}

export function guestApprovedTemplate(v: GuestApprovedVars): EmailTemplate {
  const comment = v.adminComment
    ? `<p style="background:#f1f5f9;padding:10px;border-radius:6px;">
         <strong>Note from host:</strong> ${escapeHtml(v.adminComment)}
       </p>`
    : '';
  return {
    subject: `Registration approved — ${v.propertyName}`,
    text:
      `Hi ${v.guestFirstName},\n\n` +
      `Your registration for "${v.tripTitle}" at ${v.propertyName} has been approved.\n` +
      (v.adminComment ? `\nNote from host: ${v.adminComment}\n` : '') +
      `\nSee you soon!\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>Hi ${escapeHtml(v.guestFirstName)},</p>
  <p>Your registration for <strong>${escapeHtml(v.tripTitle)}</strong>
    at ${escapeHtml(v.propertyName)} has been approved.</p>
  ${comment}
  <p>See you soon!</p>
</body></html>`.trim(),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
