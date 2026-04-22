import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { getInvoiceById } from '@/modules/invoices/service';
import { renderInvoicePdf } from '@/modules/invoices/pdf-render';
import { prisma } from '@/db/client';
import { isLocale } from '@/lib/i18n/locales';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const inv = await getInvoiceById(id);
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = await prisma.user.findUniqueOrThrow({ where: { id: inv.adminId } });

  // Default to 'sk' — Slovak invoices must use Slovak legal VAT terminology.
  // Pass ?lang=en or ?lang=cs to override for a non-Slovak client copy.
  const langParam = req.nextUrl.searchParams.get('lang') ?? 'sk';
  const locale = isLocale(langParam) ? langParam : 'sk';

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
  }, locale);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${inv.invoiceNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
