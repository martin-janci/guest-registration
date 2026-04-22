import { readFileSync } from 'node:fs';
import { Client } from 'pg';

export async function loadDumpIntoStaging(
  client: Client,
  dumpPath: string,
  stagingSchema: string,
): Promise<void> {
  const sql = readFileSync(dumpPath, 'utf8');
  await client.query(`DROP SCHEMA IF EXISTS "${stagingSchema}" CASCADE`);
  await client.query(`CREATE SCHEMA "${stagingSchema}"`);
  await client.query(`SET search_path TO "${stagingSchema}"`);
  await client.query(sql);
  await client.query('RESET search_path');
}

export async function dropStaging(client: Client, stagingSchema: string): Promise<void> {
  await client.query(`DROP SCHEMA IF EXISTS "${stagingSchema}" CASCADE`);
}
