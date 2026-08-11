<script setup lang="ts">
// 分享目標接收頁：任何網頁 → 分享 → bookMark → 此頁 → 自動帶入網址開新增畫面
const { user, fetchMe } = useAuth()
const ui = useUI()

const route = useRoute()

onMounted(async () => {
  await fetchMe()
  if (!user.value) {
    // 未登入 → 去登入，登入後回此頁
    await navigateTo(`/login?returnTo=${encodeURIComponent(route.fullPath)}`)
    return
  }
  // 已登入 → 帶入分享的 URL/標題 → 回主頁開新增 modal
  const url = String(route.query.url || route.query.text || '').trim()
  const title = String(route.query.title || '').trim()
  if (url) {
    ui.setShareDraft({ url, title })
  }
  await navigateTo('/', { replace: true })
})
</script>

<template>
  <div class="flex h-screen items-center justify-center text-zinc-400">
    <p class="text-sm">準備新增書籤…</p>
  </div>
</template>
