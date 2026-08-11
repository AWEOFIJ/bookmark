<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

// 主頁：需要登入
const { user, loading, fetchMe } = useAuth()
const { load: loadCollections } = useCollections()
const bookmarks = useBookmarks()
const { showAdd, showImport, editing, openEdit, closeAll, setShareDraft } = useUI()

// Vue 3 template 只對「解構後」的 ref 自動解包 — 直接取物件屬性不會解包
const { items, loading: bookmarksLoading } = bookmarks

async function onRemove(b: BookmarkItem) {
  await bookmarks.remove(b.id)
}

async function onSaved() {
  loadCollections()
}

onMounted(async () => {
  await fetchMe()
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  loadCollections()
  bookmarks.fetch()

  // 從分享目標（/add）帶來的草稿 → 開新增 modal
  if (import.meta.client) {
    const draft = sessionStorage.getItem('bm-draft')
    if (draft) {
      sessionStorage.removeItem('bm-draft')
      try {
        const d = JSON.parse(draft)
        ui.setShareDraft({ url: d.url || '', title: d.title || '' })
      } catch {
        // 解析失敗忽略
      }
    }
  }
})

const ready = computed(() => !loading.value && !!user.value)
</script>

<template>
  <div class="p-4 sm:p-6">
    <div v-if="!ready" class="flex h-64 items-center justify-center text-zinc-400">
      <p class="text-sm">檢查登入狀態…</p>
    </div>

    <template v-else>
      <h1 class="mb-4 block text-lg font-bold sm:hidden">全部書籤</h1>

      <div v-if="bookmarksLoading && items.length === 0" class="flex flex-col items-center gap-3 py-24 text-zinc-400">
        <ArrowPathIcon class="h-6 w-6 animate-spin" />
        <span class="text-sm">載入中…</span>
      </div>

      <div v-else-if="items.length === 0" class="flex flex-col items-center gap-2 py-24 text-center">
        <span class="text-5xl">🔖</span>
        <p class="text-lg font-medium text-zinc-500 dark:text-zinc-400">這裡還沒有書籤</p>
        <p class="text-sm text-zinc-400">點右上角「新增書籤」貼上網址，或從側欄「匯入書籤」</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <BookmarkCard
          v-for="b in items"
          :key="b.id"
          :bookmark="b"
          @edit="openEdit"
          @remove="onRemove"
        />
      </div>

      <BookmarkModal v-if="showAdd" :bookmark="editing" @close="closeAll" @saved="onSaved" />
      <ImportModal v-if="showImport" @close="closeAll" @imported="onSaved" />
    </template>
  </div>
</template>
