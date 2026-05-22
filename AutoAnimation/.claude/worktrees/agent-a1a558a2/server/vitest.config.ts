import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['services/**/*.{test,spec}.{ts,tsx}'],
    environment: 'node',
  },
})
