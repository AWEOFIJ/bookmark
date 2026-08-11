// 註冊 Service Worker（PWA 可安裝）
export default defineNuxtPlugin(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW 註冊失敗不影響使用
      })
    })
  }
})
