export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = String(getRouterParam(event, 'id') || '')
  const existing = await prisma.bookmark.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: '書籤不存在' })

  await prisma.bookmark.delete({ where: { id } })
  return { ok: true }
})
