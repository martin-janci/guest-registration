import type { EmailTemplate } from './admin-registration';

export interface InvoiceSentVars {
  clientName: string;
  invoiceNumber: string;
  propertyName: string | null;
  totalDisplay: string;
  dueDateDisplay: string | null;
  senderName: string;
}

export function invoiceSentTemplate(v: InvoiceSentVars): EmailTemplate {
  const propertyLine = v.propertyName
    ? `<p>Related stay: <strong>${escapeHtml(v.propertyName)}</strong></p>`
    : '';
  const dueLine = v.dueDateDisplay
    ? `<p>Due: <strong>${escapeHtml(v.dueDateDisplay)}</strong></p>`
    : '';
  return {
    subject: `Invoice ${v.invoiceNumber} from ${v.senderName}`,
    text:
      `Hi ${v.clientName},\n\n` +
      `Please find invoice ${v.invoiceNumber} attached.\n` +
      `Total: ${v.totalDisplay}${v.dueDateDisplay ? ` · Due: ${v.dueDateDisplay}` : ''}.\n\n` +
      `Thank you,\n${v.senderName}\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>Hi ${escapeHtml(v.clientName)},</p>
  <p>Please find invoice <strong>${escapeHtml(v.invoiceNumber)}</strong> attached.</p>
  <p>Total: <strong>${escapeHtml(v.totalDisplay)}</strong></p>
  ${dueLine}
  ${propertyLine}
  <p>Thank you,<br/>${escapeHtml(v.senderName)}</p>
</body></html>`.trim(),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
