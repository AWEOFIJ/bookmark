<script setup lang="ts">
import { ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { BookmarkItem } from '~/composables/useBookmarks'

const props = defineProps<{
  bookmark?: BookmarkItem | null
  initial?: { url: string; title: string } | null
}>()
const emit = defineEmits<{ close: []; saved: []; 'open-existing': [bookmark: any] }>()

const bookmarks = useBookmarks()
const { collections, tags, flatten } = useCollections()

const form = reactive({
  url: '',
  title: '',
  description: '',
  favicon: '',
  collectionId: '' as string,
  tags: '',
  important: false,
  unread: false,
})
const fetching = ref(false)
const saving = ref(false)
const error = ref('')
// 方案 C：儲存時發現 URL 已存在 → 顯示「已收藏過」警告
const dupExisting = ref<any>(null)

// 編輯模式載入
watch(
  () => props.bookmark,
  (b) => {
    if (b) {
      form.url = b.url
      form.title = b.title
      form.description = b.description || ''
      form.favicon = b.favicon || ''
      form.collectionId = b.collectionId || ''
      form.tags = b.tags.join(', ')
      form.important = b.important
      form.unread = b.unread
    } else {
      form.url = ''
      form.title = ''
      form.description = ''
      form.favicon = ''
      form.collectionId = ''
      form.tags = ''
      form.important = false
      form.unread = false
    }
    error.value = ''
  },
  { immediate: true },
)

const flattened = computed(() => flatten())

// 來自分享目標的草稿（prop 傳遞，mount 時即有值）→ 自動填 URL/標題 + 抓 meta
watch(
  () => props.initial,
  (d) => {
    if (d) {
      form.url = d.url || ''
      if (d.title) form.title = d.title
      if (form.url) fetchMeta()
    }
  },
  { immediate: true },
)

// 貼上 / 修改 URL 後自動抓 meta（debounce 600ms）— 不用再手動按「自動抓取」
let fetchTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => form.url,
  (val) => {
    if (props.bookmark) return // 編輯模式不自動抓
    if (!val || !val.trim()) return
    if (fetchTimer) clearTimeout(fetchTimer)
    fetchTimer = setTimeout(() => {
      if (val.trim() === form.url.trim()) fetchMeta()
    }, 600)
  },
)

async function fetchMeta() {
  const url = form.url.trim()
  if (!url) {
    error.value = '請先輸入網址'
    return
  }
  fetching.value = true
  error.value = ''
  try {
    const meta = await $fetch<{ title: string; description: string; favicon: string; hostname: string }>(
      '/api/fetch-meta',
      { method: 'POST', body: { url } },
    )
    if (!form.title) form.title = meta.title
    if (!form.description) form.description = meta.description
    if (!form.favicon) form.favicon = meta.favicon
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '無法取得網頁資訊'
  } finally {
    fetching.value = false
  }
}

async function save() {
  const url = form.url.trim()
  if (!url) {
    error.value = '請輸入網址'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload = {
      url,
      title: form.title.trim(),
      description: form.description.trim(),
      favicon: form.favicon.trim(),
      collectionId: form.collectionId || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      important: form.important,
      unread: form.unread,
    }
    if (props.bookmark) {
      await bookmarks.update(props.bookmark.id, payload)
    } else {
      await bookmarks.create(payload as any)
    }
    emit('saved')
    emit('close')
  } catch (e: any) {
    // URL 已存在（方案 C）→ 顯示警告 + 提供開啟原有
    if (e?.data?.statusCode === 409) {
      dupExisting.value = e?.data?.data?.existing ?? true
    } else {
      error.value = e?.data?.statusMessage || '儲存失敗'
    }
  } finally {
    saving.value = false
  }
}

// 開啟已收藏的書籤 → 同一個 modal 切換成編輯模式（父層 openEdit）
function openExisting() {
  const ex = dupExisting.value
  dupExisting.value = null
  if (ex && typeof ex === 'object') {
    emit('open-existing', ex)
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.esc="emit('close')">
    <!-- Backdrop -->
    <div class="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

    <div class="animate-pop-in relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white">
          {{ bookmark ? '編輯書籤' : '新增書籤' }}
        </h2>
        <button class="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" @click="emit('close')" aria-label="關閉">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- URL -->
      <label class="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">網址 *</label>
      <div class="flex gap-2">
        <input
          v-model="form.url"
          type="url"
          placeholder="https://example.com/article"
          class="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          @keyup.enter="fetchMeta"
        />
        <button
          class="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
          :disabled="fetching"
          @click="fetchMeta"
        >
          <ArrowPathIcon v-if="fetching" class="h-4 w-4 animate-spin" />
          <span v-else>自動抓取</span>
        </button>
      </div>

      <!-- Favicon preview -->
      <div v-if="form.favicon" class="mt-2 flex items-center gap-2">
        <img :src="form.favicon" alt="" class="h-5 w-5 object-contain" />
        <span class="text-xs text-zinc-400">已取得網站圖示</span>
      </div>

      <!-- Title -->
      <label class="mt-3 mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">標題</label>
      <input
        v-model="form.title"
        type="text"
        placeholder="書籤標題"
        class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
      />

      <!-- Description -->
      <label class="mt-3 mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">描述</label>
      <textarea
        v-model="form.description"
        rows="2"
        placeholder="簡短描述（選擇性）"
        class="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
      />

      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <!-- Collection -->
        <div>
          <label class="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">收藏夾</label>
          <select
            v-model="form.collectionId"
            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            <option value="">未分類</option>
            <option v-for="c in flattened" :key="c.id" :value="c.id">
              {{ '　'.repeat(c.depth) }}{{ c.name }}
            </option>
          </select>
        </div>

        <!-- Tags -->
        <div>
          <label class="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">標籤（逗號分隔）</label>
          <input
            v-model="form.tags"
            type="text"
            placeholder="vue, 開源"
            list="tag-options"
            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          <datalist id="tag-options">
            <option v-for="t in tags" :key="t.id" :value="t.name" />
          </datalist>
        </div>
      </div>

      <!-- Toggles -->
      <div class="mt-4 flex gap-4">
        <label class="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input v-model="form.important" type="checkbox" class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
          重要
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input v-model="form.unread" type="checkbox" class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
          未讀
        </label>
      </div>

      <!-- 方案 C：URL 已收藏過警告 -->
      <div
        v-if="dupExisting"
        class="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-900/20"
      >
        <p class="font-semibold text-amber-800 dark:text-amber-300">⚠️ 此網址已收藏過</p>
        <p v-if="dupExisting !== true && dupExisting.title" class="mt-1 truncate text-amber-700 dark:text-amber-400">
          {{ dupExisting.title }}
        </p>
        <p class="mt-1 text-xs text-amber-600 dark:text-amber-500">URL 唯一，無法重複儲存相同網址。</p>
        <div class="mt-2 flex gap-2">
          <button
            class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            @click="openExisting"
          >
            開啟原有書籤
          </button>
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
            @click="dupExisting = null"
          >
            繼續編輯
          </button>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-500">{{ error }}</p>

      <!-- Actions -->
      <div class="mt-5 flex justify-end gap-2">
        <button
          class="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? '儲存中…' : bookmark ? '儲存變更' : '新增書籤' }}
        </button>
      </div>
    </div>
  </div>
</template>
