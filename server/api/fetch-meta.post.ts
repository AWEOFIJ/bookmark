export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readBody(event)
  const url = String(body.url || '').trim()
  if (!url) throw createError({ statusCode: 400, statusMessage: '請輸入網址' })

  return await fetchUrlMeta(url)
})
