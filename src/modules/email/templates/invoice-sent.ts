import type { Locale } from '@/lib/i18n/locales';
import type { EmailTemplate } from './admin-registration';
import { emailDict, render } from './i18n';

export interface InvoiceSentVars {
  clientName: string;
  invoiceNumber: string;
  propertyName: string | null;
  totalDisplay: string;
  dueDateDisplay: string | null;
  senderName: string;
  locale?: Locale;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function invoiceSentTemplate(v: InvoiceSentVars): EmailTemplate {
  const dict = emailDict(v.locale).invoiceSent;

  const vars = {
    clientName: v.clientName,
    invoiceNumber: v.invoiceNumber,
    senderName: v.senderName,
    total: v.totalDisplay,
    dueDate: v.dueDateDisplay ?? '',
    property: v.propertyName ?? '',
  };

  const subject = render(dict.subject, vars);
  const greeting = render(dict.greeting, vars);
  const body = render(dict.body, vars);
  const totalLine = render(dict.total, vars);
  const dueLine = v.dueDateDisplay ? render(dict.due, vars) : null;
  const relatedStay = v.propertyName ? render(dict.relatedStay, vars) : null;
  const footer = render(dict.footer, vars);

  const propertyLineHtml = relatedStay
    ? `<p>${escapeHtml(relatedStay)}</p>`
    : '';
  const dueLineHtml = dueLine
    ? `<p>${escapeHtml(dueLine)}</p>`
    : '';

  return {
    subject,
    text:
      `${greeting}\n\n` +
      `${body}\n` +
      `${totalLine}${dueLine ? ` · ${dueLine}` : ''}.\n\n` +
      `${footer}\n`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(body)}</p>
  <p>${escapeHtml(totalLine)}</p>
  ${dueLineHtml}
  ${propertyLineHtml}
  <p>${escapeHtml(footer).replace(/\n/g, '<br/>')}</p>
</body></html>`.trim(),
  };
}
