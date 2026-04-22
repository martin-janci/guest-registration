export async function register(): Promise<void> {
  // Only boot the scheduler in the Node runtime (not Edge) and in production.
  // Dev mode would re-register on every hot reload and spam cron jobs.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.DISABLE_SCHEDULER === '1') return;

  const { startScheduler } = await import('@/modules/scheduler');
  startScheduler();
  console.log('[instrumentation] node-cron scheduler started');
}
