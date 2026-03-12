import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const cryptoShim = resolve(__dirname, 'src/shims/crypto.ts');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'node:crypto': cryptoShim,
      crypto: cryptoShim,
    },
  },
});
