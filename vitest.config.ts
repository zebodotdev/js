import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        settings: {
          disableJavaScriptFileLoading: true,
        },
      },
    },
    include: ['packages/**/*.test.ts'],
    restoreMocks: true,
  },
})
