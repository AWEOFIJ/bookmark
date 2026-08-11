export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = String(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  const existing = await prisma.collection.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: '收藏夾不存在' })

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = String(body.name).trim() || existing.name
  if (body.icon !== undefined) data.icon = body.icon ? String(body.icon) : null
  if (body.color !== undefined) data.color = body.color ? String(body.color) : null
  if (body.parentId !== undefined) data.parentId = body.parentId ? String(body.parentId) : null
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder)

  const collection = await prisma.collection.update({
    where: { id },
    data,
    include: { _count: { select: { bookmarks: true } } },
  })

  return collection
})
