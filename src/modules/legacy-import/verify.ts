import { prisma } from '@/db/client';

export async function verify(): Promise<string[]> {
  const issues: string[] = [];

  // Invoice totals invariant: sum(InvoiceItem.totalWithVat) ≈ Invoice.totalAmount
  // Tolerance 0.01 per invoice to absorb legacy VAT rounding drift.
  const invoices = await prisma.invoice.findMany({
    include: { items: true },
  });
  for (const inv of invoices) {
    const sum = inv.items.reduce((acc, it) => acc + Number(it.totalWithVat), 0);
    const total = Number(inv.totalAmount);
    if (Math.abs(sum - total) > 0.01) {
      issues.push(
        `Invoice ${inv.invoiceNumber}: items sum ${sum.toFixed(2)} != total ${total.toFixed(2)}`,
      );
    }
  }

  // FK sweep — anything imported must have its referenced parent present.
  // Uses actual column names from prisma/schema.prisma:
  //   Guest.registrationId, InvoiceItem.invoiceId, HousekeepingPhoto.taskId
  const orphans = await prisma.$queryRaw<Array<{ table: string; count: bigint }>>`
    SELECT 'Guest' AS table, COUNT(*) AS count FROM "Guest" g
      WHERE NOT EXISTS (SELECT 1 FROM "Registration" r WHERE r.id = g."registrationId")
    UNION ALL
    SELECT 'InvoiceItem', COUNT(*) FROM "InvoiceItem" ii
      WHERE NOT EXISTS (SELECT 1 FROM "Invoice" i WHERE i.id = ii."invoiceId")
    UNION ALL
    SELECT 'HousekeepingPhoto', COUNT(*) FROM "HousekeepingPhoto" hp
      WHERE NOT EXISTS (SELECT 1 FROM "HousekeepingTask" h WHERE h.id = hp."taskId")
  `;
  for (const row of orphans) {
    if (row.count > 0n) issues.push(`${row.table}: ${row.count} orphans`);
  }

  return issues;
}
