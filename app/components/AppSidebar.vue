<script setup lang="ts">
import {
  ArrowDownTrayIcon,
  FolderPlusIcon,
  InboxIcon,
  TagIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{ mobileOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { collections, tags, load, create } = useCollections()
const bookmarks = useBookmarks()
const { filters } = bookmarks

const showNewCollection = ref(false)
const newCollectionName = ref('')

// 展開狀態（收藏夾 id → boolean）
const expanded = useState<Record<string, boolean>>('sidebar:expanded', () => ({}))

function toggleExpand(id: string) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}

async function addCollection() {
  const name = newCollectionName.value.trim()
  if (!name) return
  await create({ name })
  newCollectionName.value = ''
  showNewCollection.value = false
}

function isActive(id: string) {
  return filters.value.collection === id
}

function selectCollection(id: string) {
  bookmarks.setFilter({ collection: id })
}

function selectTag(name: string) {
  bookmarks.setFilter({ tag: filters.value.tag === name ? '' : name })
}

// 展開有書籤的收藏夾（預設）
onMounted(() => {
  for (const c of collections.value) {
    if (c._count.bookmarks > 0 && expanded.value[c.id] === undefined) {
      expanded.value = { ...expanded.value, [c.id]: true }
    }
  }
})
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-72 transform border-r border-zinc-200 bg-zinc-50 transition-transform duration-200 lg:static lg:translate-x-0 dark:border-zinc-800 dark:bg-zinc-900"
    :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4">
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
            <Squares2X2Icon class="h-4.5 w-4.5" />
          </div>
          <span class="text-lg font-bold text-zinc-900 dark:text-white">bookMark</span>
        </div>
        <button class="lg:hidden" @click="emit('close')" aria-label="關閉側欄">
          <XMarkIcon class="h-5 w-5 text-zinc-500" />
        </button>
      </div>

      <!-- Collections -->
      <div class="px-3">
        <div class="mb-1 flex items-center justify-between px-2">
          <span class="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">收藏夾</span>
          <button
            class="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            @click="showNewCollection = !showNewCollection"
            aria-label="新增收藏夾"
          >
            <FolderPlusIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- 新增收藏夾 -->
        <div v-if="showNewCollection" class="mb-1 px-2">
          <input
            v-model="newCollectionName"
            type="text"
            placeholder="收藏夾名稱"
            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            @keyup.enter="addCollection"
            @keyup.esc="showNewCollection = false"
          />
        </div>

        <nav class="thin-scroll max-h-[45vh] space-y-0.5 overflow-y-auto pr-1">
          <!-- 全部 -->
          <button
            class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
            :class="filters.collection === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800'"
            @click="selectCollection('all')"
          >
            <InboxIcon class="h-4 w-4 shrink-0" />
            <span class="truncate">全部書籤</span>
          </button>

          <!-- 未分類 -->
          <button
            class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
            :class="filters.collection === 'unsorted' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800'"
            @click="selectCollection('unsorted')"
          >
            <span class="flex h-4 w-4 shrink-0 items-center justify-center">•</span>
            <span class="truncate">未分類</span>
          </button>

          <!-- 收藏夾樹（遞迴） -->
          <div v-for="col in collections" :key="col.id">
            <div
              class="group flex items-center gap-1 rounded-lg px-1 py-0.5 transition-colors"
              :class="isActive(col.id) ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-zinc-200/70 dark:hover:bg-zinc-800'"
            >
              <button
                v-if="col.children.length"
                class="w-5 shrink-0 text-zinc-400"
                @click="toggleExpand(col.id)"
                aria-label="展開/收合"
              >
                <svg
                  class="h-3 w-3 transition-transform"
                  :class="expanded[col.id] ? 'rotate-90' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                </svg>
              </button>
              <span v-else class="w-5 shrink-0" />
              <button
                class="flex flex-1 items-center gap-2 truncate py-1 text-sm"
                :class="isActive(col.id) ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'"
                @click="selectCollection(col.id)"
              >
                <span class="shrink-0 text-base leading-none">{{ col.icon || '📁' }}</span>
                <span class="truncate">{{ col.name }}</span>
                <span class="ml-auto shrink-0 text-xs text-zinc-400">{{ col._count.bookmarks }}</span>
              </button>
            </div>
            <div v-if="col.children.length && expanded[col.id]" class="ml-4 border-l border-zinc-200 pl-1 dark:border-zinc-800">
              <div v-for="child in col.children" :key="child.id" class="group flex items-center gap-1 rounded-lg px-1 py-0.5"
                :class="isActive(child.id) ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-zinc-200/70 dark:hover:bg-zinc-800'">
                <button class="flex flex-1 items-center gap-2 truncate py-1 text-sm pl-5"
                  :class="isActive(child.id) ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'"
                  @click="selectCollection(child.id)">
                  <span class="shrink-0 text-base leading-none">{{ child.icon || '📁' }}</span>
                  <span class="truncate">{{ child.name }}</span>
                  <span class="ml-auto shrink-0 text-xs text-zinc-400">{{ child._count.bookmarks }}</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <!-- Tags -->
      <div class="mt-4 px-3">
        <div class="mb-1 flex items-center gap-2 px-2">
          <TagIcon class="h-3.5 w-3.5 text-zinc-400" />
          <span class="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">標籤</span>
        </div>
        <div class="thin-scroll max-h-32 space-y-0.5 overflow-y-auto pr-1">
          <button
            v-for="t in tags"
            :key="t.id"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors"
            :class="filters.tag === t.name ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800'"
            @click="selectTag(t.name)"
          >
            <span class="truncate">#{{ t.name }}</span>
            <span class="ml-auto shrink-0 text-xs text-zinc-400">{{ t.count }}</span>
          </button>
          <p v-if="tags.length === 0" class="px-2 py-1 text-xs text-zinc-400">還沒有標籤</p>
        </div>
      </div>

      <div class="mt-auto border-t border-zinc-200 p-3 dark:border-zinc-800">
        <slot name="footer" />
      </div>
    </div>
  </aside>
</template>
