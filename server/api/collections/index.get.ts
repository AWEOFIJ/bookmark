export default defineEventHandler(async (event) => {
  await requireUser(event)

  const collections = await prisma.collection.findMany({
    include: {
      _count: { select: { bookmarks: true } },
      children: { select: { id: true, name: true, icon: true, color: true, parentId: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  // 建樹狀結構
  const map = new Map<string, any>()
  for (const c of collections) {
    map.set(c.id, { ...c, children: [] })
  }
  const roots: any[] = []
  for (const c of map.values()) {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId).children.push(c)
    } else {
      roots.push(c)
    }
  }

  return roots
})
