export interface BookmarkItem {
  id: string
  url: string
  title: string
  description: string | null
  favicon: string | null
  note: string | null
  important: boolean
  unread: boolean
  collectionId: string | null
  collection: { id: string; name: string; icon: string | null; color: string | null } | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface BookmarkFilters {
  q: string
  collection: string // 'all' | 'unsorted' | collectionId
  tag: string
  important: boolean
  unread: boolean
}

// 篩選 watcher 全域只註冊一次（module-level flag，避免每個元件各自註冊）
let useBookmarksWatchRegistered = false

// 書籤列表 + CRUD
export const useBookmarks = () => {
  const items = useState<BookmarkItem[]>('bookmarks:items', () => [])
  const total = useState<number>('bookmarks:total', () => 0)
  const loading = useState<boolean>('bookmarks:loading', () => false)
  const loadedOnce = useState<boolean>('bookmarks:loadedOnce', () => false)
  const filters = useState<BookmarkFilters>('bookmarks:filters', () => ({
    q: '',
    collection: 'all',
    tag: '',
    important: false,
    unread: false,
  }))

  async function fetch() {
    // 只在「整站首次載入」顯示載入中 — 之後切換篩選/搜尋都不閃爍
    if (!loadedOnce.value) loading.value = true
    try {
      const params: Record<string, string> = {}
      const hasQuery = !!filters.value.q.trim()
      if (hasQuery) params.q = filters.value.q.trim()
      // 有搜尋關鍵字時忽略收藏夾/標籤篩選 → 全域搜尋（符合 Raindrop 行為）
      if (!hasQuery) {
        if (filters.value.collection !== 'all') params.collection = filters.value.collection
        if (filters.value.tag) params.tag = filters.value.tag
      }
      if (filters.value.important) params.important = 'true'
      if (filters.value.unread) params.unread = 'true'

      const res = await $fetch<{ items: BookmarkItem[]; total: number }>('/api/bookmarks', { params })
      items.value = res.items
      total.value = res.total
      loadedOnce.value = true
    } finally {
      loading.value = false
    }
  }

  // 篩選條件改變 → debounce 後自動重新抓取（搜尋輸入不每個字都打 API）
  // 只註冊「一次」：useBookmarks 被 layout/sidebar/index/每張 BookmarkCard 呼叫，
  // 若每次呼叫都註冊 watch，切換篩選會觸發 N 個並行 fetch → 列表被替換 N 次 → 畫面頻閃
  let filterTimer: ReturnType<typeof setTimeout> | null = null
  if (!useBookmarksWatchRegistered && import.meta.client) {
    useBookmarksWatchRegistered = true
    watch(
      filters,
      () => {
        if (filterTimer) clearTimeout(filterTimer)
        filterTimer = setTimeout(fetch, 250)
      },
      { deep: true },
    )
  }

  async function create(data: Partial<BookmarkItem> & { url: string }) {
    const created = await $fetch<BookmarkItem>('/api/bookmarks', { method: 'POST', body: data })
    // 本地插入頂部，不重新抓列表（避免閃爍）
    items.value = [created, ...items.value]
    total.value += 1
    return created
  }

  async function update(id: string, data: Partial<BookmarkItem>) {
    const updated = await $fetch<BookmarkItem>(`/api/bookmarks/${id}`, {
      method: 'PATCH',
      body: data,
    })
    // 本地替換單筆，不重新抓列表（避免閃爍）
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx !== -1) {
      items.value = [...items.value.slice(0, idx), updated, ...items.value.slice(idx + 1)]
    }
    return updated
  }

  async function remove(id: string) {
    await $fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
    // 本地移除，不重新抓列表
    items.value = items.value.filter((i) => i.id !== id)
    total.value = Math.max(0, total.value - 1)
  }

  function setFilter(patch: Partial<BookmarkFilters>) {
    filters.value = { ...filters.value, ...patch }
  }

  return { items, total, loading, filters, fetch, create, update, remove, setFilter }
}
