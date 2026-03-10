import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
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
        'src/index.ts',
        'src/commands/mask.ts',
        'src/utils/stdin.ts',
      ],
    },
  },
});
