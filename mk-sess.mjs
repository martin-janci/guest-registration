import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const token = crypto.randomBytes(20).toString('base64url');
const id = crypto.createHash('sha256').update(token).digest('hex');
await prisma.session.create({ data: { id, userId: 1, expiresAt: new Date(Date.now() + 30*24*60*60*1000) } });
console.log(token);
await prisma.$disconnect();
