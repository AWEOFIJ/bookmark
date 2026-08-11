<script setup lang="ts">
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
} from '@heroicons/vue/24/outline'

// 主畫面 layout：側欄 + 頂欄 + 頁面內容（slot）
const { user, logout } = useAuth()
const { collections, load: loadCollections } = useCollections()
const bookmarks = useBookmarks()
const { filters } = bookmarks
const theme = useTheme()
const { isDark } = theme
const ui = useUI()

const sidebarOpen = ref(false)

// 標題列
const viewTitle = computed(() => {
  if (filters.value.q) return `搜尋「${filters.value.q}」`
  if (filters.value.collection === 'unsorted') return '未分類'
  if (filters.value.collection !== 'all') {
    const col = collections.value.find((c) => c.id === filters.value.collection)
    if (col) return col.name
  }
  return '全部書籤'
})

async function onLogout() {
  await logout()
  await navigateTo('/login')
}

onMounted(() => {
  theme.init()
  loadCollections()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/30 lg:hidden" @click="sidebarOpen = false" />

    <AppSidebar :mobile-open="sidebarOpen" @close="sidebarOpen = false">
      <template #footer>
        <button
          class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
          @click="ui.openImport"
        >
          <ArrowDownTrayIcon class="h-4 w-4" />
          匯入書籤（Raindrop）
        </button>
        <div class="mt-2 flex items-center justify-between gap-2 px-2">
          <span class="truncate text-xs text-zinc-400">{{ user?.email }}</span>
          <button class="shrink-0 text-xs text-zinc-400 hover:text-red-500" @click="onLogout">登出</button>
        </div>
      </template>
    </AppSidebar>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Topbar -->
      <header class="flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <button class="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800" @click="sidebarOpen = true" aria-label="開啟側欄">
          <Bars3Icon class="h-5 w-5" />
        </button>

        <h1 class="hidden text-base font-bold sm:block">{{ viewTitle }}</h1>

        <!-- Search -->
        <div class="relative max-w-md flex-1">
          <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            v-model="filters.q"
            type="search"
            placeholder="搜尋標題、描述、網址…"
            class="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
          />
        </div>

        <!-- 重要 filter -->
        <button
          class="hidden rounded-lg px-2.5 py-1.5 text-sm sm:block"
          :class="filters.important ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
          @click="bookmarks.setFilter({ important: !filters.important })"
        >
          ★ 重要
        </button>

        <!-- 未讀 filter -->
        <button
          class="hidden rounded-lg px-2.5 py-1.5 text-sm sm:block"
          :class="filters.unread ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
          @click="bookmarks.setFilter({ unread: !filters.unread })"
        >
          未讀
        </button>

        <button
          class="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          :title="isDark ? '切換淺色' : '切換深色'"
          @click="theme.toggle"
        >
          <SunIcon v-if="isDark" class="h-5 w-5" />
          <MoonIcon v-else class="h-5 w-5" />
        </button>

        <button
          class="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          @click="ui.openAdd"
        >
          <PlusIcon class="h-4 w-4" />
          <span class="hidden sm:inline">新增書籤</span>
        </button>
      </header>

      <!-- Content -->
      <main class="thin-scroll flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
