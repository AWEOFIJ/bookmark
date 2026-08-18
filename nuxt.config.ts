import tailwindcss from '@tailwindcss/vite'

// 安全：Vercel 正式 build 必須提供 NUXT_SESSION_PASSWORD，
// 避免使用公開的 fallback key（session 可被偽造）
// 只在 Vercel build（VERCEL=1）檢查 — GH Actions 安裝階段（nuxt prepare）沒有此變數
if (process.env.VERCEL === '1' && process.env.NODE_ENV === 'production' && !process.env.NUXT_SESSION_PASSWORD) {
  throw new Error('NUXT_SESSION_PASSWORD is required in production')
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

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

  // 安全 headers（SSR 回應由 nitro 套用；Vercel 的 vercel.json headers 不會套到 serverless 頁面）
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      },
    },
  },

  typescript: {
    strict: true,
  },
})
