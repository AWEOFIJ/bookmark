export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = String(getRouterParam(event, 'id') || '')
  const existing = await prisma.collection.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: '收藏夾不存在' })

  // onDelete: SetNull — 書籤與子收藏夾都會回到未分類
  await prisma.collection.delete({ where: { id } })
  return { ok: true }
})
