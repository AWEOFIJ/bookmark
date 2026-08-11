export default defineEventHandler(async (event) => {
  await requireUser(event)

  const q = getQuery(event)
  const search = String(q.q || '').trim()
  const collection = q.collection ? String(q.collection) : ''
  const tag = q.tag ? String(q.tag) : ''
  const limit = Math.min(Number(q.limit) || 50, 200)
  const offset = Math.max(Number(q.offset) || 0, 0)

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { url: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (collection === 'unsorted') {
    where.collectionId = null
  } else if (collection && collection !== 'all') {
    where.collectionId = collection
  }

  if (tag) {
    where.tags = { some: { tag: { name: tag } } }
  }

  if (q.important === 'true') where.important = true
  if (q.unread === 'true') where.unread = true

  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      include: {
        collection: { select: { id: true, name: true, icon: true, color: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: [{ important: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ])

  return { items: items.map(serializeBookmark), total }
})
