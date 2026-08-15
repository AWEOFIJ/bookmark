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
    // Google OAuth（登入用）
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    public: {
      appName: 'bookMark',
      // 讓前端知道是否啟用 Google 登入按鈕
      googleLoginEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
  },

  app: {
    head: {
      title: 'bookMark — 書籤收藏管理',
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '自架書籤收藏管理（仿 Raindrop.io）— 收藏、分類、標籤、搜尋' },
        { name: 'theme-color', content: '#4f46e5' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-startup-image', href: '/icons/icon-512.png' },
      ],
    },
  },

  nitro: {
    compressPublicAssets: true,
  },

  typescript: {
    strict: true,
  },
})
