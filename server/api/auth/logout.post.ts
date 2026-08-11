export default defineEventHandler(async (event) => {
  const session = await getBmSession(event)
  await session.clear()
  return { ok: true }
})
