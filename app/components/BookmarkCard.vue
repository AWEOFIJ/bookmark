<script setup lang="ts">
import { ArrowTopRightOnSquareIcon, PencilSquareIcon, StarIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'
import type { BookmarkItem } from '~/composables/useBookmarks'

const props = defineProps<{ bookmark: BookmarkItem }>()
const emit = defineEmits<{ edit: [BookmarkItem]; remove: [BookmarkItem] }>()

const bookmarks = useBookmarks()

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const day = 1000 * 60 * 60 * 24
  if (diff < day) return '今天'
  if (diff < 2 * day) return '昨天'
  return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

async function toggleImportant() {
  await bookmarks.update(props.bookmark.id, { important: !props.bookmark.important })
}

async function remove() {
  if (!confirm(`確定刪除「${props.bookmark.title}」？`)) return
  emit('remove', props.bookmark)
}
</script>

<template>
  <article
    class="card-hover group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
  >
    <!-- 未讀提示 -->
    <span
      v-if="bookmark.unread"
      class="absolute right-3 top-3 h-2 w-2 rounded-full bg-indigo-500"
      title="未讀"
    />

    <!-- 標題列（點標題 = 開啟連結） -->
    <a
      :href="bookmark.url"
      target="_blank"
      rel="noopener noreferrer"
      class="group/title flex items-start gap-3"
      :title="`在新分頁開啟：${bookmark.url}`"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <img v-if="bookmark.favicon" :src="bookmark.favicon" alt="" class="h-5 w-5 object-contain" loading="lazy" />
        <span v-else class="text-lg">🔖</span>
      </div>
      <div class="min-w-0">
        <h3 class="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover/title:text-indigo-600 dark:text-zinc-100 dark:group-hover/title:text-indigo-400">
          {{ bookmark.title || hostname(bookmark.url) }}
        </h3>
        <p class="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-400">
          {{ hostname(bookmark.url) }}
          <ArrowTopRightOnSquareIcon class="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100" />
        </p>
      </div>
    </a>

    <!-- 描述 -->
    <p v-if="bookmark.description" class="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
      {{ bookmark.description }}
    </p>

    <!-- 收藏夾 + 標籤 -->
    <div class="mt-3 flex flex-wrap items-center gap-1">
      <span
        v-if="bookmark.collection"
        class="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      >
        {{ bookmark.collection.icon || '📁' }} {{ bookmark.collection.name }}
      </span>
      <span
        v-for="t in bookmark.tags.slice(0, 3)"
        :key="t"
        class="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
      >
        #{{ t }}
      </span>
      <span v-if="bookmark.tags.length > 3" class="text-[11px] text-zinc-400">+{{ bookmark.tags.length - 3 }}</span>
    </div>

    <!-- Footer：操作按鈕常駐（圖示+文字，明確可辨識） -->
    <div class="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
      <span class="text-[11px] text-zinc-400">{{ formatDate(bookmark.createdAt) }}</span>
      <div class="flex items-center gap-1.5">
        <button
          class="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors"
          :class="bookmark.important
            ? 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400'
            : 'border-zinc-200 bg-white text-zinc-500 hover:border-amber-300 hover:text-amber-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-amber-500/50 dark:hover:text-amber-400'"
          :title="bookmark.important ? '取消重要' : '設為重要'"
          @click="toggleImportant"
        >
          <StarIconSolid v-if="bookmark.important" class="h-4 w-4 text-amber-500" />
          <StarIcon v-else class="h-4 w-4" />
          <span v-if="bookmark.important" class="hidden sm:inline">重要</span>
        </button>
        <button
          class="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-400"
          title="編輯書籤"
          @click="emit('edit', bookmark)"
        >
          <PencilSquareIcon class="h-4 w-4" />
          <span class="hidden sm:inline">編輯</span>
        </button>
        <button
          class="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-red-500/50 dark:hover:bg-red-500/15 dark:hover:text-red-400"
          title="刪除書籤"
          @click="remove"
        >
          <TrashIcon class="h-4 w-4" />
          <span class="hidden sm:inline">刪除</span>
        </button>
      </div>
    </div>
  </article>
</template>
