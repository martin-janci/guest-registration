import { NextResponse, type NextRequest } from 'next/server';
import { Readable } from 'node:stream';
import { getCurrentSession } from '@/modules/auth/current';
import { prisma } from '@/db/client';
import { getObjectStream } from '@/modules/storage/service';

interface RouteContext { params: Promise<{ photoId: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { user } = await getCurrentSession();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const { photoId: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const photo = await prisma.housekeepingPhoto.findUnique({
    where: { id },
    include: { task: { select: { housekeeperId: true } } },
  });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  const isAssignee = user.role === 'HOUSEKEEPER' && user.id === photo.task.housekeeperId;
  if (!isAdmin && !isAssignee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { stream, contentType, contentLength } = await getObjectStream(photo.storageKey);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>;
  return new NextResponse(webStream, {
    headers: { 'Content-Type': contentType, 'Content-Length': String(contentLength), 'Cache-Control': 'private, max-age=60' },
  });
}
