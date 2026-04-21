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
}

export function adminRegistrationTemplate(v: AdminRegistrationVars): EmailTemplate {
  const when = v.submittedAt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  return {
    subject: `New guest registration — ${v.propertyName}`,
    text:
      `${v.adminName},\n\n` +
      `A guest just submitted a registration for "${v.tripTitle}" (${v.propertyName}).\n` +
      `Guests: ${v.guestCount}. Submitted: ${when}.\n\n` +
      `Review: ${v.reviewUrl}\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>Hi ${escapeHtml(v.adminName)},</p>
  <p>A guest just submitted a registration for
    <strong>${escapeHtml(v.tripTitle)}</strong>
    (${escapeHtml(v.propertyName)}).
  </p>
  <p>Guests: ${v.guestCount} · Submitted: ${when}</p>
  <p><a href="${v.reviewUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">Review registration</a></p>
</body></html>`.trim(),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
