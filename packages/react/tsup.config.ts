import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react'],
  // Components and hooks run on the client; mark the bundle so it can be
  // imported from React Server Components (Next.js app router).
  banner: {
    js: "'use client';",
  },
});
