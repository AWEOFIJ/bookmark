import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: '請輸入帳號與密碼' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '帳號或密碼錯誤' })
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: '帳號或密碼錯誤' })
  }

  const session = await getBmSession(event)
  await session.update({ userId: user.id, email: user.email })

  return { id: user.id, email: user.email }
})
