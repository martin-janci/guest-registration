import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { getInvoiceById, markSent } from '@/modules/invoices/service';
import { renderInvoicePdf } from '@/modules/invoices/pdf-render';
import { transporter } from '@/modules/email/transport';
import { env } from '@/lib/env';
import { invoiceSentTemplate } from '@/modules/email/templates/invoice-sent';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/db/client';
import { defaultLocale } from '@/lib/i18n/locales';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const inv = await getInvoiceById(id);
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!inv.clientEmail) {
    return NextResponse.json({ error: 'Client email is required to send' }, { status: 400 });
  }
  if (inv.items.length === 0) {
    return NextResponse.json({ error: 'Add at least one line item' }, { status: 400 });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { id: inv.adminId } });
  const propertyName = inv.registration?.trip.property.name ?? null;

  const buf = await renderInvoicePdf({
    invoiceNumber: inv.invoiceNumber,
    issueDate: inv.issueDate.toISOString().slice(0, 10),
    dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
    currency: inv.currency,
    clientName: inv.clientName,
    clientEmail: inv.clientEmail,
    clientVatNumber: inv.clientVatNumber,
    clientAddress: inv.clientAddress,
    items: inv.items.map((it) => ({
      description: it.description,
      quantity: it.quantity.toFixed(2),
      unitPrice: it.unitPrice.toFixed(2),
      vatRate: it.vatRate.toFixed(2),
      lineTotal: it.lineTotal.toFixed(2),
      totalWithVat: it.totalWithVat.toFixed(2),
    })),
    subtotal: inv.subtotal.toFixed(2),
    vatTotal: inv.vatTotal.toFixed(2),
    totalAmount: inv.totalAmount.toFixed(2),
    notes: inv.notes,
    brand: {
      companyName: admin.companyName,
      companyIco: admin.companyIco,
      companyVat: admin.companyVat,
      contactName: admin.contactName,
      contactAddress: admin.contactAddress,
      contactPhone: admin.contactPhone,
      contactWebsite: admin.contactWebsite,
      customLine1: admin.customLine1,
      customLine2: admin.customLine2,
      customLine3: admin.customLine3,
    },
  });

  const tpl = invoiceSentTemplate({
    clientName: inv.clientName,
    invoiceNumber: inv.invoiceNumber,
    propertyName,
    totalDisplay: formatMoney(inv.totalAmount.toFixed(2), inv.currency),
    dueDateDisplay: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
    senderName: admin.companyName ?? admin.username,
    locale: defaultLocale,
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: inv.clientEmail,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
    attachments: [{ filename: `${inv.invoiceNumber}.pdf`, content: buf, contentType: 'application/pdf' }],
  });

  await markSent(id);
  revalidatePath('/admin/invoices');
  revalidatePath(`/admin/invoices/${id}`);
  return NextResponse.redirect(new URL(`/admin/invoices/${id}`, req.url), 303);
}
