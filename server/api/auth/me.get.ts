export default defineEventHandler(async (event) => {
  const session = await getBmSession(event)
  if (!session.data?.userId) {
    return { user: null }
  }
  const user = await prisma.user.findUnique({
    where: { id: session.data.userId as string },
    select: { id: true, email: true },
  })
  return { user }
})
