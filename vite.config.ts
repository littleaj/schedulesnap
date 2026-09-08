/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));
const firebaseProdPath = fileURLToPath(new URL('./src/contexts/firebase.prod.tsx', import.meta.url));
const firebaseDevPath = fileURLToPath(new URL('./src/contexts/firebase.dev.tsx', import.meta.url));

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
        find: '@/contexts/firebase',
        replacement: mode === 'development' ? firebaseDevPath : firebaseProdPath,
      },
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
