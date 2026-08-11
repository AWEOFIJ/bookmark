export default defineEventHandler(async (event) => {
  await requireUser(event)

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { bookmarks: true } } },
  })

  // Prisma 7.9 不支援 orderBy _count → JS 排序
  return tags
    .map((t) => ({
      id: t.id,
      name: t.name,
      count: t._count.bookmarks,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})
