import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Vitest resolves the same `@shared` / `@renderer` path aliases the electron-vite build uses, so unit
 * tests can import modules by their production path (e.g. `@shared/ipc`) instead of brittle relative
 * traversals.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer'),
    },
  },
});
