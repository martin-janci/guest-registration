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
    hookTimeout: 60_000,
    setupFiles: ['./tests/setup/env.ts'],
  },
});
