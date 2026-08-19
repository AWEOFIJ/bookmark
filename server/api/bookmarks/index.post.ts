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

  // meta（標題/圖示）由前端 prefetch（/api/fetch-meta）提供；
  // 這裡不做同步抓取 — 避免儲存被慢站卡住 1~4 秒。
  // title 空白時用網域兜底，使用者可事後編輯。
  if (!title) {
    try {
      title = new URL(url).hostname
    } catch {
      title = url
    }
  }

  const tags = await parseTags(body.tags)

  // URL 唯一 — 已存在 → 409（附既有書籤，前端顯示「已收藏過」警告）
  const existingDup = await prisma.bookmark.findUnique({
    where: { url },
    include: {
      collection: { select: { id: true, name: true, icon: true, color: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })
  if (existingDup) {
    throw createError({
      statusCode: 409,
      statusMessage: '此網址已收藏過',
      data: { existing: serializeBookmark(existingDup as any) },
    })
  }

  let bookmark
  try {
    bookmark = await prisma.bookmark.create({
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
  } catch (e: any) {
    // 併發防護：唯一約束兜底（正常路徑已被上面的 pre-check 擋下）
    if (e?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: '此網址已收藏過' })
    }
    throw e
  }

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
