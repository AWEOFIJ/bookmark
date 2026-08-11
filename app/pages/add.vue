<script setup lang="ts">
// 分享目標接收頁：任何網頁 → 分享 → bookMark → 此頁 → 自動帶入網址開新增畫面
const { user, fetchMe } = useAuth()

const route = useRoute()

// 分享參數常混入「標題 + 網址」，只取出真正的 URL
function extractShareUrl(input: string): string {
  const m = input.match(/https?:\/\/[^\s'"<>]+/)
  return m ? m[0] : input.trim()
}

// 標題：raw 是乾淨 URL 時用 query.title；否則取網址前面的文字
function extractShareTitle(raw: string, url: string, qTitle: string): string {
  if (raw === url) return qTitle.trim()
  const idx = raw.indexOf(url)
  const before = idx > 0 ? raw.slice(0, idx).trim() : ''
  return before || qTitle.trim()
}

onMounted(async () => {
  await fetchMe()
  if (!user.value) {
    // 未登入 → 去登入，登入後回此頁
    await navigateTo(`/login?returnTo=${encodeURIComponent(route.fullPath)}`)
    return
  }
  // 已登入 → 用 sessionStorage 傳草稿（跨頁面可靠）→ 回主頁開新增 modal
  const raw = String(route.query.url || route.query.text || '').trim()
  const url = extractShareUrl(raw)
  const title = extractShareTitle(raw, url, String(route.query.title || ''))
  if (url) {
    if (import.meta.client) {
      sessionStorage.setItem('bm-draft', JSON.stringify({ url, title }))
    }
  }
  await navigateTo('/', { replace: true })
})
</script>

<template>
  <div class="flex h-screen items-center justify-center text-zinc-400">
    <p class="text-sm">準備新增書籤…</p>
  </div>
</template>
