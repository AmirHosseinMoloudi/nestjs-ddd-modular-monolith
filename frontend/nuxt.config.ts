// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
      grafanaUrl: process.env.NUXT_PUBLIC_GRAFANA_URL || 'http://localhost:3002'
    }
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Enterprise Task Platform | DDD Modular Monolith',
      meta: [
        { name: 'description', content: 'Enterprise-grade DDD Modular Monolith Todo Platform' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})
