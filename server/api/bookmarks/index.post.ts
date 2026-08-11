export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readBody(event)
  const url = String(body.url || '').trim()
  if (!url) throw createError({ statusCode: 400, statusMessage: '請輸入網址' })

  let title = String(body.title || '').trim()
  let description = body.description ? String(body.description).trim() : ''
  let favicon = body.favicon ? String(body.favicon).trim() : ''
  const collectionId = body.collectionId ? String(body.collectionId) : null
  const note = body.note ? String(body.note).trim() : ''
  const important = Boolean(body.important)
  const unread = Boolean(body.unread)

  // 若前端沒給 meta，後端補抓（best effort）
  if (!title || !favicon) {
    try {
      const meta = await fetchUrlMeta(url)
      if (!title) title = meta.title
      if (!favicon) favicon = meta.favicon
      if (!description) description = meta.description
    } catch {
      if (!title) title = url
    }
  }

  const tags = await parseTags(body.tags)

  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title,
      description,
      favicon,
      note,
      important,
      unread,
      collectionId,
      tags: {
        create: tags.map((name) => ({
          tag: { connect: { id: name } },
        })),
      },
    },
    include: {
      collection: { select: { id: true, name: true, icon: true, color: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })

  return serializeBookmark(bookmark as any)
})

// 標籤輸入：陣列或逗號分隔字串 → 確保存在 → 回傳 tag id
async function parseTags(input: unknown): Promise<string[]> {
  const names: string[] = []
  if (Array.isArray(input)) {
    for (const t of input) names.push(String(t).trim())
  } else if (typeof input === 'string' && input.trim()) {
    names.push(...input.split(','))
  }
  const unique = [...new Set(names.filter(Boolean))]

  const results = await Promise.all(
    unique.map((name) =>
      prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
        select: { id: true },
      }),
    ),
  )
  return results.map((r) => r.id)
}
