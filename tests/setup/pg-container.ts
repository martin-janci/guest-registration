import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

export async function startPg(): Promise<{
  container: StartedPostgreSqlContainer;
  prisma: PrismaClient;
  url: string;
}> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test')
    .withUsername('test')
    .withPassword('test')
    .start();
  const url = container.getConnectionUri();

  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });

  // Set DATABASE_URL before PrismaClient is instantiated so the singleton
  // in src/db/client.ts picks up the test-container URL on first import.
  process.env.DATABASE_URL = url;

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  return { container, prisma, url };
}
