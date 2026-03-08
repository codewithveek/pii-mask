import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'lexicon/africa': 'src/lexicon/africa.ts',
    'lexicon/south-asia': 'src/lexicon/south-asia.ts',
    'lexicon/east-asia': 'src/lexicon/east-asia.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
