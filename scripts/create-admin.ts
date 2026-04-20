import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { prisma } from '@/db/client';
import { hashPassword } from '@/modules/auth/password';

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    const username = (await rl.question('Username: ')).trim();
    const email = (await rl.question('Email: ')).trim();
    const password = (await rl.question('Password: ')).trim();
    if (!username || !email || !password) throw new Error('All fields required');

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await hashPassword(password),
        role: 'SUPERADMIN',
      },
    });
    console.log(`Created user ${user.id} (${user.username}) as SUPERADMIN`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
