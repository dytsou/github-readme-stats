import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/e2e/',
        'tests/E2E/',
      ],
    },
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**',
    ],
    testTimeout: 10000,
  },
});

