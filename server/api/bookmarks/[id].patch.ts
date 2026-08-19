export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = String(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  const existing = await prisma.bookmark.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: '書籤不存在' })

  const data: Record<string, unknown> = {}

  if (body.url !== undefined) data.url = String(body.url).trim() || existing.url
  if (body.title !== undefined) data.title = String(body.title).trim() || existing.title
  if (body.description !== undefined) data.description = String(body.description).trim()
  if (body.favicon !== undefined) data.favicon = String(body.favicon).trim() || null
  if (body.note !== undefined) data.note = String(body.note).trim() || null
  if (body.important !== undefined) data.important = Boolean(body.important)
  if (body.unread !== undefined) data.unread = Boolean(body.unread)
  if (body.collectionId !== undefined) {
    data.collectionId = body.collectionId ? String(body.collectionId) : null
  }

  // tags 若有提供 → 整個替換
  if (body.tags !== undefined) {
    const names: string[] = []
    if (Array.isArray(body.tags)) {
      for (const t of body.tags) names.push(String(t).trim())
    } else if (typeof body.tags === 'string' && body.tags.trim()) {
      names.push(...body.tags.split(','))
    }
    const unique = [...new Set(names.filter(Boolean))]

    const tagIds = await Promise.all(
      unique.map((name) =>
        prisma.tag.upsert({ where: { name }, create: { name }, update: {}, select: { id: true } }),
      ),
    )

    await prisma.bookmarkTag.deleteMany({ where: { bookmarkId: id } })
    data.tags = {
      create: tagIds.map((t) => ({ tag: { connect: { id: t.id } } })),
    }
  }

  let bookmark
  try {
    bookmark = await prisma.bookmark.update({
      where: { id },
      data,
      include: {
        collection: { select: { id: true, name: true, icon: true, color: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    })
  } catch (e: any) {
    // URL 改到已被其他書籤使用的網址 → 唯一約束衝突
    if (e?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: '已有相同網址的書籤' })
    }
    throw e
  }

  return serializeBookmark(bookmark as any)
})
