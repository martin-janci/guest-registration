import { prisma } from '@/db/client';

export async function invoiceOverdueFlipHandler(): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.invoice.updateMany({
    where: { status: 'SENT', dueDate: { lt: today } },
    data: { status: 'OVERDUE' },
  });
}
