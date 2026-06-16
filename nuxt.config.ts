// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Server-only secrets. Override via NUXT_* env vars (see .env.example).
    epcApiEmail: '', // NUXT_EPC_API_EMAIL
    epcApiKey: '', // NUXT_EPC_API_KEY
    tflAppKey: '', // NUXT_TFL_APP_KEY
    dbUrl: 'file:./data/app.db', // NUXT_DB_URL
    public: {
      // Exposed to the client.
      maptilerKey: '', // NUXT_PUBLIC_MAPTILER_KEY
      appBaseUrl: 'http://localhost:3000', // NUXT_PUBLIC_APP_BASE_URL (used by the bookmarklet)
    },
  },
})
