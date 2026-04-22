export interface ImportOptions {
  dumpPath: string;
  uploadsPath: string;
  dryRun: boolean;
}

export interface ImportResult {
  counts: Record<string, number>;
  uploaded: number;
  discrepancies: string[];
  durationMs: number;
}

export async function run(opts: ImportOptions): Promise<ImportResult> {
  void opts;
  throw new Error('not implemented — fleshed out in later tasks');
}
