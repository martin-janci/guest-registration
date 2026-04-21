import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { prisma } from '@/db/client';
import { getObjectStream } from '@/modules/storage/service';
import { Readable } from 'node:stream';

interface RouteContext {
  params: Promise<{ guestId: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { guestId: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest?.documentImageKey) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { stream, contentType, contentLength } = await getObjectStream(guest.documentImageKey);

  const webStream = Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(contentLength),
      'Cache-Control': 'private, max-age=60',
    },
  });
}
