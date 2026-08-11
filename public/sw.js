// 最小 Service Worker — 讓 bookMark 可安裝為 PWA（加到主畫面）
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // 網路優先，暫不離線快取
})
