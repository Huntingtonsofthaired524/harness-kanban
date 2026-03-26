/// <reference types="vitest" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    testTimeout: 10000,
    exclude: ['node_modules', 'tests'],
    setupFiles: ['./src/test-setup.ts'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
