/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: srcPath,
      }
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}));
