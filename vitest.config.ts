import { defineVitestConfig } from '@nuxt/test-utils/config'

// Two kinds of tests:
//  - Pure logic (server services, schemas): default `node` environment — fast.
//  - Vue components/pages: add `// @vitest-environment nuxt` at the top of the file to get a
//    full Nuxt runtime (auto-imports, Nuxt UI, NuxtLink) via @nuxt/test-utils.
export default defineVitestConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
  },
})
