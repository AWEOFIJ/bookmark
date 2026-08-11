export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readBody(event)
  const name = String(body.name || '').trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: '請輸入收藏夾名稱' })

  const collection = await prisma.collection.create({
    data: {
      name,
      icon: body.icon ? String(body.icon) : undefined,
      color: body.color ? String(body.color) : undefined,
      parentId: body.parentId ? String(body.parentId) : undefined,
      sortOrder: Number(body.sortOrder) || 0,
    },
    include: { _count: { select: { bookmarks: true } } },
  })

  return { ...collection, children: [] }
})
