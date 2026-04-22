import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    testTimeout: 60_000,
    // Testcontainers (Postgres + MinIO) teardown occasionally takes >10 s on
    // macOS Docker — bump hookTimeout so afterAll container.stop() doesn't
    // flake the suite.
    hookTimeout: 120_000,
    setupFiles: ['./tests/setup/env.ts'],
    // Serialise test files — every integration spec spins up its own
    // Postgres / MinIO container, and Docker Desktop's Testcontainers Reaper
    // races when >4 files boot containers in parallel. Sequential keeps the
    // suite green at the cost of wall-clock time (~4 min total).
    fileParallelism: false,
  },
});
