export default defineEventHandler(async (event) => {
  await requireUser(event)

  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: '請上傳 HTML 檔案' })

  const file = parts.find((p) => p.name === 'file' && p.filename)
  if (!file || !file.data || file.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '請選擇 .html 檔案' })
  }

  const html = Buffer.from(file.data).toString('utf-8')
  const { bookmarks, collections } = parseNetscapeHtml(html)

  if (bookmarks.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '找不到任何書籤，請確認是 Netscape 格式（Raindrop 匯出）的 HTML' })
  }

  // 建立收藏夾樹（父層先出現，依序建立即可）
  const collectionIdByPath = new Map<string, string>()
  for (const c of collections) {
    const parentId = c.parentPath === '/' ? null : (collectionIdByPath.get(c.parentPath) ?? null)
    const existing = await prisma.collection.findFirst({
      where: { name: c.name, parentId },
      select: { id: true },
    })
    let id: string
    if (existing) {
      id = existing.id
    } else {
      const created = await prisma.collection.create({
        data: { name: c.name, parentId },
        select: { id: true },
      })
      id = created.id
    }
    const fullPath = c.parentPath === '/' ? c.name : `${c.parentPath}/${c.name}`
    collectionIdByPath.set(fullPath, id)
  }

  // 建立書籤（批次）
  let created = 0
  let skipped = 0
  for (const b of bookmarks) {
    if (!b.url) {
      skipped++
      continue
    }
    const collectionId = b.collectionPath === '/' ? null : (collectionIdByPath.get(b.collectionPath) ?? null)

    // 重複網址跳過（同 URL 已有時，跳過避免重複）
    const dup = await prisma.bookmark.findFirst({ where: { url: b.url }, select: { id: true } })
    if (dup) {
      skipped++
      continue
    }

    const tagIds = await Promise.all(
      [...new Set(b.tags)].map((name) =>
        prisma.tag.upsert({ where: { name }, create: { name }, update: {}, select: { id: true } }),
      ),
    )

    await prisma.bookmark.create({
      data: {
        url: b.url,
        title: b.title || b.url,
        description: b.description || null,
        collectionId,
        tags: { create: tagIds.map((t) => ({ tag: { connect: { id: t.id } } })) },
      },
    })
    created++
  }

  return {
    ok: true,
    imported: created,
    skipped,
    total: bookmarks.length,
    collectionsCreated: collections.length,
  }
})
