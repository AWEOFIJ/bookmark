export interface CollectionNode {
  id: string
  name: string
  icon: string | null
  color: string | null
  parentId: string | null
  _count: { bookmarks: number }
  children: CollectionNode[]
}

export interface TagInfo {
  id: string
  name: string
  count: number
}

// 收藏夾 + 標籤資料
export const useCollections = () => {
  const collections = useState<CollectionNode[]>('collections', () => [])
  const tags = useState<TagInfo[]>('tags', () => [])
  const loaded = useState<boolean>('collections:loaded', () => false)

  async function load() {
    const [c, t] = await Promise.all([
      $fetch<CollectionNode[]>('/api/collections'),
      $fetch<TagInfo[]>('/api/tags'),
    ])
    collections.value = c
    tags.value = t
    loaded.value = true
  }

  async function create(data: { name: string; icon?: string; parentId?: string }) {
    const created = await $fetch<CollectionNode>('/api/collections', {
      method: 'POST',
      body: data,
    })
    await load()
    return created
  }

  async function update(id: string, data: { name?: string; icon?: string }) {
    const updated = await $fetch<CollectionNode>(`/api/collections/${id}`, {
      method: 'PATCH',
      body: data,
    })
    await load()
    return updated
  }

  async function remove(id: string) {
    await $fetch(`/api/collections/${id}`, { method: 'DELETE' })
    await load()
  }

  // 攤平樹，方便下拉選單使用
  function flatten(nodes: CollectionNode[] = collections.value, depth = 0): { id: string; name: string; depth: number }[] {
    const out: { id: string; name: string; depth: number }[] = []
    for (const n of nodes) {
      out.push({ id: n.id, name: n.name, depth })
      out.push(...flatten(n.children, depth + 1))
    }
    return out
  }

  return { collections, tags, loaded, load, create, update, remove, flatten }
}
