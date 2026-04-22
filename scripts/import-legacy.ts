#!/usr/bin/env tsx
import { parseArgs } from 'node:util';
import { run } from '@/modules/legacy-import';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      dump:    { type: 'string' },
      uploads: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  if (!values.dump || !values.uploads) {
    console.error('Usage: tsx scripts/import-legacy.ts --dump <file.sql> --uploads <file.tar> [--dry-run]');
    process.exit(2);
  }
  const result = await run({
    dumpPath: values.dump,
    uploadsPath: values.uploads,
    dryRun: Boolean(values['dry-run']),
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.discrepancies.length > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
