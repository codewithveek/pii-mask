import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    setupFiles: ['./src/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 85,
        functions: 90,
        branches: 80,
      },
      exclude: [
        '**/dist/**',
        '**/*.test.ts',
        'tsup.config.ts',
        'vitest.config.ts',
        'src/vitest-setup.ts',
        'src/index.ts',
        'src/lexicon/**',
      ],
    },
  },
});
