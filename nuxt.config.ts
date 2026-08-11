import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // Server-only secrets (overridden by .env NUXT_SESSION_PASSWORD)
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'bookmark-dev-secret-change-me-in-production',
    public: {
      appName: 'bookMark',
    },
  },

  app: {
    head: {
      title: 'bookMark — 書籤收藏管理',
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '自架書籤收藏管理（仿 Raindrop.io）— 收藏、分類、標籤、搜尋' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  nitro: {
    compressPublicAssets: true,
  },

  typescript: {
    strict: true,
  },
})
