import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@app': r('./src/app'),
      '@pages': r('./src/pages'),
      '@widgets': r('./src/widgets'),
      '@features': r('./src/features'),
      '@shared': r('./src/shared'),
      '@mocks': r('./src/mocks'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
